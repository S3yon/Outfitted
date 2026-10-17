"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/wear/price";
import type { WatchItem } from "@/lib/watch/view";

// The wishlist as market rows: price now, change since first seen, 90-day low.
export function WatchList({
  items,
  selectedId,
  seenAt,
  onSelect,
}: {
  items: WatchItem[];
  selectedId: string | null;
  seenAt: string | null;
  onSelect: (item: WatchItem) => void;
}) {
  return (
    <div>
      <div className="label-caps grid grid-cols-[1fr_80px_60px] gap-4 border-b border-border pb-3 text-muted-foreground sm:grid-cols-[1fr_100px_80px_100px]">
        <span>Item</span>
        <span className="text-right">Price</span>
        <span className="text-right">Change</span>
        <span className="hidden text-right sm:block">90-day low</span>
      </div>
      {items.map((item) => {
        const s = item.summary;
        const fresh = Boolean(item.lastDropAt && (!seenAt || item.lastDropAt > seenAt));
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            aria-pressed={item.id === selectedId}
            className={cn(
              "grid w-full grid-cols-[1fr_80px_60px] gap-4 border-b border-border py-3 text-left transition-colors hover:bg-secondary sm:grid-cols-[1fr_100px_80px_100px]",
              item.id === selectedId && "bg-secondary",
            )}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative size-12 shrink-0 bg-white">
                <Image src={item.imageUrl} alt={item.title} fill unoptimized className="object-contain p-1" sizes="48px" />
              </div>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-sm">
                  {fresh && <span aria-label="Price dropped" className="size-1.5 shrink-0 rounded-full bg-emerald-700" />}
                  <span className="truncate">{item.title}</span>
                </p>
                <p className="label-caps mt-0.5 truncate text-muted-foreground">{item.store ?? "No link"}</p>
              </div>
            </div>
            <p className="self-center text-right font-mono text-sm">{s ? formatCents(s.current) : "—"}</p>
            <p
              className={cn(
                "self-center text-right font-mono text-sm",
                !s || s.changePct === 0 ? "text-muted-foreground" : s.changePct < 0 ? "text-emerald-700" : "text-red-700",
              )}
            >
              {s ? `${s.changePct > 0 ? "+" : ""}${s.changePct}%` : "—"}
            </p>
            <p className="hidden self-center text-right font-mono text-sm text-muted-foreground sm:block">
              {s ? formatCents(s.low90) : "—"}
            </p>
          </button>
        );
      })}
    </div>
  );
}
