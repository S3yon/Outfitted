"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Sparkles, ArrowRight } from "lucide-react";
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
  const [outfit, setOutfit] = useState<PopulatedOutfit | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(getTodayKey())) {
      setDismissed(true);
      setLoading(false);
      return;
    }
    fetchDailyOutfit()
      .then((outfit) => setOutfit(outfit))
      .finally(() => setLoading(false));
  }, []);

  function dismiss() {
    localStorage.setItem(getTodayKey(), "1");
    setDismissed(true);
  }

  if (dismissed || (!loading && !outfit)) return null;

  if (loading) {
    return (
      <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-amber-50/60 to-orange-50/40 dark:from-amber-950/20 dark:to-orange-950/10 p-4">
        {/* Mobile skeleton: label row + name + thumbnails + button */}
        <div className="flex flex-col gap-3 md:hidden">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="size-16 rounded-xl" />)}
          </div>
          <Skeleton className="h-9 w-full rounded-full" />
        </div>
        {/* Desktop skeleton: horizontal */}
        <div className="hidden md:flex items-center gap-4">
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="size-14 rounded-xl" />)}
          </div>
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-8 w-20 rounded-full" />
        </div>
      </div>
    );
  }

  if (!outfit) return null;

  const sortedItems = [...outfit.items].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl border border-amber-200/60 dark:border-amber-800/30 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/25 dark:to-orange-950/15">

      {/* ── Mobile layout ── */}
      <div className="md:hidden p-4 flex flex-col gap-3">
        {/* Top row: label + dismiss */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-amber-500" />
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Today&apos;s Look
            </span>
          </div>
          <button
            onClick={dismiss}
            className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>

        {/* Outfit name */}
        <p className="text-base font-semibold tracking-tight text-foreground leading-tight">
          {outfit.outfit_description ?? outfit.explanation}
        </p>

        {/* Badges */}
        {(outfit.occasion || outfit.season) && (
          <div className="flex items-center gap-1.5 flex-wrap -mt-1">
            {outfit.occasion && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                {outfit.occasion}
              </span>
            )}
            {outfit.season && (
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                {outfit.season}
              </span>
            )}
          </div>
        )}

        {/* Thumbnails row */}
        <div className="flex gap-2">
          {sortedItems.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="relative flex-1 aspect-square overflow-hidden rounded-xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/10"
            >
              <Image
                src={item.cloudinaryUrl}
                alt={item.notes ?? item.category}
                fill
                className="object-contain p-1"
                sizes="80px"
              />
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/outfits"
          className="flex items-center justify-center gap-1.5 rounded-full bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity"
        >
          View Outfit
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* ── Desktop layout ── */}
      <div className="hidden md:flex items-center gap-4 p-4 pr-10">
        {/* Thumbnails */}
        <div className="flex gap-2 shrink-0">
          {sortedItems.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="relative size-14 overflow-hidden rounded-xl bg-white/70 dark:bg-white/10 border border-white/60 dark:border-white/10"
            >
              <Image
                src={item.cloudinaryUrl}
                alt={item.notes ?? item.category}
                fill
                className="object-contain p-0.5"
                sizes="56px"
              />
            </div>
          ))}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 mb-0.5">
            <Sparkles className="size-3 text-amber-500" />
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Today&apos;s Look
            </span>
          </div>
          <p className="text-sm font-semibold tracking-tight text-foreground truncate">
            {outfit.outfit_description ?? outfit.explanation}
          </p>
          {(outfit.occasion || outfit.season) && (
            <div className="flex items-center gap-1.5 mt-1">
              {outfit.occasion && (
                <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-300">
                  {outfit.occasion}
                </span>
              )}
              {outfit.season && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {outfit.season}
                </span>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <Link
          href="/outfits"
          className="shrink-0 flex items-center gap-1 rounded-full bg-foreground px-4 py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity"
        >
          View
          <ArrowRight className="size-3" />
        </Link>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="size-3.5" />
        </button>
      </div>

    </div>
  );
}
