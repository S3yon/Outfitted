import { cosine } from "../import/group.ts";
import { formatCents } from "../wear/price.ts";
import { examples, unlocks, type Unlocks } from "./outfits.ts";

// Same line the wear matcher uses for "this is that item". Under it, the closest item is still
// shown down to SHOW_AT so the user can judge.
export const DUPLICATE_AT = 0.85;
export const SHOW_AT = 0.75;
const WAIT_ABOVE_LOW = 0.05; // 5% over the 30-day low
const DEFAULT_WEARS = 30; // a year, when the category has no wear history

export type OwnedItem = {
  id: string;
  category: string;
  wears: number;
  daysOwned: number;
  embedding: number[] | null;
  notes: string | null;
};
export type Verdict = "buy" | "skip" | "wait";
export type Match = { itemId: string; score: number };

export function closest(embedding: number[] | null, owned: OwnedItem[], category: string): Match | null {
  if (!embedding) return null;
  let best: Match | null = null;
  for (const item of owned) {
    if (item.category !== category || !item.embedding) continue;
    const s = Math.round(cosine(embedding, item.embedding) * 1000) / 1000;
    if (s >= SHOW_AT && (!best || s > best.score)) best = { itemId: item.id, score: s };
  }
  return best;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

// How often a new item of this category would be worn in a year: the median yearly rate of
// the owned items in it that have been worn at all.
export function expectedWears(owned: OwnedItem[], category: string): number {
  const rates = owned
    .filter((i) => i.category === category && i.wears > 0)
    .map((i) => (i.wears / Math.max(i.daysOwned, 30)) * 365);
  return rates.length ? Math.max(1, Math.round(median(rates) * 10) / 10) : DEFAULT_WEARS;
}

export type ScoreInput = {
  before: number;
  added: number;
  duplicate: number | null;
  categoryCount: number;
  medianCategoryCount: number;
  costPerWear: number | null;
};

// 0-100. New outfits score on the better of two scales: absolute (20 new ≈ full marks) and
// relative to what the closet makes now (doubling it is full marks). Then up to 40 off for a
// look-alike, 20 for a crowded category, 20 for cost per wear over $5.
export function score(s: ScoreInput): number {
  if (s.added <= 0) return 0;
  const absolute = (100 * Math.log(1 + s.added)) / Math.log(21);
  const relative = (100 * s.added) / Math.max(1, s.before);
  let total = Math.min(100, Math.max(absolute, relative));
  if (s.duplicate !== null && s.duplicate >= SHOW_AT) {
    total -= Math.min(40, (40 * (s.duplicate - SHOW_AT)) / (DUPLICATE_AT - SHOW_AT));
  }
  if (s.categoryCount >= 4 && s.medianCategoryCount > 0 && s.categoryCount > s.medianCategoryCount) {
    total -= Math.min(20, (20 * (s.categoryCount - s.medianCategoryCount)) / s.medianCategoryCount);
  }
  if (s.costPerWear !== null && s.costPerWear > 500) {
    total -= Math.min(20, ((s.costPerWear - 500) / 500) * 20);
  }
  return Math.max(0, Math.round(total));
}

export type BuyInput = {
  category: string;
  price: number | null; // cents
  embedding: number[] | null;
  owned: OwnedItem[];
  low30: number | null; // cents, from price history when the item is watched
};

export type BuyCheck = {
  outfits: Unlocks;
  examples: string[][];
  duplicate: Match | null;
  expectedWears: number;
  costPerWear: number | null;
  score: number;
  verdict: Verdict;
  reason: string;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export function checkBuy(input: BuyInput): BuyCheck {
  const { category, price, owned } = input;
  const outfits = unlocks(owned, category);
  const match = closest(input.embedding, owned, category);
  const wears = expectedWears(owned, category);
  const costPerWear = price === null ? null : Math.round(price / wears);
  const counts = ["tops", "bottoms", "shoes", "outerwear", "accessories"]
    .map((c) => owned.filter((i) => i.category === c).length)
    .filter((n) => n > 0);
  const total = score({
    before: outfits.before,
    added: outfits.added,
    duplicate: match?.score ?? null,
    categoryCount: owned.filter((i) => i.category === category).length,
    medianCategoryCount: counts.length ? median(counts) : 0,
    costPerWear,
  });

  const twin = match && match.score >= DUPLICATE_AT ? owned.find((i) => i.id === match.itemId) : null;
  const overLow = price !== null && input.low30 !== null && price >= input.low30 * (1 + WAIT_ABOVE_LOW);
  const perWear = costPerWear === null ? "" : ` About ${formatCents(costPerWear)} a wear over a year.`;

  let verdict: Verdict;
  let reason: string;
  if (twin) {
    verdict = "skip";
    reason = `Looks like your ${twin.notes ?? "own " + category.replace(/s$/, "")} (${Math.round(match!.score * 100)}% match). Skip it, or let that one go.`;
  } else if (outfits.missing.length) {
    verdict = "skip";
    reason = `You own no ${outfits.missing.join(" or ")}, so it makes no outfit yet.`;
  } else if (overLow) {
    verdict = "wait";
    reason = `It was ${formatCents(input.low30!)} in the last 30 days. Wait for it to come back down.`;
  } else if (total >= 50) {
    verdict = "buy";
    reason = `Unlocks ${plural(outfits.added, "new outfit")} with what you own.${perWear}`;
  } else {
    verdict = "skip";
    reason = `Only ${plural(outfits.added, "new outfit")} for the price.${perWear}`;
  }

  return {
    outfits,
    examples: examples(owned, category, 3),
    duplicate: match,
    expectedWears: wears,
    costPerWear,
    score: total,
    verdict,
    reason,
  };
}
