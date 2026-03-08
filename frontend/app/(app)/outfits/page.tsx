"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Loader2, Sparkles, Shirt, Plus } from "lucide-react";
import { AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAppStore, type PopulatedOutfit } from "@/stores/use-app-store";
import { OutfitCard } from "@/components/outfits/outfit-card";
import { OutfitBuilder } from "@/components/outfits/outfit-builder";
import { TryOnView } from "@/components/try-on/try-on-view";
import { toast } from "sonner";

export default function OutfitsPage() {
  const { user: auth0User, isLoading: authLoading } = useUser();
  const { outfits, setOutfits, wardrobeItems, setWardrobeItems } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<PopulatedOutfit | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);

  useEffect(() => {
    if (!auth0User) return;

    async function fetchData() {
      const [outfitsRes, itemsRes] = await Promise.all([
        fetch("/api/outfits"),
        wardrobeItems.length === 0 ? fetch("/api/items") : null,
      ]);
      if (outfitsRes.ok) setOutfits(await outfitsRes.json());
      if (itemsRes?.ok) setWardrobeItems(await itemsRes.json());
      setLoading(false);
    }

    fetchData();
  }, [auth0User, setOutfits, setWardrobeItems, wardrobeItems.length]);

  async function handleGenerate() {
    setGenerating(true);
    const res = await fetch("/api/outfits/generate", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message ?? data.error ?? "Failed to generate outfits");
      setGenerating(false);
      return;
    }

    setOutfits([...data.outfits, ...outfits]);
    toast.success("New outfits generated");
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

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Outfits</h1>
            <p className="text-xs text-muted-foreground">AI-styled combinations from your wardrobe</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="lg" onClick={() => setShowBuilder(true)}>
              <Plus className="size-4" />
              Build
            </Button>
            <Button size="lg" onClick={handleGenerate} disabled={generating}>
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

        {outfits.length === 0 ? (
          <div className="mt-24 flex flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
              <Shirt className="size-7 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No outfits yet. Add at least 3 owned items, then hit Generate.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {outfits.map((outfit) => (
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

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
          <Sparkles className="size-10 animate-pulse text-amber-400" />
          <p className="text-sm text-neutral-300">Your AI stylist is working...</p>
        </div>
      )}
    </>
  );
}
