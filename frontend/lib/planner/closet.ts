import { IDLE_DAYS, wearStats, type StatItem, type WearLog } from "../wear/stats.ts";

export type ClosetItem = StatItem & { category: string; notes: string | null };

// What get_closet hands the model: short, no URLs or prices.
export type ClosetEntry = {
  id: string;
  category: string;
  notes: string;
  wears: number;
  daysIdle: number;
  lastWorn: string | null;
};

const NOTE_CHARS = 80;

// Owned items with their wear stats, longest idle first so the model sees them first.
export function closetForModel(items: ClosetItem[], logs: WearLog[], today: string): ClosetEntry[] {
  const byId = new Map(items.map((i) => [i.id, i]));
  return wearStats(items, logs, today)
    .items.map((s) => {
      const item = byId.get(s.id)!;
      return {
        id: s.id,
        category: item.category,
        notes: (item.notes ?? "").slice(0, NOTE_CHARS),
        wears: s.wears,
        daysIdle: s.daysIdle,
        lastWorn: s.lastWorn,
      };
    })
    .sort((a, b) => b.daysIdle - a.daysIdle);
}

// One line for the steps list: "24 items, 5 idle 60+ days".
export function closetSummary(closet: ClosetEntry[]): string {
  if (closet.length === 0) return "Closet is empty";
  const idle = closet.filter((c) => c.daysIdle >= IDLE_DAYS).length;
  return `${closet.length} item${closet.length === 1 ? "" : "s"}, ${idle} idle ${IDLE_DAYS}+ days`;
}
