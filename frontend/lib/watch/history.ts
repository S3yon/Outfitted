// Wishlist price history. A point is stored only when the price changes, so each point is the
// price from its checkedAt until the next point.
export type PricePoint = { price: number; checkedAt: string }; // price in cents, ISO time

const DAY = 86_400_000;

export function isStale(checkedAt: string | null, now: string, hours: number): boolean {
  return !checkedAt || Date.parse(now) - Date.parse(checkedAt) >= hours * 3_600_000;
}

export function shouldStore(last: number | null, price: number | null): boolean {
  return price !== null && price !== last;
}

const byTime = (points: PricePoint[]) => [...points].sort((a, b) => a.checkedAt.localeCompare(b.checkedAt));

// Prices in force at any time in the last `days`: every point inside the window, plus the one
// that was current when the window opened.
function inWindow(sorted: PricePoint[], now: string, days: number): number[] {
  const start = Date.parse(now) - days * DAY;
  const inside = sorted.filter((p) => Date.parse(p.checkedAt) >= start);
  const before = sorted.filter((p) => Date.parse(p.checkedAt) < start).at(-1);
  return [...(before ? [before] : []), ...inside].map((p) => p.price);
}

export type PriceSummary = {
  current: number;
  first: number;
  changePct: number; // current vs first, whole percent
  allTimeLow: number;
  low30: number;
  low90: number;
  high30: number;
  dropped: boolean; // the latest change was down
};

export function summary(points: PricePoint[], now: string): PriceSummary | null {
  if (!points.length) return null;
  const sorted = byTime(points);
  const current = sorted.at(-1)!.price;
  const first = sorted[0].price;
  const last30 = inWindow(sorted, now, 30);
  return {
    current,
    first,
    changePct: Math.round(((current - first) / first) * 100),
    allTimeLow: Math.min(...sorted.map((p) => p.price)),
    low30: Math.min(...last30),
    low90: Math.min(...inWindow(sorted, now, 90)),
    high30: Math.max(...last30),
    dropped: sorted.length > 1 && current < sorted.at(-2)!.price,
  };
}

// For the Market tab's dot: did the price go down after the user last looked?
export function droppedSince(points: PricePoint[], seenAt: string | null): boolean {
  const sorted = byTime(points);
  if (sorted.length < 2) return false;
  const last = sorted.at(-1)!;
  return last.price < sorted.at(-2)!.price && (!seenAt || last.checkedAt > seenAt);
}
