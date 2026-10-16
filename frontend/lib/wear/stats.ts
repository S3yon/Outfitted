import { parsePrice } from "./price.ts";

// Not worn for this many days (or since it was added) and it's worth a resale nudge.
export const IDLE_DAYS = 60;
const RECENT_DAYS = 30;

export type StatItem = { id: string; status: string; price: string | null; createdAt: string };
export type WearLog = { itemId: string; wornOn: string }; // wornOn: YYYY-MM-DD

export type ItemStats = {
  id: string;
  wears: number;
  lastWorn: string | null;
  daysIdle: number;
  idle: boolean;
  price: number | null; // cents
  costPerWear: number | null; // cents; the full price while unworn
};

export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to.slice(0, 10)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}

// Per owned item: wears, last wear, cost per wear, idle. Plus the three numbers on the Wear tab.
export function wearStats(all: StatItem[], logs: WearLog[], today: string) {
  const owned = all.filter((i) => i.status === "owned");
  const byItem = new Map<string, string[]>(owned.map((i) => [i.id, []]));
  for (const log of logs) byItem.get(log.itemId)?.push(log.wornOn);

  const items: ItemStats[] = owned.map((i) => {
    const dates = byItem.get(i.id)!;
    const lastWorn = dates.length ? dates.reduce((a, b) => (b > a ? b : a)) : null;
    const daysIdle = daysBetween(lastWorn ?? i.createdAt, today);
    const price = parsePrice(i.price);
    return {
      id: i.id,
      wears: dates.length,
      lastWorn,
      daysIdle,
      idle: daysIdle >= IDLE_DAYS,
      price,
      costPerWear: price === null ? null : Math.round(price / Math.max(1, dates.length)),
    };
  });

  const wears30 = [...byItem.values()]
    .flat()
    .filter((d) => daysBetween(d, today) <= RECENT_DAYS && d <= today).length;
  const priced = items.filter((i) => i.costPerWear !== null && i.wears > 0);
  const avgCostPerWear = priced.length
    ? Math.round(priced.reduce((sum, i) => sum + i.costPerWear!, 0) / priced.length)
    : null;

  return { items, summary: { wears30, avgCostPerWear, idle: items.filter((i) => i.idle).length } };
}
