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
        className="fixed inset-0 z-[80] flex items-center justify-center bg-foreground/30"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col border border-border bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <p className="label-caps text-muted-foreground">
                {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
              </p>
              <h2 className="mt-1.5 font-serif text-3xl leading-none">Build an outfit</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5 stroke-[1.5]" />
            </button>
          </div>

          {/* Name input */}
          <div className="border-b border-border px-5 py-3">
            <Input
              placeholder="Outfit name, e.g. Sunday brunch"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-6 overflow-x-auto no-scrollbar border-b border-border px-5">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "label-caps -mb-px shrink-0 border-b py-3 transition-colors",
                !activeCategory
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              All
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "label-caps -mb-px shrink-0 border-b py-3 transition-colors",
                  activeCategory === cat
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
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
                      "relative aspect-square overflow-hidden border bg-white transition-colors",
                      isSelected
                        ? "border-foreground"
                        : "border-transparent hover:border-border",
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
                      <div className="absolute right-1 top-1 bg-foreground p-0.5">
                        <Check className="size-3 text-background" />
                      </div>
                    )}
                    <span className="absolute inset-x-0 bottom-0 px-1.5 py-1 text-left text-[0.5625rem] uppercase tracking-[0.12em] text-muted-foreground">
                      {item.category}
                    </span>
                  </button>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <p className="py-8 text-center font-serif text-xl text-muted-foreground">
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
              {saving ? "Saving" : "Create outfit"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
