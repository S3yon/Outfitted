"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Loader2, ExternalLink, X, Check, Shirt, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore } from "@/stores/use-app-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Product = {
  title: string;
  source: string;
  link: string;
  price: string;
  imageUrl: string;
  rating?: number;
};

const BRANDS = [
  "Acne Studios",
  "Balenciaga",
  "Chrome Hearts",
  "Rick Owens",
  "Maison Margiela",
  "Comme des Garcons",
  "Off-White",
  "Stussy",
  "Nike",
  "New Balance",
] as const;

export function ProductSearch({ open: controlledOpen, onOpenChange }: { open?: boolean; onOpenChange?: (v: boolean) => void } = {}) {
  const { setWardrobeItems, wardrobeItems } = useAppStore();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => { setInternalOpen(v); onOpenChange?.(v); };
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingIdx, setAddingIdx] = useState<number | null>(null);
  const [addingToWardrobeIdx, setAddingToWardrobeIdx] = useState<number | null>(null);
  const [addedToWardrobe, setAddedToWardrobe] = useState<Set<number>>(new Set());
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  async function handleSearch(searchQuery?: string) {
    const q = searchQuery ?? query;
    if (q.trim().length === 0) return;

    setSearching(true);
    setProducts([]);

    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Search failed" }));
      toast.error(err.error ?? "Search failed");
      setSearching(false);
      return;
    }

    const data = await res.json();
    setProducts(data.products);
    setSearching(false);
  }

  function handleBrandClick(brand: string) {
    setQuery(brand);
    handleSearch(brand);
  }

  async function handleAddToWishlist(product: Product, index: number) {
    setAddingIdx(index);

    const res = await fetch("/api/wishlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: product.title,
        imageUrl: product.imageUrl,
        price: product.price,
        source: product.source,
        link: product.link,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Failed to add" }));
      toast.error(err.error ?? "Failed to add to wishlist");
      setAddingIdx(null);
      return;
    }

    const item = await res.json();
    setWardrobeItems([item, ...wardrobeItems]);
    toast.success("Added to wishlist");
    setAddingIdx(null);
  }

  async function handleAddToWardrobe(product: Product, index: number) {
    setAddingToWardrobeIdx(index);
    try {
      const blob = await fetch(product.imageUrl).then((r) => r.blob());
      const ext = blob.type.includes("png") ? "png" : "jpg";
      const file = new File([blob], `product-${index}.${ext}`, { type: blob.type });
      const formData = new FormData();
      formData.append("files", file);
      formData.append("status", "owned");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to add" }));
        toast.error(err.error ?? "Failed to add to wardrobe");
        setAddingToWardrobeIdx(null);
        return;
      }

      const newItems = await res.json();
      setWardrobeItems([...newItems, ...wardrobeItems]);
      setAddedToWardrobe((prev) => new Set(prev).add(index));
      toast.success("Added to wardrobe");
    } catch {
      toast.error("Could not fetch product image");
    }
    setAddingToWardrobeIdx(null);
  }

  const hasResults = !searching && products.length > 0;

  const searchBar = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="Search by brand, item, style..."
        // font-size 16px prevents iOS Safari from zooming on focus
        style={{ fontSize: 16 }}
        className="w-full rounded-xl border border-border bg-secondary py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
      />
      {query && (
        <button
          onClick={() => { setQuery(""); setProducts([]); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );

  const brandChips = (
    <AnimatePresence initial={false}>
      {!hasResults && (
        <motion.div
          key="brands"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {BRANDS.map((brand) => (
              <button
                key={brand}
                onClick={() => handleBrandClick(brand)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs transition-all",
                  query === brand
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-secondary text-muted-foreground hover:border-foreground/20",
                )}
              >
                {brand}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const resultsArea = (
    <div className="flex-1 overflow-y-auto min-h-0">
      {searching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!searching && products.length === 0 && query && !searching && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No products found. Try a different search.
        </p>
      )}

      <AnimatePresence>
        {hasResults && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 gap-3"
          >
            {products.map((product, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                className="group relative overflow-hidden rounded-xl border border-border bg-secondary"
              >
                <div className="relative aspect-square bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-full w-full object-contain p-2"
                  />
                </div>

                <div className="p-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {product.source}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-foreground">
                    {product.title}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {product.price}
                  </p>
                </div>

                <div className="flex flex-col gap-1.5 px-2.5 pb-2.5">
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full text-xs"
                    disabled={addingToWardrobeIdx === i || addedToWardrobe.has(i)}
                    onClick={() => handleAddToWardrobe(product, i)}
                  >
                    {addingToWardrobeIdx === i ? (
                      <Loader2 className="size-3 animate-spin" />
                    ) : addedToWardrobe.has(i) ? (
                      <Check className="size-3" />
                    ) : (
                      <Shirt className="size-3" />
                    )}
                    {addedToWardrobe.has(i) ? "Added" : "Add to wardrobe"}
                  </Button>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                      disabled={addingIdx === i}
                      onClick={() => handleAddToWishlist(product, i)}
                    >
                      {addingIdx === i ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Plus className="size-3" />
                      )}
                      Wishlist
                    </Button>
                    <a href={product.link} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="text-xs">
                        <ExternalLink className="size-3" />
                      </Button>
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <>
      <Button
        size="lg"
        variant="outline"
        onClick={() => setOpen(true)}
        className="hidden md:flex"
      >
        <Search className="size-4" data-icon="inline-start" />
        Find Items
      </Button>

      {/* Mobile: full-screen slide-in panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="mobile-backdrop"
              className="md:hidden fixed inset-0 z-50 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="mobile-panel"
              className="md:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background rounded-t-2xl overflow-hidden"
              style={{ height: "92dvh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
            >
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-1 shrink-0">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>

              {/* Header */}
              <div className="flex items-center gap-3 px-4 pb-3 shrink-0">
                <button
                  onClick={() => setOpen(false)}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-secondary transition-colors"
                >
                  <ArrowLeft className="size-4" />
                </button>
                <h2 className="text-base font-semibold">Find Items</h2>
              </div>

              <div className="flex flex-col gap-3 px-4 pb-4 flex-1 min-h-0">
                {searchBar}
                {brandChips}
                {resultsArea}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: Dialog */}
      <Dialog open={isDesktop && open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden flex flex-col gap-3">
          <DialogHeader>
            <DialogTitle>Search Products</DialogTitle>
          </DialogHeader>
          {searchBar}
          {brandChips}
          {resultsArea}
        </DialogContent>
      </Dialog>
    </>
  );
}
