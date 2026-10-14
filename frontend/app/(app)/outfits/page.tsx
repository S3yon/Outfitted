"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Loader2, Sparkles, Plus } from "lucide-react";
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
import Link from "next/link";

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
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <Link href="/?home=1" className="mb-6 block font-serif text-2xl leading-none md:hidden">
          Outfitted
        </Link>
        {/* Header */}
        <div className="flex flex-col gap-5 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-caps text-muted-foreground">
              {outfits.length} {outfits.length === 1 ? "outfit" : "outfits"}
            </p>
            <h1 className="mt-2 font-serif text-5xl leading-none tracking-tight md:text-6xl">
              Outfits
            </h1>
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
                  Generating
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

        {/* Filters: season row, occasion row */}
        <div className="border-b border-border">
          {[
            { label: "Season", options: SEASONS, value: filterSeason, set: setFilterSeason },
            { label: "Occasion", options: OCCASIONS, value: filterOccasion, set: setFilterOccasion },
          ].map((row) => (
            <div key={row.label} className="flex items-center gap-6 overflow-x-auto no-scrollbar">
              <span className="label-caps w-20 shrink-0 text-muted-foreground/60">{row.label}</span>
              {row.options.map((o) => (
                <button
                  key={o}
                  onClick={() => row.set(o)}
                  className={cn(
                    "label-caps shrink-0 border-b py-3 transition-colors",
                    row.value === o
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground",
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          ))}
        </div>
        {activeFilters > 0 && (
          <p className="label-caps mt-3 text-muted-foreground">
            {filtered.length} of {outfits.length}
            {" · "}
            <button
              onClick={() => { setFilterSeason("All"); setFilterOccasion("All"); }}
              className="underline underline-offset-4 hover:text-foreground"
            >
              Clear
            </button>
          </p>
        )}

        {filtered.length === 0 && outfits.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl text-muted-foreground">
              No outfits yet. Add at least 3 owned items, then generate.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-serif text-2xl text-muted-foreground">No outfits match these filters.</p>
            <button
              onClick={() => { setFilterSeason("All"); setFilterOccasion("All"); }}
              className="label-caps mt-3 text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-background/95">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <p className="font-serif text-3xl">Building outfits</p>
        </div>
      )}
    </PullToRefresh>
  );
}
