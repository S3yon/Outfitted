"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Plus, Search, Camera, Upload, Images, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/use-app-store";
import { UploadButton } from "@/components/wardrobe/upload-button";
import { ImportFlow } from "@/components/wardrobe/import-flow";
import { CameraButton } from "@/components/wardrobe/camera-button";
import { ProductSearch } from "@/components/wardrobe/product-search";
import { WardrobeGrid } from "@/components/wardrobe/wardrobe-grid";
import { DailyOutfitCard } from "@/components/wardrobe/daily-outfit-card";
import { PullToRefresh } from "@/components/pull-to-refresh";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDropDot } from "@/components/market/use-drop-dot";

export default function WardrobePage() {
  const { user: auth0User, isLoading: authLoading } = useUser();
  const { setWardrobeItems, wardrobeItems } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const uploadTriggerRef = useRef<(() => void) | undefined>(undefined);
  const importTriggerRef = useRef<(() => void) | undefined>(undefined);
  const dropped = useDropDot(Boolean(auth0User), usePathname());

  async function fetchWardrobe() {
    const res = await fetch("/api/wardrobe");
    if (res.ok) setWardrobeItems(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (!auth0User) return;
    fetchWardrobe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth0User]);

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const ADD_OPTIONS = [
    {
      icon: Search,
      label: "Find online",
      description: "Search brands and add items to your wardrobe",
      action: () => { setSheetOpen(false); setSearchOpen(true); },
    },
    {
      icon: Camera,
      label: "Take a photo",
      description: "Snap a clothing item with your camera",
      action: () => { setSheetOpen(false); setCameraOpen(true); },
    },
    {
      icon: Upload,
      label: "Upload photos",
      description: "Add items from your photo library",
      action: () => { setSheetOpen(false); uploadTriggerRef.current?.(); },
    },
    {
      icon: Images,
      label: "Import outfit photos",
      description: "Find every item in photos of you wearing them",
      action: () => { setSheetOpen(false); importTriggerRef.current?.(); },
    },
  ];

  return (
    <PullToRefresh onRefresh={fetchWardrobe}>
    <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
      <Link href="/?home=1" className="mb-6 block font-serif text-2xl leading-none md:hidden">
        Outfitted
      </Link>
      <div className="flex items-end justify-between border-b border-border pb-5">
        <div>
          <p className="label-caps text-muted-foreground">
            {wardrobeItems.length} {wardrobeItems.length === 1 ? "item" : "items"}
          </p>
          <h1 className="mt-2 font-serif text-5xl leading-none tracking-tight md:text-6xl">
            Wardrobe
          </h1>
        </div>
        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-2">
          <ProductSearch open={searchOpen} onOpenChange={setSearchOpen} />
          <CameraButton open={cameraOpen} onOpenChange={setCameraOpen} />
          <UploadButton onTrigger={(fn) => { uploadTriggerRef.current = fn; }} />
          <Button size="lg" variant="outline" onClick={() => importTriggerRef.current?.()}>
            <Images className="size-4" data-icon="inline-start" />
            Import
          </Button>
        </div>
        {/* Mobile: hidden dialogs still render so they can be triggered */}
        <div className="md:hidden">
          <ProductSearch open={searchOpen} onOpenChange={setSearchOpen} />
          <CameraButton open={cameraOpen} onOpenChange={setCameraOpen} />
          <UploadButton onTrigger={(fn) => { uploadTriggerRef.current = fn; }} />
        </div>
      </div>
      <div className="flex gap-6 border-b border-border py-3">
        <Link href="/buy" className="label-caps text-muted-foreground transition-colors hover:text-foreground">
          Should I buy this?
        </Link>
        <Link href="/market?tab=wishlist" className="label-caps flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
          Price watch
          {dropped && <span aria-label="A wishlist price dropped" className="size-1.5 rounded-full bg-emerald-700" />}
        </Link>
      </div>
      <ImportFlow onTrigger={(fn) => { importTriggerRef.current = fn; }} />
      <div className="mt-6">
        <DailyOutfitCard />
        <WardrobeGrid />
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        aria-label="Add to wardrobe"
        className="md:hidden fixed right-5 z-40 flex size-14 items-center justify-center bg-foreground text-background"
        style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
      >
        <Plus className="size-6" />
      </button>

      {/* Bottom action sheet */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-50 bg-foreground/30"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background pt-4"
              style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
            >
              <div className="mb-2 flex items-center justify-between px-5">
                <p className="font-serif text-3xl leading-none">Add to wardrobe</p>
                <button onClick={() => setSheetOpen(false)} aria-label="Close">
                  <X className="size-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex flex-col border-t border-border">
                {ADD_OPTIONS.map(({ icon: Icon, label, description, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex items-center gap-4 border-b border-border px-5 py-4 text-left transition-colors hover:bg-secondary"
                  >
                    <Icon className="size-5 shrink-0 stroke-[1.5]" />
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
    </PullToRefresh>
  );
}
