"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PopulatedOutfit } from "@/stores/use-app-store";

const CATEGORY_ORDER = ["tops", "bottoms", "shoes", "outerwear", "accessories"];

function getTodayKey() {
  return `daily-dismissed-${new Date().toISOString().slice(0, 10)}`;
}

// Module-level cache — deduplicates concurrent fetches across mounts/re-renders
let _dailyCache: PopulatedOutfit | null | undefined = undefined;
let _dailyPromise: Promise<PopulatedOutfit | null> | null = null;

function fetchDailyOutfit(): Promise<PopulatedOutfit | null> {
  if (_dailyCache !== undefined) return Promise.resolve(_dailyCache);
  if (!_dailyPromise) {
    _dailyPromise = fetch("/api/outfit/daily")
      .then((r) => r.json())
      .then((d) => {
        _dailyCache = d.outfit ?? null;
        return _dailyCache!;
      })
      .catch(() => {
        _dailyCache = null;
        return null;
      });
  }
  return _dailyPromise;
}

export function DailyOutfitCard() {
  // Read straight from localStorage on first render. Safe because this card
  // only mounts after the wardrobe page's client-side fetch, never during
  // server render — if that changes, this becomes a hydration mismatch.
  const [dismissed, setDismissed] = useState(
    () => typeof window !== "undefined" && !!localStorage.getItem(getTodayKey()),
  );
  const [outfit, setOutfit] = useState<PopulatedOutfit | null>(null);
  const [loading, setLoading] = useState(!dismissed);

  useEffect(() => {
    if (dismissed) return;
    fetchDailyOutfit()
      .then((outfit) => setOutfit(outfit))
      .finally(() => setLoading(false));
  }, [dismissed]);

  function dismiss() {
    localStorage.setItem(getTodayKey(), "1");
    setDismissed(true);
  }

  if (dismissed || (!loading && !outfit)) return null;

  if (loading) {
    return (
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:gap-6">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="size-16" />)}
        </div>
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    );
  }

  if (!outfit) return null;

  const sortedItems = [...outfit.items].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );
  const tags = [outfit.occasion, outfit.season].filter(Boolean).join(" · ");

  return (
    <div className="relative mb-8 flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-center md:gap-6">
      {/* Thumbnails */}
      <div className="flex gap-2">
        {sortedItems.slice(0, 4).map((item) => (
          <div
            key={item.id}
            className="relative aspect-square flex-1 bg-white md:size-16 md:flex-none"
          >
            <Image
              src={item.cloudinaryUrl}
              alt={item.notes ?? item.category}
              fill
              className="object-contain p-1.5"
              sizes="80px"
            />
          </div>
        ))}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1 pr-8 md:pr-0">
        <p className="label-caps text-muted-foreground">Today&apos;s look</p>
        <p className="mt-1.5 font-serif text-2xl leading-tight text-foreground md:truncate">
          {outfit.outfit_description ?? outfit.explanation}
        </p>
        {tags && <p className="label-caps mt-1.5 text-muted-foreground">{tags}</p>}
      </div>

      {/* CTA */}
      <Link
        href="/outfits"
        className="label-caps flex shrink-0 items-center justify-center gap-1.5 bg-foreground px-5 py-3 text-background transition-opacity hover:opacity-80"
      >
        View outfit
        <ArrowRight className="size-3.5" />
      </Link>

      {/* Dismiss */}
      <button
        onClick={dismiss}
        className="absolute right-0 top-0 p-1 text-muted-foreground transition-colors hover:text-foreground md:static md:order-last"
        aria-label="Dismiss"
      >
        <X className="size-4 stroke-[1.5]" />
      </button>
    </div>
  );
}
