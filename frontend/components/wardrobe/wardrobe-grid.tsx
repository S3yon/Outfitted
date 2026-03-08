"use client";

import Image from "next/image";
import { Trash2, Check, Heart } from "lucide-react";
import { useAppStore } from "@/stores/use-app-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ClothingItem } from "@/db/schema";

const CATEGORIES = [null, "tops", "bottoms", "shoes", "outerwear", "accessories"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  shoes: "Shoes",
  outerwear: "Outerwear",
  accessories: "Accessories",
};

export function WardrobeGrid() {
  const {
    wardrobeItems,
    activeCategory,
    setActiveCategory,
    activeStatus,
    setActiveStatus,
    removeWardrobeItem,
  } = useAppStore();

  const filtered = wardrobeItems
    .filter((i) => (activeCategory ? i.category === activeCategory : true))
    .filter((i) => (activeStatus ? i.status === activeStatus : true));

  async function handleDelete(item: ClothingItem) {
    const res = await fetch(`/api/items/${item.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete item");
      return;
    }
    removeWardrobeItem(item.id);
    toast.success("Item removed");
  }

  return (
    <div>
      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat ?? "all"}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-xs transition-all",
              activeCategory === cat
                ? "border-gold bg-gold/10 text-foreground"
                : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20",
            )}
          >
            {cat ? CATEGORY_LABELS[cat] : "All"}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="mt-3 flex gap-2">
        {(["owned", "wishlisted"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(activeStatus === s ? null : s)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs capitalize transition-all",
              activeStatus === s
                ? "border-gold bg-gold/10 text-foreground"
                : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20",
            )}
          >
            {s === "owned" ? "Owned" : "Wishlist"}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            {wardrobeItems.length === 0
              ? "Your wardrobe is empty. Upload your first item."
              : "No items match your filters."}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  onDelete,
}: {
  item: ClothingItem;
  onDelete: (item: ClothingItem) => void;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white transition-shadow hover:shadow-lg hover:shadow-black/20">
      {/* Status badge */}
      <div className="absolute left-2 top-2 z-10">
        {item.status === "owned" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-medium text-black">
            <Check className="size-2.5" />
            Owned
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-neon/90 px-2 py-0.5 text-[10px] font-medium text-black">
            <Heart className="size-2.5" />
            Wishlist
          </span>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(item)}
        className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1.5 text-white/60 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 className="size-3.5" />
      </button>

      {/* Image */}
      <div className="relative aspect-[3/4]">
        <Image
          src={item.cloudinaryUrl}
          alt={item.category}
          fill
          className="object-contain p-3"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
      </div>

      {/* Info overlay */}
      <div className="absolute inset-x-0 bottom-0 translate-y-full bg-black/70 p-2.5 backdrop-blur-sm transition-transform group-hover:translate-y-0">
        <p className="text-xs font-medium capitalize text-white">{item.category}</p>
        {item.notes && (
          <p className="mt-0.5 truncate text-[10px] text-white/60">{item.notes}</p>
        )}
      </div>
    </div>
  );
}
