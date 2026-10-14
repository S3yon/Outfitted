"use client";

import { useState } from "react";
import Image from "next/image";
import { Trash2, SlidersHorizontal, ImageOff } from "lucide-react";
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

  const tags = [outfit.occasion, outfit.season].filter(Boolean).join(" · ");

  return (
    <div onClick={onClick} className="group cursor-pointer">
      {/* Image: try-on result, or the items laid out on white */}
      <div className="relative aspect-[4/5] bg-white">
        {outfit.modelImageUrl ? (
          <>
            <Image
              src={outfit.modelImageUrl}
              alt="Try-on result"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            />
            <div className="absolute inset-x-0 bottom-0 hidden items-center justify-between bg-background/90 px-3 py-2 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
              <span className="label-caps flex items-center gap-1.5">
                {hasSlider && <SlidersHorizontal className="size-3" />}
                {hasSlider ? "View slider" : "View"}
              </span>
              <button
                onClick={handleRemovePhoto}
                disabled={removingPhoto}
                className="label-caps flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
              >
                <ImageOff className="size-3" />
                {removingPhoto ? "Removing" : "Remove photo"}
              </button>
            </div>
            <button
              onClick={handleRemovePhoto}
              disabled={removingPhoto}
              aria-label="Remove photo"
              className="absolute right-2 top-2 z-10 flex size-8 items-center justify-center bg-background text-foreground disabled:opacity-50 md:hidden"
            >
              <ImageOff className="size-3.5" />
            </button>
          </>
        ) : (
          <div className="grid h-full grid-cols-2 gap-px p-6">
            {sortedItems.slice(0, 4).map((item) => (
              <div key={item.id} className="relative">
                <Image
                  src={item.cloudinaryUrl}
                  alt={item.notes ?? item.category}
                  fill
                  className="object-contain p-2"
                  sizes="160px"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="mt-3 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="label-caps text-muted-foreground">
            {tags || `${outfit.items.length} pieces`}
            {outfit.modelImageUrl ? "" : " · Try on"}
          </p>
          <p className="mt-1.5 line-clamp-2 text-sm text-foreground">
            {outfit.outfit_description ?? outfit.explanation}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(outfit.id);
          }}
          aria-label="Delete outfit"
          className="shrink-0 p-1 text-muted-foreground transition-colors hover:text-destructive md:opacity-0 md:group-hover:opacity-100"
        >
          <Trash2 className="size-3.5 stroke-[1.5]" />
        </button>
      </div>
    </div>
  );
}
