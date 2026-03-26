"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, Plus, Search, Camera, Upload, X } from "lucide-react";
import { useAppStore } from "@/stores/use-app-store";
import { UploadButton } from "@/components/wardrobe/upload-button";
import { CameraButton } from "@/components/wardrobe/camera-button";
import { ProductSearch } from "@/components/wardrobe/product-search";
import { WardrobeGrid } from "@/components/wardrobe/wardrobe-grid";

export default function WardrobePage() {
  const { user: auth0User, isLoading: authLoading } = useUser();
  const { setWardrobeItems, wardrobeItems } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const uploadTriggerRef = useRef<(() => void) | undefined>(undefined);

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
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            <a href="/?home=1" className="md:hidden">Outfitted</a>
            <span className="hidden md:inline">Wardrobe</span>
          </h1>
          <p className="hidden md:block text-xs text-muted-foreground">
            {wardrobeItems.length} {wardrobeItems.length === 1 ? "item" : "items"}
          </p>
        </div>
        {/* Desktop buttons */}
        <div className="hidden md:flex items-center gap-2">
          <ProductSearch open={searchOpen} onOpenChange={setSearchOpen} />
          <CameraButton open={cameraOpen} onOpenChange={setCameraOpen} />
          <UploadButton onTrigger={(fn) => { uploadTriggerRef.current = fn; }} />
        </div>
        {/* Mobile: hidden dialogs still render so they can be triggered */}
        <div className="md:hidden">
          <ProductSearch open={searchOpen} onOpenChange={setSearchOpen} />
          <CameraButton open={cameraOpen} onOpenChange={setCameraOpen} />
          <UploadButton onTrigger={(fn) => { uploadTriggerRef.current = fn; }} />
        </div>
      </div>
      <p className="md:hidden text-xs text-muted-foreground mt-1">
        {wardrobeItems.length} {wardrobeItems.length === 1 ? "item" : "items"}
      </p>

      <div className="mt-6">
        <WardrobeGrid />
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setSheetOpen(true)}
        className="md:hidden fixed bottom-20 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg"
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
              className="md:hidden fixed inset-0 z-50 bg-black/40"
              onClick={() => setSheetOpen(false)}
            />
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-background pb-8 pt-4 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between px-5">
                <p className="text-base font-semibold">Add to wardrobe</p>
                <button onClick={() => setSheetOpen(false)}>
                  <X className="size-5 text-muted-foreground" />
                </button>
              </div>
              <div className="flex flex-col gap-1 px-3">
                {ADD_OPTIONS.map(({ icon: Icon, label, description, action }) => (
                  <button
                    key={label}
                    onClick={action}
                    className="flex items-center gap-4 rounded-xl px-3 py-3 text-left transition-colors hover:bg-secondary"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      <Icon className="size-5" />
                    </div>
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
  );
}
