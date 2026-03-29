"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Loader2, Sparkles, Shirt, Plus } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAppStore, type PopulatedOutfit } from "@/stores/use-app-store";
import { OutfitCard } from "@/components/outfits/outfit-card";
import { OutfitBuilder } from "@/components/outfits/outfit-builder";
import { OutfitGenerateSheet } from "@/components/outfits/outfit-generate-sheet";
import { TryOnView } from "@/components/try-on/try-on-view";
import { toast } from "sonner";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { cn } from "@/lib/utils";

const SEASONS = ["All", "Spring", "Summer", "Fall", "Winter"] as const;
const OCCASIONS = ["All", "Casual", "Work", "Night Out", "Gym", "Formal"] as const;

function getCurrentSeason(): string {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "Spring";
  if (m >= 6 && m <= 8) return "Summer";
  if (m >= 9 && m <= 11) return "Fall";
  return "Winter";
}

export default function OutfitsPage() {
  const { user: auth0User, isLoading: authLoading } = useUser();
  const { outfits, setOutfits, wardrobeItems, setWardrobeItems } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<PopulatedOutfit | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showGenerateSheet, setShowGenerateSheet] = useState(false);

  const [filterSeason, setFilterSeason] = useState<string>("All");
  const [filterOccasion, setFilterOccasion] = useState<string>("All");

  async function fetchData() {
    const [outfitsRes, itemsRes] = await Promise.all([
      fetch("/api/outfits"),
      fetch("/api/items"),
    ]);
    if (outfitsRes.ok) setOutfits(await outfitsRes.json());
    if (itemsRes.ok) setWardrobeItems(await itemsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    if (!auth0User) return;
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth0User]);

  async function handleGenerate(opts: {
    season: string;
    occasion: string | null;
    anchorItemIds: string[];
    surpriseMe: boolean;
  }) {
    setGenerating(true);
    setShowGenerateSheet(false);
    const res = await fetch("/api/outfits/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(opts),
    });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message ?? data.error ?? "Failed to generate outfits");
      setGenerating(false);
      return;
    }

    setOutfits([...data.outfits, ...outfits]);
    toast.success(opts.surpriseMe ? "Surprise outfits generated!" : "New outfits generated");
    setGenerating(false);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/outfits/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete outfit");
      return;
    }
    setOutfits(outfits.filter((o) => o.id !== id));
    toast.success("Outfit removed");
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Client-side filter by stored season/occasion
  const filtered = outfits.filter((o) => {
    const seasonMatch =
      filterSeason === "All" || !o.season || o.season.toLowerCase() === filterSeason.toLowerCase();
    const occasionMatch =
      filterOccasion === "All" ||
      !o.occasion ||
      o.occasion.toLowerCase() === filterOccasion.toLowerCase();
    return seasonMatch && occasionMatch;
  });

  const activeFilters = (filterSeason !== "All" ? 1 : 0) + (filterOccasion !== "All" ? 1 : 0);

  return (
    <PullToRefresh onRefresh={fetchData}>
      <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              <a href="/?home=1" className="md:hidden">Outfitted</a>
              <span className="hidden md:inline">Outfits</span>
            </h1>
            <p className="text-xs text-muted-foreground">AI-styled combinations from your wardrobe</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => setShowBuilder(true)}>
              <Plus className="size-4" />
              Build
            </Button>
            <Button size="lg" onClick={() => setShowGenerateSheet(true)} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Filter chips */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex gap-1.5 flex-wrap">
            {SEASONS.map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeason(s)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                  filterSeason === s
                    ? "bg-foreground text-background border-foreground"
                    : "bg-secondary border-border text-muted-foreground hover:border-foreground/30"
                )}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {OCCASIONS.map((o) => (
              <button
                key={o}
                onClick={() => setFilterOccasion(o)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                  filterOccasion === o
                    ? "bg-foreground text-background border-foreground"
                    : "bg-secondary border-border text-muted-foreground hover:border-foreground/30"
                )}
              >
                {o}
              </button>
            ))}
          </div>
          {activeFilters > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Showing {filtered.length} of {outfits.length} outfits
              {" · "}
              <button
                onClick={() => { setFilterSeason("All"); setFilterOccasion("All"); }}
                className="underline hover:text-foreground"
              >
                Clear filters
              </button>
            </p>
          )}
        </div>

        {filtered.length === 0 && outfits.length === 0 ? (
          <div className="mt-24 flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
              <Shirt className="size-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No outfits yet. Add at least 3 owned items, then hit Generate.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-24 flex flex-col items-center text-center">
            <p className="text-sm text-muted-foreground">No outfits match these filters.</p>
            <button
              onClick={() => { setFilterSeason("All"); setFilterOccasion("All"); }}
              className="mt-2 text-xs underline text-muted-foreground hover:text-foreground"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {filtered.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                onDelete={handleDelete}
                onClick={() => setSelectedOutfit(outfit)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Full-page try-on view */}
      <AnimatePresence>
        {selectedOutfit && (
          <TryOnView
            key={selectedOutfit.id}
            outfit={selectedOutfit}
            onBack={() => setSelectedOutfit(null)}
          />
        )}
      </AnimatePresence>

      {/* Manual outfit builder */}
      {showBuilder && <OutfitBuilder onClose={() => setShowBuilder(false)} />}

      {/* Generate options sheet */}
      {showGenerateSheet && (
        <OutfitGenerateSheet
          defaultSeason={getCurrentSeason()}
          onClose={() => setShowGenerateSheet(false)}
          onGenerate={handleGenerate}
          generating={generating}
        />
      )}

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
          <Sparkles className="size-10 animate-pulse text-amber-400" />
          <p className="text-sm text-neutral-300">Your AI stylist is building outfits...</p>
        </div>
      )}
    </PullToRefresh>
  );
}
