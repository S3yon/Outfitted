"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/use-app-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = ["tops", "bottoms", "outerwear", "shoes", "accessories"] as const;

export function OutfitBuilder({ onClose }: { onClose: () => void }) {
  const { wardrobeItems, outfits, setOutfits } = useAppStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const ownedItems = wardrobeItems.filter((i) => i.status === "owned");

  const filtered = activeCategory
    ? ownedItems.filter((i) => i.category === activeCategory)
    : ownedItems;

  function toggleItem(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (selectedIds.size < 2) {
      toast.error("Select at least 2 items");
      return;
    }

    setSaving(true);
    const res = await fetch("/api/outfits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name || "Custom Outfit", itemIds: [...selectedIds] }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to save" }));
      toast.error(err.error);
      setSaving(false);
      return;
    }

    const created = await res.json();
    setOutfits([created, ...outfits]);
    toast.success("Outfit created");
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl bg-background ring-1 ring-border"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Build Outfit</h2>
              <p className="text-xs text-muted-foreground">
                {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Name input */}
          <div className="border-b border-border px-5 py-3">
            <Input
              placeholder="Outfit name (e.g. 'Sunday Brunch')"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-1.5 overflow-x-auto border-b border-border px-5 py-3">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors",
                !activeCategory
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                  activeCategory === cat
                    ? "bg-foreground text-background"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Item grid */}
          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
              {filtered.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-xl border-2 bg-secondary transition-all",
                      isSelected
                        ? "border-foreground ring-2 ring-foreground/20"
                        : "border-border hover:border-muted-foreground",
                    )}
                  >
                    <Image
                      src={item.cloudinaryUrl}
                      alt={item.notes ?? item.category}
                      fill
                      className="object-contain p-2"
                      sizes="120px"
                    />
                    {isSelected && (
                      <div className="absolute right-1 top-1 rounded-full bg-foreground p-0.5">
                        <Check className="size-3 text-background" />
                      </div>
                    )}
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-[9px] capitalize text-white">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No items in this category
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-border px-5 py-4">
            <Button
              size="lg"
              className="w-full"
              onClick={handleSave}
              disabled={saving || selectedIds.size < 2}
            >
              {saving ? "Saving..." : "Create Outfit"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
