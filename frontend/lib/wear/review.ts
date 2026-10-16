import { daysBetween, type WearLog } from "./stats.ts";
import type { LogEntry } from "./log-input.ts";

// YYYY-MM-DD in the browser's time zone: a wear belongs to the day the user lived it.
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Review rows (one per photo) → POST /api/wear entries, one per item and day. Rows without a
// date are skipped; the review keeps the date field filled, so that only happens if cleared.
export function wearEntries(rows: { date: string; itemIds: string[] }[]): LogEntry[] {
  const seen = new Set<string>();
  const entries: LogEntry[] = [];
  for (const { date, itemIds } of rows) {
    if (!date) continue;
    for (const itemId of itemIds) {
      const key = `${itemId}|${date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      entries.push({ itemId, wornOn: date, source: "photo" });
    }
  }
  return entries;
}

// Wears in the last `days` days (today included), grouped by day, newest first.
export function recentWears(logs: WearLog[], today: string, days: number) {
  const byDay = new Map<string, string[]>();
  for (const log of logs) {
    if (log.wornOn > today || daysBetween(log.wornOn, today) >= days) continue;
    const ids = byDay.get(log.wornOn) ?? [];
    if (!ids.includes(log.itemId)) ids.push(log.itemId);
    byDay.set(log.wornOn, ids);
  }
  return [...byDay.entries()]
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([day, itemIds]) => ({ day, itemIds }));
}

// Worst value first (highest cost per wear), so the list reads as "wear these more". Items
// with no price go last, where the price field asks for one.
export function rankByCostPerWear<T extends { costPerWear: number | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => (b.costPerWear ?? -1) - (a.costPerWear ?? -1));
}
