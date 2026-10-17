import type { Product } from "@/lib/buy/read";
import type { BuyCheck } from "@/lib/buy/verdict";

export type BuyProduct = Product & { itemId?: string };
export type ShownItem = { id: string; category: string; notes: string | null; imageUrl: string };
export type CheckReply = { check: BuyCheck; reasonBy: "model" | "rules"; items: ShownItem[] };

// The same image through the guarded proxy, so the embedder (in a worker) can read its pixels.
export const proxied = (url: string) =>
  `${typeof location === "undefined" ? "" : location.origin}/api/buy/image?u=${encodeURIComponent(url)}`;
