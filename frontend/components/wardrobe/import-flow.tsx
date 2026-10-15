"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/use-app-store";
import { cn } from "@/lib/utils";
import { downscale } from "@/lib/import/downscale";
import { useEmbedder } from "@/lib/import/use-embedder";
import { groupDetections, splitDetection, type Detection, type Group } from "@/lib/import/group";
import { CATEGORIES, type Category } from "@/lib/import/parse";
import type { ClothingItem } from "@/db/schema";

const MAX_PHOTOS = 50;
const PARALLEL = 3;

type Found = Detection & { crop: string };

type DetectReply = {
  detections: { category: Category; description: string; color: string | null; crop: string; area: number }[];
};

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

// Camera-roll importer: pick outfit photos, find every garment, merge repeats, review, save.
// Renders the hidden file input; the page opens the picker through `onTrigger`.
export function ImportFlow({ onTrigger }: { onTrigger: (fn: () => void) => void }) {
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
      toast(`Importing the first ${MAX_PHOTOS} photos. ${selected.length - MAX_PHOTOS} left out.`);
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
      {files && <ImportSession files={files} onClose={() => setFiles(null)} />}
    </>
  );
}

type Phase = "finding" | "review" | "saving";

// Mounted only while an import runs, so the embedding model loads when the importer opens and
// the worker stops when it closes.
function ImportSession({ files, onClose }: { files: File[]; onClose: () => void }) {
  const { status: embedderStatus, embed } = useEmbedder();
  const addWardrobeItem = useAppStore((s) => s.addWardrobeItem);

  const [phase, setPhase] = useState<Phase>("finding");
  const [photos, setPhotos] = useState({ done: 0, failed: 0, unreadable: 0 });
  const [crops, setCrops] = useState({ found: 0, matched: 0 });
  const [found, setFound] = useState<Found[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const cancelled = useRef(false);
  const abort = useRef(new AbortController());

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controller = abort.current;
    return () => {
      document.body.style.overflow = previous;
      cancelled.current = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    find();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function find() {
    const all: Found[] = [];
    const embedding: Promise<void>[] = [];

    await eachLimit(files, PARALLEL, async (file, index) => {
      const photoId = `p${index}`;
      const blob = await downscale(file);
      if (cancelled.current) return;
      if (!blob) {
        setPhotos((p) => ({ ...p, unreadable: p.unreadable + 1 }));
        return;
      }
      try {
        const form = new FormData();
        form.append("file", blob, "photo.jpg");
        const res = await fetch("/api/import/detect", {
          method: "POST",
          body: form,
          signal: abort.current.signal,
        });
        if (!res.ok) throw new Error(`detect ${res.status}`);
        const { detections } = (await res.json()) as DetectReply;
        detections.forEach((d, j) => {
          const item: Found = { id: `${photoId}-${j}`, photoId, ...d };
          all.push(item);
          embedding.push(
            embed(item.id, item.crop).then((vector) => {
              if (vector) item.embedding = vector;
              setCrops((c) => ({ ...c, matched: c.matched + 1 }));
            }),
          );
        });
        setCrops((c) => ({ ...c, found: c.found + detections.length }));
        setPhotos((p) => ({ ...p, done: p.done + 1 }));
      } catch {
        if (cancelled.current) return;
        setPhotos((p) => ({ ...p, failed: p.failed + 1 }));
      }
    });

    await Promise.all(embedding);
    if (cancelled.current) return;
    setFound(all);
    setGroups(groupDetections(all));
    setPhase("review");
  }

  const byId = new Map(found.map((d) => [d.id, d]));
  const kept = groups.filter((g) => !skipped.has(g.id));
  const open = groups.find((g) => g.id === openId) ?? null;

  function toggle(id: string) {
    setSkipped((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function setCategory(groupId: string, category: Category) {
    setGroups((gs) => gs.map((g) => (g.id === groupId ? { ...g, category } : g)));
  }

  function notTheSame(detectionId: string) {
    const before = groups.find((g) => g.detectionIds.includes(detectionId));
    if (!before) return;
    const fromBefore = (g: Group) => g.detectionIds.every((id) => before.detectionIds.includes(id));
    // Both halves keep a category the user already picked.
    const next = splitDetection(groups, detectionId, found).map((g) =>
      fromBefore(g) ? { ...g, category: before.category } : g,
    );
    setGroups(next);
    // Stay on the crops that are left; the split one becomes its own tile in the grid.
    const rest = next.find((g) => fromBefore(g) && !g.detectionIds.includes(detectionId));
    setOpenId(rest?.id ?? null);
  }

  async function save() {
    setOpenId(null);
    setPhase("saving");
    let failed = 0;
    const done = new Set<string>();

    await eachLimit(kept, PARALLEL, async (group) => {
      const cover = byId.get(group.coverId)!;
      try {
        const res = await fetch("/api/import/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            crop: cover.crop,
            category: group.category,
            description: group.description,
            embedding: cover.embedding ?? null,
          }),
          signal: abort.current.signal,
        });
        if (!res.ok) throw new Error(`save ${res.status}`);
        addWardrobeItem((await res.json()) as ClothingItem);
        done.add(group.id);
        setSaved(new Set(done));
      } catch {
        failed++;
      }
    });

    if (cancelled.current) return;
    const added = done.size;
    if (added > 0) {
      toast.success(
        `${added} ${added === 1 ? "item" : "items"} added to your wardrobe` +
          (failed ? `. ${failed} failed.` : ""),
      );
    } else {
      toast.error("Could not save the items. Try again.");
    }
    if (failed === 0) return onClose();
    // Failed items stay in review so the user can try again.
    setGroups((gs) => gs.filter((g) => !done.has(g.id)));
    setSaved(new Set());
    setPhase("review");
  }

  function close() {
    if (phase === "saving") return;
    const losing = phase === "finding" || groups.length > 0;
    if (losing && !window.confirm("Stop the import? Found items will not be saved.")) return;
    onClose();
  }

  const handled = photos.done + photos.failed + photos.unreadable;
  const missed = photos.failed + photos.unreadable;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-background" role="dialog" aria-modal="true" aria-label="Import outfit photos">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-8">
        <p className="label-caps text-muted-foreground">Import outfit photos</p>
        <button onClick={close} disabled={phase === "saving"} aria-label="Close" className="disabled:opacity-40">
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
            {crops.found} {crops.found === 1 ? "item" : "items"} found
            {crops.found > 0 && ` · ${crops.matched} matched`}
          </p>
          {embedderStatus === "loading" && (
            <p className="max-w-xs text-xs text-muted-foreground">
              Loading the matching model (about 94 MB, first time only)
            </p>
          )}
          {embedderStatus === "failed" && (
            <p className="max-w-xs text-xs text-muted-foreground">
              Matching model unavailable. Repeats are matched by description instead.
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
              <div className="border-b border-border pb-5">
                <p className="label-caps text-muted-foreground">
                  From {photos.done} {photos.done === 1 ? "photo" : "photos"}
                  {missed > 0 && ` · ${missed} could not be read`}
                </p>
                <h2 className="mt-2 font-serif text-4xl leading-none tracking-tight md:text-5xl">
                  {groups.length === 0
                    ? "No clothes found"
                    : `Found ${groups.length} ${groups.length === 1 ? "item" : "items"}`}
                </h2>
                {groups.length > 0 && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    Tap an item to skip it. Open it to check the photos it was seen in.
                  </p>
                )}
              </div>

              {groups.length === 0 ? (
                <p className="py-24 text-center font-serif text-2xl text-muted-foreground">
                  Try photos where your whole outfit is in frame.
                </p>
              ) : (
                <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {groups.map((group) => (
                    <ReviewTile
                      key={group.id}
                      group={group}
                      cover={byId.get(group.coverId)!}
                      photoCount={new Set(group.detectionIds.map((id) => byId.get(id)!.photoId)).size}
                      kept={!skipped.has(group.id)}
                      saving={phase === "saving" && !skipped.has(group.id) && !saved.has(group.id)}
                      saved={saved.has(group.id)}
                      onToggle={() => toggle(group.id)}
                      onOpen={() => setOpenId(group.id)}
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
              {phase === "saving"
                ? `Saving ${saved.size} of ${kept.length}`
                : `${kept.length} of ${groups.length} kept`}
            </p>
            {groups.length === 0 ? (
              <Button size="lg" onClick={onClose}>Done</Button>
            ) : (
              <Button size="lg" disabled={kept.length === 0 || phase === "saving"} onClick={save}>
                {phase === "saving" && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
                Save {kept.length} {kept.length === 1 ? "item" : "items"}
              </Button>
            )}
          </div>
        </>
      )}

      {open && phase === "review" && (
        <GroupDetail
          group={open}
          crops={open.detectionIds.map((id) => byId.get(id)!)}
          onCategory={(c) => setCategory(open.id, c)}
          onSplit={notTheSame}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function ReviewTile({
  group,
  cover,
  photoCount,
  kept,
  saving,
  saved,
  onToggle,
  onOpen,
}: {
  group: Group;
  cover: Found;
  photoCount: number;
  kept: boolean;
  saving: boolean;
  saved: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  return (
    <div className={cn("flex flex-col transition-opacity", !kept && "opacity-40")}>
      <div className="relative aspect-[3/4] bg-white">
        <button onClick={onToggle} aria-pressed={kept} aria-label={kept ? "Skip item" : "Keep item"} className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={cover.crop} alt={group.description} className="h-full w-full object-contain p-5" />
        </button>
        <span
          className={cn(
            "pointer-events-none absolute right-2 top-2 flex size-5 items-center justify-center border",
            kept ? "border-foreground bg-foreground text-background" : "border-muted-foreground bg-white",
          )}
        >
          {kept && <Check className="size-3" />}
        </span>
        {(saving || saved) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            {saved ? <Check className="size-6 text-foreground" /> : <Loader2 className="size-6 animate-spin text-muted-foreground" />}
          </div>
        )}
      </div>
      <button onClick={onOpen} className="pt-3 text-left">
        <div className="flex items-baseline justify-between gap-2">
          <p className="label-caps truncate text-muted-foreground">{group.category}</p>
          {photoCount > 1 && (
            <p className="label-caps shrink-0 text-muted-foreground">Seen in {photoCount} photos</p>
          )}
        </div>
        <p className="mt-1 truncate text-sm text-foreground underline-offset-4 hover:underline">
          {group.description}
        </p>
      </button>
    </div>
  );
}

function GroupDetail({
  group,
  crops,
  onCategory,
  onSplit,
  onClose,
}: {
  group: Group;
  crops: Found[];
  onCategory: (category: Category) => void;
  onSplit: (detectionId: string) => void;
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
            <p className="label-caps text-muted-foreground">
              Seen in {crops.length} {crops.length === 1 ? "photo" : "photos"}
            </p>
            <p className="mt-2 font-serif text-3xl leading-tight">{group.description}</p>
          </div>
          <button onClick={onClose} aria-label="Close">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <div className="mt-4 flex gap-6 overflow-x-auto border-b border-border px-5 no-scrollbar sm:px-6">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => onCategory(c)}
              className={cn(
                "label-caps -mb-px shrink-0 border-b py-3 transition-colors",
                group.category === c
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 px-5 sm:px-6">
          {crops.map((crop) => (
            <div key={crop.id} className="flex flex-col">
              <div className="aspect-[3/4] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={crop.crop} alt={crop.description} className="h-full w-full object-contain p-3" />
              </div>
              {crops.length > 1 && (
                <button
                  onClick={() => onSplit(crop.id)}
                  className="label-caps mt-2 self-start text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  Not the same
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
