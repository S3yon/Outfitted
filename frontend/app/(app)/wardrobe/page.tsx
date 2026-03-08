"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/stores/use-app-store";
import { UploadButton } from "@/components/wardrobe/upload-button";
import { ProductSearch } from "@/components/wardrobe/product-search";
import { WardrobeGrid } from "@/components/wardrobe/wardrobe-grid";

export default function WardrobePage() {
  const { user: auth0User, isLoading: authLoading } = useUser();
  const { setWardrobeItems, wardrobeItems } = useAppStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth0User) return;

    async function fetchWardrobe() {
      const res = await fetch("/api/wardrobe");
      if (res.ok) {
        const items = await res.json();
        setWardrobeItems(items);
      }
      setLoading(false);
    }

    fetchWardrobe();
  }, [auth0User, setWardrobeItems]);

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Wardrobe</h1>
          <p className="text-xs text-muted-foreground">
            {wardrobeItems.length} {wardrobeItems.length === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="flex gap-2">
          <ProductSearch />
          <UploadButton />
        </div>
      </div>

      <div className="mt-6">
        <WardrobeGrid />
      </div>
    </div>
  );
}
