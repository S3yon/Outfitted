"use client";

import { useState } from "react";
import Image from "next/image";
import { Shuffle, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/use-app-store";
import { cn } from "@/lib/utils";

const SEASONS = ["Spring", "Summer", "Fall", "Winter"] as const;
const OCCASIONS = ["Any", "Casual", "Work", "Night Out", "Gym", "Formal"] as const;
const CATEGORY_ORDER = ["tops", "bottoms", "shoes", "outerwear", "accessories"];

type Props = {
  defaultSeason: string;
  onClose: () => void;
  onGenerate: (opts: { season: string; occasion: string | null; anchorItemIds: string[]; surpriseMe: boolean }) => void;
  generating: boolean;
};

export function OutfitGenerateSheet({ defaultSeason, onClose, onGenerate, generating }: Props) {
  const { wardrobeItems } = useAppStore();
  const owned = wardrobeItems.filter((i) => i.status === "owned");

  const [season, setSeason] = useState<string>(defaultSeason);
  const [occasion, setOccasion] = useState<string>("Any");
  const [anchorIds, setAnchorIds] = useState<string[]>([]);

  function toggleAnchor(id: string) {
    setAnchorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleGenerate() {
    onGenerate({
      season,
      occasion: occasion === "Any" ? null : occasion,
      anchorItemIds: anchorIds,
      surpriseMe: false,
    });
  }

  function handleSurprise() {
    onGenerate({ season, occasion: null, anchorItemIds: [], surpriseMe: true });
  }

  const sortedOwned = [...owned].sort(
    (a, b) => CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category)
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-foreground/30" onClick={onClose}>
      <div
        className="relative w-full max-w-lg overflow-hidden border border-border bg-background"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <p className="label-caps text-muted-foreground">From your owned pieces</p>
          <h2 className="mt-1.5 font-serif text-3xl leading-none">Generate outfits</h2>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[70vh] px-5 py-4 space-y-5">

          {/* Season */}
          <div>
            <p className="label-caps text-muted-foreground/60">Season</p>
            <div className="flex flex-wrap gap-x-5 border-b border-border">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeason(s)}
                  className={cn(
                    "label-caps -mb-px border-b py-2.5 transition-colors",
                    season === s
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion */}
          <div>
            <p className="label-caps text-muted-foreground/60">Occasion</p>
            <div className="flex flex-wrap gap-x-5 border-b border-border">
              {OCCASIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => setOccasion(o)}
                  className={cn(
                    "label-caps -mb-px border-b py-2.5 transition-colors",
                    occasion === o
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {/* Anchor items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="label-caps text-muted-foreground/60">
                Build around
              </p>
              {anchorIds.length > 0 && (
                <button
                  onClick={() => setAnchorIds([])}
                  className="label-caps text-muted-foreground hover:text-foreground"
                >
                  Clear ({anchorIds.length})
                </button>
              )}
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Pick pieces to keep in every outfit.
            </p>
            {owned.length === 0 ? (
              <p className="font-serif text-xl text-muted-foreground">No owned items yet.</p>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {sortedOwned.map((item) => {
                  const selected = anchorIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleAnchor(item.id)}
                      className={cn(
                        "relative aspect-square overflow-hidden border bg-white transition-colors",
                        selected ? "border-foreground" : "border-transparent hover:border-border"
                      )}
                    >
                      <Image
                        src={item.cloudinaryUrl}
                        alt={item.notes ?? item.category}
                        fill
                        className="object-contain p-1"
                        sizes="80px"
                      />
                      {selected && (
                        <div className="absolute right-1 top-1 bg-foreground p-0.5">
                          <Check className="size-3 text-background" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex items-center justify-between gap-3">
          <Button
            variant="outline"
            onClick={handleSurprise}
            disabled={generating}
            className="gap-2"
          >
            <Shuffle className="size-4" />
            Surprise me
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={generating}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              <Sparkles className="size-4" />
              {generating ? "Generating" : "Generate"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
