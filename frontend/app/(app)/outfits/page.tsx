"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Loader2, Sparkles, Shirt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore, type PopulatedOutfit } from "@/stores/use-app-store";
import { OutfitCard } from "@/components/outfits/outfit-card";
import { TryOnDialog } from "@/components/try-on/try-on-dialog";
import { toast } from "sonner";

export default function OutfitsPage() {
  const { user: auth0User, isLoading: authLoading } = useUser();
  const { outfits, setOutfits } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [tryOnOutfit, setTryOnOutfit] = useState<PopulatedOutfit | null>(null);

  useEffect(() => {
    if (!auth0User) return;

    async function fetchOutfits() {
      const res = await fetch("/api/outfits");
      if (res.ok) {
        const data = await res.json();
        setOutfits(data);
      }
      setLoading(false);
    }

    fetchOutfits();
  }, [auth0User, setOutfits]);

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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Outfits</h1>
          <p className="text-xs text-muted-foreground">AI-styled combinations from your wardrobe</p>
        </div>
        <Button size="lg" onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <>
              <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="size-4" data-icon="inline-start" />
              Generate
            </>
          )}
        </Button>
      </div>

      {outfits.length === 0 ? (
        <div className="mt-24 flex flex-col items-center text-center">
          <div className="glass flex size-16 items-center justify-center rounded-2xl">
            <Shirt className="size-7 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No outfits yet. Add at least 3 owned items, then hit Generate.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {outfits.map((outfit) => (
            <OutfitCard key={outfit.id} outfit={outfit} onDelete={handleDelete} onTryOn={setTryOnOutfit} />
          ))}
        </div>
      )}

      {/* Try-on dialog */}
      {tryOnOutfit && (
        <TryOnDialog
          outfit={tryOnOutfit}
          open={tryOnOutfit !== null}
          onOpenChange={(open) => { if (!open) setTryOnOutfit(null); }}
        />
      )}

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-black/70 backdrop-blur-sm">
          <Sparkles className="size-10 animate-pulse text-gold" />
          <p className="text-sm text-muted-foreground">Your AI stylist is working...</p>
        </div>
      )}
    </div>
  );
}
