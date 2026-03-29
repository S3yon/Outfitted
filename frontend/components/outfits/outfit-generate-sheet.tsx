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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-background rounded-t-2xl sm:rounded-2xl ring-1 ring-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <h2 className="text-base font-semibold tracking-tight">Generate Outfits</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Customize what the AI considers when building your looks</p>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto max-h-[70vh] px-5 py-4 space-y-5">

          {/* Season */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Season</p>
            <div className="flex flex-wrap gap-1.5">
              {SEASONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSeason(s)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                    season === s
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary border-border text-muted-foreground hover:border-foreground/30"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Occasion */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Occasion</p>
            <div className="flex flex-wrap gap-1.5">
              {OCCASIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => setOccasion(o)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                    occasion === o
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary border-border text-muted-foreground hover:border-foreground/30"
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
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Build Around These Pieces
              </p>
              {anchorIds.length > 0 && (
                <button
                  onClick={() => setAnchorIds([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear ({anchorIds.length})
                </button>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">
              Select pieces you want in every outfit — AI will style around them.
            </p>
            {owned.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No owned items yet.</p>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {sortedOwned.map((item) => {
                  const selected = anchorIds.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => toggleAnchor(item.id)}
                      className={cn(
                        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
                        selected ? "border-foreground scale-95" : "border-transparent"
                      )}
                    >
                      <Image
                        src={item.cloudinaryUrl}
                        alt={item.notes ?? item.category}
                        fill
                        className="object-contain p-1 bg-secondary"
                        sizes="80px"
                      />
                      {selected && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="rounded-full bg-white p-0.5">
                            <Check className="size-3 text-black" />
                          </div>
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
            Surprise Me
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={generating}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              <Sparkles className="size-4" />
              {generating ? "Generating..." : "Generate"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
