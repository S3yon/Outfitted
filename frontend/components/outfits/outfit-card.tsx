"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, Shirt, SlidersHorizontal, ImageOff } from "lucide-react";
import { useAppStore } from "@/stores/use-app-store";
import type { PopulatedOutfit } from "@/stores/use-app-store";
import { toast } from "sonner";

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
  const { capturedImages, outfits, setOutfits } = useAppStore();
  const hasSlider = !!(outfit.modelImageUrl && capturedImages[outfit.id]);
  const [removingPhoto, setRemovingPhoto] = useState(false);

  async function handleRemovePhoto(e: React.MouseEvent) {
    e.stopPropagation();
    setRemovingPhoto(true);
    try {
      const res = await fetch(`/api/outfits/${outfit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelImageUrl: null }),
      });
      if (!res.ok) throw new Error();
      setOutfits(outfits.map((o) => o.id === outfit.id ? { ...o, modelImageUrl: null } : o));
      toast.success("Photo removed");
    } catch {
      toast.error("Failed to remove photo");
    }
    setRemovingPhoto(false);
  }

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
          className="rounded-full bg-secondary p-1.5 text-muted-foreground opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
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
        <div className="relative min-h-[280px] flex-1">
          {outfit.modelImageUrl ? (
            <>
              <Image
                src={outfit.modelImageUrl}
                alt="Try-on result"
                fill
                className="object-cover"
                sizes="400px"
              />
              {/* Desktop: hover overlay with slider hint + remove photo */}
              <div className="absolute inset-0 hidden flex-col items-center justify-between bg-black/0 p-3 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100 md:flex">
                <button
                  onClick={handleRemovePhoto}
                  disabled={removingPhoto}
                  className="ml-auto flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-sm transition-colors hover:bg-red-500/80 disabled:opacity-50"
                >
                  <ImageOff className="size-3" />
                  {removingPhoto ? "Removing..." : "Remove photo"}
                </button>
                {hasSlider && (
                  <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-black">
                    <SlidersHorizontal className="size-3.5" />
                    View slider
                  </div>
                )}
              </div>
              {/* Mobile: always-visible remove button in top-right corner */}
              <button
                onClick={handleRemovePhoto}
                disabled={removingPhoto}
                className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors active:bg-red-500/80 disabled:opacity-50 md:hidden"
              >
                <ImageOff className="size-3.5" />
              </button>
            </>
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
