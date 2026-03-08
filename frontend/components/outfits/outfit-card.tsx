"use client";

import Image from "next/image";
import { Camera, Trash2 } from "lucide-react";
import type { PopulatedOutfit } from "@/stores/use-app-store";
import type { ClothingItem } from "@/db/schema";

function findByCategory(items: ClothingItem[], category: string): ClothingItem | undefined {
  return items.find((i) => i.category === category);
}

export function OutfitCard({
  outfit,
  onDelete,
  onTryOn,
}: {
  outfit: PopulatedOutfit;
  onDelete: (id: string) => void;
  onTryOn: (outfit: PopulatedOutfit) => void;
}) {
  const top = findByCategory(outfit.items, "tops");
  const bottom = findByCategory(outfit.items, "bottoms");
  const shoes = findByCategory(outfit.items, "shoes");
  const outerwear = findByCategory(outfit.items, "outerwear");
  const accessory = findByCategory(outfit.items, "accessories");

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white shadow-lg shadow-black/20">
      {/* Action buttons */}
      <div className="absolute right-3 top-3 z-10 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onTryOn(outfit)}
          className="rounded-full bg-black/60 p-1.5 text-white/60 transition-colors hover:text-white"
        >
          <Camera className="size-3.5" />
        </button>
        <button
          onClick={() => onDelete(outfit.id)}
          className="rounded-full bg-black/60 p-1.5 text-white/60 transition-colors hover:text-red-400"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {/* Flatlay grid */}
      <div className="relative aspect-[3/4] p-4">
        {/* Top - upper left */}
        {top && (
          <div className="absolute left-4 top-4 h-[45%] w-[45%]">
            <Image
              src={top.cloudinaryUrl}
              alt="Top"
              fill
              className="object-contain"
              sizes="200px"
            />
          </div>
        )}

        {/* Outerwear - upper right */}
        {outerwear && (
          <div className="absolute right-4 top-4 h-[45%] w-[45%]">
            <Image
              src={outerwear.cloudinaryUrl}
              alt="Outerwear"
              fill
              className="object-contain"
              sizes="200px"
            />
          </div>
        )}

        {/* Accessory - upper right (if no outerwear) */}
        {!outerwear && accessory && (
          <div className="absolute right-4 top-4 h-[35%] w-[35%]">
            <Image
              src={accessory.cloudinaryUrl}
              alt="Accessory"
              fill
              className="object-contain"
              sizes="150px"
            />
          </div>
        )}

        {/* Bottom - lower left */}
        {bottom && (
          <div className="absolute bottom-4 left-4 h-[45%] w-[45%]">
            <Image
              src={bottom.cloudinaryUrl}
              alt="Bottom"
              fill
              className="object-contain"
              sizes="200px"
            />
          </div>
        )}

        {/* Shoes - lower right */}
        {shoes && (
          <div className="absolute bottom-4 right-4 h-[35%] w-[40%]">
            <Image
              src={shoes.cloudinaryUrl}
              alt="Shoes"
              fill
              className="object-contain"
              sizes="180px"
            />
          </div>
        )}

        {/* Accessory - center right (if outerwear already used) */}
        {outerwear && accessory && (
          <div className="absolute right-4 top-1/2 h-[20%] w-[25%] -translate-y-1/2">
            <Image
              src={accessory.cloudinaryUrl}
              alt="Accessory"
              fill
              className="object-contain"
              sizes="120px"
            />
          </div>
        )}
      </div>

      {/* Name overlay */}
      <div className="bg-black/80 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold">
          {outfit.outfit_description ?? outfit.explanation}
        </p>
      </div>
    </div>
  );
}
