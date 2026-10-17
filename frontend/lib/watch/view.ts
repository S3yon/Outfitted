import type { PricePoint, PriceSummary } from "./history.ts";

// One wishlist row on the Market Wishlist tab (GET /api/watch).
export type WatchItem = {
  id: string;
  title: string;
  imageUrl: string;
  store: string | null;
  productUrl: string | null;
  targetPrice: number | null; // cents
  currency: string | null;
  checkedAt: string | null;
  points: PricePoint[];
  summary: PriceSummary | null;
  lastDropAt: string | null;
};
