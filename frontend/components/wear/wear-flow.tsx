"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { downscale } from "@/lib/import/downscale";
import { useEmbedder } from "@/lib/import/use-embedder";
import { exifDate } from "@/lib/wear/exif-date";
import { matchPhoto, type Crop } from "@/lib/wear/match";
import { localDay, wearEntries } from "@/lib/wear/review";
import type { LogEntry } from "@/lib/wear/log-input";
import type { Category } from "@/lib/import/parse";

const MAX_PHOTOS = 30;
const PARALLEL = 3;
// EXIF sits in the first segment of a JPEG; canvas downscaling drops it, so read it first.
const EXIF_BYTES = 128 * 1024;

type ClosetEntry = {
  id: string;
  category: string;
  cloudinaryUrl: string;
  notes: string | null;
  embedding: number[] | null;
};

type DetectReply = {
  detections: { category: Category; description: string; crop: string }[];
};

type Photo = { id: string; thumb: string; date: string; crops: Crop[] };

// One review row per photo: the items it shows (matched or added) and the ones unticked.
type Row = { id: string; thumb: string; date: string; itemIds: string[]; off: Set<string>; missing: number };

// Run `fn` over `items`, at most `limit` at a time.
async function eachLimit<T>(items: T[], limit: number, fn: (item: T, index: number) => Promise<void>) {
  let next = 0;
  const run = async () => {
    while (next < items.length) {
      const i = next++;
      await fn(items[i], i);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
}

async function takenOn(file: File): Promise<string> {
  try {
    const bytes = new Uint8Array(await file.slice(0, EXIF_BYTES).arrayBuffer());
    const day = exifDate(bytes);
    if (day) return day;
  } catch {
    // unreadable slice: fall back to the file date
  }
  return localDay(new Date(file.lastModified));
}

// Wear log from photos: pick outfit photos, find each garment, match it to the closet, review,
// log a wear per item and day. Renders the hidden file input; the page opens the picker
// through `onTrigger` and gets the logged entries through `onLogged`.
export function WearFlow({
  onTrigger,
  onLogged,
}: {
  onTrigger: (fn: () => void) => void;
  onLogged: (entries: LogEntry[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[] | null>(null);

  useEffect(() => {
    onTrigger(() => inputRef.current?.click());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (selected.length === 0) return;
    if (selected.length > MAX_PHOTOS) {
      toast(`Reading the first ${MAX_PHOTOS} photos. ${selected.length - MAX_PHOTOS} left out.`);
    }
    setFiles(selected.slice(0, MAX_PHOTOS));
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleSelect}
      />
      {files && <WearSession files={files} onLogged={onLogged} onClose={() => setFiles(null)} />}
    </>
  );
}

type Phase = "finding" | "review" | "logging";

// Mounted only while a run is open, so the embedding model loads when it opens and the worker
// stops when it closes.
function WearSession({
  files,
  onLogged,
  onClose,
}: {
  files: File[];
  onLogged: (entries: LogEntry[]) => void;
  onClose: () => void;
}) {
  const { status: embedderStatus, embed } = useEmbedder();

  const [phase, setPhase] = useState<Phase>("finding");
  const [photos, setPhotos] = useState({ done: 0, failed: 0, unreadable: 0 });
  const [found, setFound] = useState(0);
  const [backfill, setBackfill] = useState({ done: 0, total: 0 });
  const [closet, setCloset] = useState<ClosetEntry[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const thumbs = useRef<string[]>([]);
  // Aborted when the overlay closes; stops in-flight requests and any work still queued.
  const abort = useRef(new AbortController());

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const urls = thumbs.current;
    return () => {
      document.body.style.overflow = previous;
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // A fresh controller per mount: Strict Mode mounts twice in dev, and the first run must stop.
  useEffect(() => {
    const controller = new AbortController();
    abort.current = controller;
    find(controller.signal);
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Owned items with a vector. Items saved before the importer have none: embed their image in
  // the same worker and save it, so the next run skips them.
  async function loadCloset(signal: AbortSignal): Promise<ClosetEntry[]> {
    const res = await fetch("/api/wear/closet", { signal });
    if (!res.ok) throw new Error(`closet ${res.status}`);
    const { items } = (await res.json()) as { items: ClosetEntry[] };
    const missing = items.filter((i) => !i.embedding);
    setBackfill({ done: 0, total: missing.length });
    await Promise.all(
      missing.map(async (item) => {
        const vector = await embed(`item-${item.id}`, item.cloudinaryUrl);
        setBackfill((b) => ({ ...b, done: b.done + 1 }));
        if (!vector || signal.aborted) return;
        item.embedding = vector;
        fetch(`/api/items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ embedding: vector }),
        }).catch(() => {}); // a failed save only means it is embedded again next time
      }),
    );
    return items;
  }

  async function find(signal: AbortSignal) {
    const all: Photo[] = [];
    const embedding: Promise<void>[] = [];
    const closetReady = loadCloset(signal).catch(() => null);

    await eachLimit(files, PARALLEL, async (file, index) => {
      if (signal.aborted) return;
      const date = await takenOn(file);
      const blob = await downscale(file);
      if (signal.aborted) return;
      if (!blob) {
        setPhotos((p) => ({ ...p, unreadable: p.unreadable + 1 }));
        return;
      }
      try {
        const form = new FormData();
        form.append("file", blob, "photo.jpg");
        const res = await fetch("/api/import/detect", { method: "POST", body: form, signal });
        if (!res.ok) throw new Error(`detect ${res.status}`);
        const { detections } = (await res.json()) as DetectReply;
        const thumb = URL.createObjectURL(blob);
        thumbs.current.push(thumb);
        const photo: Photo = { id: `p${index}`, thumb, date, crops: [] };
        detections.forEach((d, j) => {
          const crop: Crop = { id: `${photo.id}-${j}`, category: d.category };
          photo.crops.push(crop);
          embedding.push(
            embed(crop.id, d.crop).then((vector) => {
              if (vector) crop.embedding = vector;
            }),
          );
        });
        all.push(photo);
        setFound((n) => n + detections.length);
        setPhotos((p) => ({ ...p, done: p.done + 1 }));
      } catch {
        if (signal.aborted) return;
        setPhotos((p) => ({ ...p, failed: p.failed + 1 }));
      }
    });

    const [items] = await Promise.all([closetReady, Promise.all(embedding)]);
    if (signal.aborted) return;
    if (!items) toast.error("Could not load your closet. Add the items by hand.");
    const known = items ?? [];
    setCloset(known);
    setRows(
      all
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .map((photo) => {
          const matches = matchPhoto(photo.crops, known);
          return {
            id: photo.id,
            thumb: photo.thumb,
            date: photo.date,
            itemIds: matches.flatMap((m) => (m.itemId ? [m.itemId] : [])),
            off: new Set(),
            missing: matches.filter((m) => !m.itemId).length,
          };
        }),
    );
    setPhase("review");
  }

  const byId = new Map(closet.map((i) => [i.id, i]));
  const entries = wearEntries(rows.map((r) => ({ date: r.date, itemIds: r.itemIds.filter((id) => !r.off.has(id)) })));
  const picking = rows.find((r) => r.id === pickerFor) ?? null;
  const today = localDay(new Date());

  function updateRow(id: string, change: (row: Row) => Row) {
    setRows((rs) => rs.map((r) => (r.id === id ? change(r) : r)));
  }

  function toggle(rowId: string, itemId: string) {
    updateRow(rowId, (r) => {
      const off = new Set(r.off);
      if (off.has(itemId)) off.delete(itemId);
      else off.add(itemId);
      return { ...r, off };
    });
  }

  function addItem(rowId: string, itemId: string) {
    updateRow(rowId, (r) => (r.itemIds.includes(itemId) ? r : { ...r, itemIds: [...r.itemIds, itemId] }));
    setPickerFor(null);
  }

  async function log() {
    setPickerFor(null);
    setPhase("logging");
    const { signal } = abort.current;
    try {
      const res = await fetch("/api/wear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries }),
        signal,
      });
      if (!res.ok) throw new Error(`wear ${res.status}`);
      const { added } = (await res.json()) as { added: number };
      toast.success(
        added === 0
          ? "Those wears were already logged"
          : `${added} ${added === 1 ? "wear" : "wears"} logged`,
      );
      onLogged(entries);
      onClose();
    } catch {
      if (signal.aborted) return;
      toast.error("Could not log the wears. Try again.");
      setPhase("review");
    }
  }

  function close() {
    if (phase === "logging") return;
    const losing = phase === "finding" || entries.length > 0;
    if (losing && !window.confirm("Stop? These wears will not be logged.")) return;
    onClose();
  }

  const handled = photos.done + photos.failed + photos.unreadable;
  const missed = photos.failed + photos.unreadable;
  const matched = rows.reduce((n, r) => n + r.itemIds.length, 0);
  const days = new Set(entries.map((e) => e.wornOn)).size;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background" role="dialog" aria-modal="true" aria-label="Log wears from photos">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-8">
        <p className="label-caps text-muted-foreground">Log wears from photos</p>
        <button onClick={close} disabled={phase === "logging"} aria-label="Close" className="disabled:opacity-40">
          <X className="size-5 text-muted-foreground" />
        </button>
      </div>

      {phase === "finding" ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Loader2 className="size-8 animate-spin stroke-[1.5] text-foreground" />
          <p className="font-serif text-3xl leading-none text-foreground sm:text-4xl">
            Reading photo {Math.min(handled + 1, files.length)} of {files.length}
          </p>
          <div className="w-full max-w-xs">
            <div className="h-px w-full bg-border">
              <div
                className="h-px bg-foreground transition-[width] duration-300"
                style={{ width: `${(handled / files.length) * 100}%` }}
              />
            </div>
          </div>
          <p className="label-caps text-muted-foreground">
            {found} {found === 1 ? "item" : "items"} found
            {backfill.total > 0 && ` · closet ${backfill.done} of ${backfill.total} ready`}
          </p>
          {embedderStatus === "loading" && (
            <p className="max-w-xs text-xs text-muted-foreground">
              Loading the matching model (about 94 MB, first time only)
            </p>
          )}
          {embedderStatus === "failed" && (
            <p className="max-w-xs text-xs text-muted-foreground">
              Matching model unavailable. Add the items you wore by hand.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
              <div className="border-b border-border pb-5">
                <p className="label-caps text-muted-foreground">
                  From {photos.done} {photos.done === 1 ? "photo" : "photos"}
                  {missed > 0 && ` · ${missed} could not be read`}
                </p>
                <h2 className="mt-2 font-serif text-4xl leading-none tracking-tight md:text-5xl">
                  {rows.length === 0
                    ? "No outfits found"
                    : matched === 0
                      ? "No closet items matched"
                      : `Matched ${matched} ${matched === 1 ? "item" : "items"}`}
                </h2>
                {rows.length > 0 && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Tap an item to leave it out. Fix the date if the photo was taken another day.
                  </p>
                )}
              </div>

              {rows.length === 0 ? (
                <p className="py-24 text-center font-serif text-2xl text-muted-foreground">
                  Try photos where your whole outfit is in frame.
                </p>
              ) : (
                <div>
                  {rows.map((row) => (
                    <PhotoRow
                      key={row.id}
                      row={row}
                      items={row.itemIds.map((id) => byId.get(id)).filter((i): i is ClosetEntry => !!i)}
                      today={today}
                      canAdd={closet.length > 0}
                      disabled={phase === "logging"}
                      onDate={(date) => updateRow(row.id, (r) => ({ ...r, date }))}
                      onToggle={(itemId) => toggle(row.id, itemId)}
                      onAdd={() => setPickerFor(row.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between gap-4 border-t border-border bg-background px-5 pt-4 sm:px-8"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <p className="label-caps text-muted-foreground">
              {entries.length === 0 ? "Nothing to log" : `${days} ${days === 1 ? "day" : "days"}`}
            </p>
            {rows.length === 0 ? (
              <Button size="lg" onClick={onClose}>Done</Button>
            ) : (
              <Button size="lg" disabled={entries.length === 0 || phase === "logging"} onClick={log}>
                {phase === "logging" && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
                Log {entries.length} {entries.length === 1 ? "wear" : "wears"}
              </Button>
            )}
          </div>
        </>
      )}

      {picking && phase === "review" && (
        <ClosetPicker
          closet={closet.filter((i) => !picking.itemIds.includes(i.id))}
          onPick={(itemId) => addItem(picking.id, itemId)}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  );
}

function PhotoRow({
  row,
  items,
  today,
  canAdd,
  disabled,
  onDate,
  onToggle,
  onAdd,
}: {
  row: Row;
  items: ClosetEntry[];
  today: string;
  canAdd: boolean;
  disabled: boolean;
  onDate: (date: string) => void;
  onToggle: (itemId: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="flex gap-4 border-b border-border py-6 sm:gap-6">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={row.thumb} alt="Outfit photo" className="aspect-[3/4] w-20 shrink-0 self-start object-cover sm:w-28" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <label className="flex items-baseline gap-3">
            <span className="label-caps text-muted-foreground">Worn on</span>
            <input
              type="date"
              value={row.date}
              max={today}
              disabled={disabled}
              onChange={(e) => onDate(e.target.value)}
              className="border-b border-border bg-transparent pb-0.5 text-sm text-foreground focus:border-foreground focus:outline-none"
            />
          </label>
          {row.missing > 0 && (
            <p className="label-caps text-muted-foreground">{row.missing} not in your closet</p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {items.map((item) => {
            const on = !row.off.has(item.id);
            return (
              <button
                key={item.id}
                onClick={() => onToggle(item.id)}
                disabled={disabled}
                aria-pressed={on}
                aria-label={`${on ? "Leave out" : "Include"} ${item.notes ?? item.category}`}
                className={cn("relative w-16 transition-opacity sm:w-20", !on && "opacity-40")}
              >
                <div className="aspect-[3/4] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.cloudinaryUrl} alt="" className="h-full w-full object-contain p-2" />
                </div>
                <span
                  className={cn(
                    "pointer-events-none absolute right-1 top-1 flex size-4 items-center justify-center border",
                    on ? "border-foreground bg-foreground text-background" : "border-muted-foreground bg-white",
                  )}
                >
                  {on && <Check className="size-2.5" />}
                </span>
                <p className="label-caps mt-1.5 truncate text-left text-muted-foreground">{item.category}</p>
              </button>
            );
          })}
          {canAdd && (
            <button
              onClick={onAdd}
              disabled={disabled}
              className="flex w-16 flex-col sm:w-20"
            >
              <div className="flex aspect-[3/4] w-full items-center justify-center border border-dashed border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground">
                <Plus className="size-4" />
              </div>
              <p className="label-caps mt-1.5 text-left text-muted-foreground">Add item</p>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ClosetPicker({
  closet,
  onPick,
  onClose,
}: {
  closet: ClosetEntry[];
  onPick: (itemId: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <div className="fixed inset-0 z-[95] bg-foreground/30" onClick={onClose} />
      <div
        className="fixed inset-x-0 bottom-0 z-[96] max-h-[85vh] overflow-y-auto border-t border-border bg-background md:inset-x-auto md:inset-y-0 md:right-0 md:max-h-none md:w-[440px] md:border-l md:border-t-0"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
          <div>
            <p className="label-caps text-muted-foreground">Your closet</p>
            <p className="mt-2 font-serif text-3xl leading-tight">Add an item you wore</p>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>
        {closet.length === 0 ? (
          <p className="px-5 py-12 text-sm text-muted-foreground sm:px-6">Every item is already on this photo.</p>
        ) : (
          <div className="mt-6 grid grid-cols-3 gap-x-3 gap-y-6 px-5 sm:px-6">
            {closet.map((item) => (
              <button key={item.id} onClick={() => onPick(item.id)} className="flex flex-col text-left">
                <div className="aspect-[3/4] bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.cloudinaryUrl} alt="" className="h-full w-full object-contain p-2" />
                </div>
                <p className="label-caps mt-2 truncate text-muted-foreground">{item.category}</p>
                <p className="mt-0.5 truncate text-sm text-foreground">{item.notes ?? item.category}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
