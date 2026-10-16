"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Check, Images, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { WearFlow } from "@/components/wear/wear-flow";
import { useAppStore } from "@/stores/use-app-store";
import { wearStats, IDLE_DAYS, type ItemStats, type WearLog } from "@/lib/wear/stats";
import { formatCents } from "@/lib/wear/price";
import { localDay, rankByCostPerWear, recentWears } from "@/lib/wear/review";
import type { ClothingItem } from "@/db/schema";

const RECENT_DAYS = 14;

function name(item: ClothingItem) {
  return item.notes || item.category;
}

function dayLabel(day: string, today: string) {
  const date = new Date(`${day}T12:00:00`);
  const yesterday = localDay(new Date(new Date(`${today}T12:00:00`).getTime() - 86_400_000));
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function WearPage() {
  const { user: auth0User, isLoading: authLoading } = useUser();
  const { wardrobeItems, setWardrobeItems, updateWardrobeItem, removeWardrobeItem } = useAppStore();
  const [logs, setLogs] = useState<WearLog[]>([]);
  const [loading, setLoading] = useState(true);
  const flowTriggerRef = useRef<(() => void) | undefined>(undefined);

  async function fetchAll() {
    const [items, wear] = await Promise.all([fetch("/api/wardrobe"), fetch("/api/wear")]);
    if (items.ok) setWardrobeItems(await items.json());
    if (wear.ok) setLogs(((await wear.json()) as { logs: WearLog[] }).logs);
    setLoading(false);
  }

  useEffect(() => {
    if (!auth0User) return;
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth0User]);

  function addLogs(entries: WearLog[]) {
    setLogs((prev) => {
      const seen = new Set(prev.map((l) => `${l.itemId}|${l.wornOn}`));
      const fresh = entries
        .filter((e) => !seen.has(`${e.itemId}|${e.wornOn}`))
        .map(({ itemId, wornOn }) => ({ itemId, wornOn }));
      return [...prev, ...fresh];
    });
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const today = localDay(new Date());
  const { items: stats, summary } = wearStats(wardrobeItems, logs, today);
  const byId = new Map(wardrobeItems.map((i) => [i.id, i]));
  const wornToday = new Set(logs.filter((l) => l.wornOn === today).map((l) => l.itemId));
  const idle = stats.filter((s) => s.idle).sort((a, b) => b.daysIdle - a.daysIdle);
  const ranked = rankByCostPerWear(stats);
  const recent = recentWears(logs, today, RECENT_DAYS);

  async function woreToday(id: string) {
    try {
      const res = await fetch("/api/wear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: [{ itemId: id, wornOn: today, source: "manual" }] }),
      });
      if (!res.ok) throw new Error(`wear ${res.status}`);
      addLogs([{ itemId: id, wornOn: today }]);
    } catch {
      toast.error("Could not log the wear. Try again.");
    }
  }

  async function remove(item: ClothingItem) {
    if (!window.confirm(`Remove ${name(item)} from your wardrobe?`)) return;
    const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Could not remove the item. Try again.");
    removeWardrobeItem(item.id);
    toast.success("Removed from your wardrobe");
  }

  async function savePrice(id: string, price: string) {
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price }),
    });
    if (!res.ok) {
      toast.error("Enter a price like 45 or $45.00");
      return false;
    }
    const updated = (await res.json()) as ClothingItem;
    updateWardrobeItem(id, { price: updated.price });
    return true;
  }

  return (
    <PullToRefresh onRefresh={fetchAll}>
      <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
        <Link href="/?home=1" className="mb-6 block font-serif text-2xl leading-none md:hidden">
          Outfitted
        </Link>
        <div className="flex items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="label-caps text-muted-foreground">
              {stats.length} {stats.length === 1 ? "item" : "items"} in your closet
            </p>
            <h1 className="mt-2 font-serif text-5xl leading-none tracking-tight md:text-6xl">Wear</h1>
          </div>
          <Button size="lg" onClick={() => flowTriggerRef.current?.()}>
            <Images className="size-4" data-icon="inline-start" />
            Log from photos
          </Button>
        </div>
        <WearFlow onTrigger={(fn) => { flowTriggerRef.current = fn; }} onLogged={addLogs} />

        {/* Three figures */}
        <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
          <Figure value={String(summary.wears30)} label="Wears, 30 days" />
          <Figure
            value={summary.avgCostPerWear === null ? "None" : formatCents(summary.avgCostPerWear)}
            label="Avg cost per wear"
          />
          <Figure value={String(summary.idle)} label={`Idle ${IDLE_DAYS}+ days`} />
        </div>

        {stats.length === 0 ? (
          <p className="py-24 text-center font-serif text-2xl text-muted-foreground">
            Add clothes on the Wardrobe tab, then log what you wear here.
          </p>
        ) : (
          <>
            {idle.length > 0 && (
              <Section title="Sell or donate?" note={`Not worn in ${IDLE_DAYS} days or more`}>
                {idle.map((s) => {
                  const item = byId.get(s.id)!;
                  return (
                    <ItemRow key={s.id} item={item}>
                      <p className="text-sm text-muted-foreground">
                        {s.lastWorn ? `Last worn ${s.daysIdle} days ago` : `Not worn in the ${s.daysIdle} days since you added it`}
                      </p>
                      <div className="mt-2 flex gap-5">
                        <WoreToday done={wornToday.has(s.id)} onClick={() => woreToday(s.id)} />
                        <TextButton onClick={() => remove(item)}>Remove</TextButton>
                      </div>
                    </ItemRow>
                  );
                })}
              </Section>
            )}

            <Section title="Cost per wear" note="Worst value first">
              {ranked.map((s, i) => (
                <ItemRow key={s.id} item={byId.get(s.id)!} rank={i + 1} aside={<CostCell stats={s} onSave={(p) => savePrice(s.id, p)} />}>
                  <p className="text-sm text-muted-foreground">
                    {s.wears === 0 ? "Not worn yet" : `${s.wears} ${s.wears === 1 ? "wear" : "wears"}`}
                  </p>
                  <div className="mt-2">
                    <WoreToday done={wornToday.has(s.id)} onClick={() => woreToday(s.id)} />
                  </div>
                </ItemRow>
              ))}
            </Section>

            <Section title={`Last ${RECENT_DAYS} days`}>
              {recent.length === 0 ? (
                <p className="py-8 text-sm text-muted-foreground">Nothing logged yet. Log from photos, or tap Wore today.</p>
              ) : (
                recent.map(({ day, itemIds }) => (
                  <div key={day} className="flex items-start gap-4 border-b border-border py-4 sm:gap-6">
                    <p className="label-caps w-24 shrink-0 pt-1 text-muted-foreground sm:w-32">{dayLabel(day, today)}</p>
                    <div className="flex flex-wrap gap-2">
                      {itemIds.map((id) => {
                        const item = byId.get(id);
                        if (!item) return null;
                        return (
                          <div key={id} className="aspect-[3/4] w-12 bg-white" title={name(item)}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.cloudinaryUrl} alt={name(item)} className="h-full w-full object-contain p-1" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </Section>
          </>
        )}
      </div>
    </PullToRefresh>
  );
}

function Figure({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-3 py-6 first:pl-0 sm:px-6">
      <p className="font-serif text-3xl leading-none sm:text-5xl">{value}</p>
      <p className="label-caps mt-3 text-muted-foreground">{label}</p>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
        <h2 className="font-serif text-3xl leading-none">{title}</h2>
        {note && <p className="label-caps hidden text-right text-muted-foreground sm:block">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function ItemRow({
  item,
  rank,
  aside,
  children,
}: {
  item: ClothingItem;
  rank?: number;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 border-b border-border py-4 sm:gap-6">
      {rank !== undefined && (
        <p className="label-caps w-5 shrink-0 pt-1 text-muted-foreground">{rank}</p>
      )}
      <div className="aspect-[3/4] w-14 shrink-0 bg-white sm:w-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.cloudinaryUrl} alt={name(item)} className="h-full w-full object-contain p-1.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="label-caps text-muted-foreground">{item.category}</p>
        <p className="mt-1 truncate text-sm text-foreground">{name(item)}</p>
        <div className="mt-1">{children}</div>
      </div>
      {aside && <div className="shrink-0 text-right">{aside}</div>}
    </div>
  );
}

function CostCell({ stats, onSave }: { stats: ItemStats; onSave: (price: string) => Promise<boolean> }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  if (stats.costPerWear !== null) {
    return (
      <>
        <p className="font-serif text-2xl leading-none">{formatCents(stats.costPerWear)}</p>
        <p className="label-caps mt-2 text-muted-foreground">
          {stats.wears === 0 ? "Full price" : "A wear"}
        </p>
      </>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || saving) return;
    setSaving(true);
    if (await onSave(value)) setValue("");
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-col items-end gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Add price"
        inputMode="decimal"
        aria-label="Price"
        className="w-24 border-b border-border bg-transparent pb-0.5 text-right text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
      />
      {value.trim() && (
        <button type="submit" disabled={saving} className="label-caps text-foreground underline-offset-4 hover:underline disabled:opacity-40">
          {saving ? "Saving" : "Save"}
        </button>
      )}
    </form>
  );
}

function WoreToday({ done, onClick }: { done: boolean; onClick: () => void }) {
  if (done) {
    return (
      <p className="label-caps flex items-center gap-1 text-foreground">
        <Check className="size-3" /> Worn today
      </p>
    );
  }
  return <TextButton onClick={onClick}>Wore today</TextButton>;
}

function TextButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="label-caps text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
    >
      {children}
    </button>
  );
}
