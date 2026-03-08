"use client";

import Image from "next/image";
import { Trash2, Shirt } from "lucide-react";
import type { PopulatedOutfit } from "@/stores/use-app-store";

const CATEGORY_ORDER = ["accessories", "outerwear", "tops", "bottoms", "shoes"];

export function OutfitCard({
  outfit,
  onDelete,
  onClick,
}: {
  outfit: PopulatedOutfit;
  onDelete: (id: string) => void;
  onClick: () => void;
}) {
  const sortedItems = [...outfit.items].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category),
  );

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl border border-border bg-background transition-shadow hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          {outfit.outfit_description ?? outfit.explanation}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(outfit.id);
          }}
          className="rounded-full bg-secondary p-2 text-muted-foreground transition-all hover:text-red-500 md:opacity-0 md:p-1.5 md:group-hover:opacity-100"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Content: items left, try-on result right */}
      <div className="flex">
        {/* Left: item thumbnails */}
        <div className="flex w-[100px] shrink-0 flex-col gap-1 border-r border-border bg-secondary/50 p-2">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="relative aspect-square overflow-hidden rounded-lg bg-background"
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

        {/* Right: try-on result or empty */}
        <div className="relative min-h-[180px] flex-1 sm:min-h-[280px]">
          {outfit.modelImageUrl ? (
            <Image
              src={outfit.modelImageUrl}
              alt="Try-on result"
              fill
              className="object-cover"
              sizes="400px"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 bg-secondary/20">
              <Shirt className="size-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground/50">Click to try on</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
