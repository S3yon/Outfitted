import { readEmbedding } from "../wear/item-patch.ts";
import { daysBetween, type WearLog } from "../wear/stats.ts";
import type { OwnedItem } from "./verdict.ts";

type Row = { id: string; category: string; notes: string | null; createdAt: string; embedding: string | null };

// Owned item rows + the user's wear logs → what checkBuy needs per item.
export function ownedForCheck(items: Row[], logs: WearLog[], today: string): OwnedItem[] {
  const wears = new Map<string, number>();
  for (const log of logs) wears.set(log.itemId, (wears.get(log.itemId) ?? 0) + 1);
  return items.map((i) => ({
    id: i.id,
    category: i.category,
    notes: i.notes,
    wears: wears.get(i.id) ?? 0,
    daysOwned: Math.max(0, daysBetween(i.createdAt, today)),
    embedding: readEmbedding(i.embedding),
  }));
}
