"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Loader2 } from "lucide-react";
import { useAppStore } from "@/stores/use-app-store";
import { UploadButton } from "@/components/wardrobe/upload-button";
import { CameraButton } from "@/components/wardrobe/camera-button";
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
    <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight"><a href="/?home=1" className="md:hidden">Outfitted</a><span className="hidden md:inline">Wardrobe</span></h1>
          <p className="hidden md:block text-xs text-muted-foreground">
            {wardrobeItems.length} {wardrobeItems.length === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="md:hidden text-xs text-muted-foreground">{wardrobeItems.length} {wardrobeItems.length === 1 ? "item" : "items"}</span>
          <ProductSearch />
          <CameraButton />
          <UploadButton />
        </div>
      </div>

      <div className="mt-6">
        <WardrobeGrid />
      </div>
    </div>
  );
}
