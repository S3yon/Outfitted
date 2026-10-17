import type { PricePoint } from "./history.ts";

export type SeriesPoint = { time: number; value: number }; // unix seconds, dollars

// Price points → a step line for lightweight-charts: one value per second (it needs strictly
// ascending times), in dollars, with the current price carried on to `now`.
export function stepSeries(points: PricePoint[], now: string): SeriesPoint[] {
  const bySecond = new Map<number, number>();
  for (const p of [...points].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt))) {
    bySecond.set(Math.floor(Date.parse(p.checkedAt) / 1000), p.price / 100);
  }
  const series = [...bySecond].map(([time, value]) => ({ time, value }));
  const end = Math.floor(Date.parse(now) / 1000);
  const last = series.at(-1);
  if (last && end > last.time) series.push({ time: end, value: last.value });
  return series;
}
