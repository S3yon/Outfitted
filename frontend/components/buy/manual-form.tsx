"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/buy/category";
import { parsePrice } from "@/lib/wear/price";
import type { BuyProduct } from "./types";

const field =
  "w-full border-b border-border bg-transparent py-2.5 text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground focus:outline-none";

// When the store won't be read: the user types what the page shows. Prefilled with whatever
// the read did find (a title from the link, an image from a search).
export function ManualForm({ product, onCheck }: { product: BuyProduct; onCheck: (p: BuyProduct) => void }) {
  const [title, setTitle] = useState(product.title ?? "");
  const [price, setPrice] = useState(product.price ? (product.price / 100).toFixed(2) : "");
  const [category, setCategory] = useState(product.category);
  const [imageUrl, setImageUrl] = useState(product.imageUrl ?? "");
  const cents = parsePrice(price);

  return (
    <form
      className="mt-8 grid gap-6 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        onCheck({ ...product, title: title.trim(), price: cents, category, imageUrl: imageUrl.trim() || null, via: "manual" });
      }}
    >
      <p className="text-sm text-muted-foreground sm:col-span-2">
        {product.store ? `${product.store} didn't let us read the page.` : "We couldn't read that page."} Fill in what it
        shows and we&apos;ll check it against your closet.
      </p>
      <label className="sm:col-span-2">
        <span className="label-caps block text-muted-foreground">Item</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Relaxed linen shirt" style={{ fontSize: 16 }} className={field} />
      </label>
      <label>
        <span className="label-caps block text-muted-foreground">Price</span>
        <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="49.90" style={{ fontSize: 16 }} className={`${field} font-mono`} />
      </label>
      <label>
        <span className="label-caps block text-muted-foreground">Category</span>
        <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ fontSize: 16 }} className={`${field} capitalize`}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className="label-caps block text-muted-foreground">Image link (optional, needed to save it)</span>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://" style={{ fontSize: 16 }} className={field} />
      </label>
      <div className="sm:col-span-2">
        <Button size="lg" type="submit" disabled={!title.trim() || cents === null}>
          Check it
        </Button>
      </div>
    </form>
  );
}
