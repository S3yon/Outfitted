"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, Loader2, ExternalLink, X, Check, Shirt, ArrowLeft, Sparkles } from "lucide-react";
import { motion, AnimatePresence, useDragControls } from "motion/react";
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

// Module-level recommendation cache — survives re-renders, deduplicates
// concurrent fetches from the two mounted instances of this component
let _recCache: Product[] | null = null;
let _recPromise: Promise<Product[]> | null = null;

async function fetchRecommendations(): Promise<Product[]> {
  if (_recCache !== null) return _recCache;
  if (!_recPromise) {
    _recPromise = fetch("/api/recommendations")
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((d) => {
        _recCache = d.products ?? [];
        return _recCache!;
      })
      .catch(() => {
        _recCache = [];
        return [];
      });
  }
  return _recPromise;
}

// Self-contained product grid — manages its own add-to-wardrobe/wishlist state
// so recommendations and search results don't share indices
function ProductGrid({ products }: { products: Product[] }) {
  const { wardrobeItems, setWardrobeItems } = useAppStore();
  const [addingIdx, setAddingIdx] = useState<number | null>(null);
  const [addingToWardrobeIdx, setAddingToWardrobeIdx] = useState<number | null>(null);
  const [addedToWardrobe, setAddedToWardrobe] = useState<Set<number>>(new Set());

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
    } else {
      const item = await res.json();
      setWardrobeItems([item, ...wardrobeItems]);
      toast.success("Added to wishlist");
    }
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
      } else {
        const newItems = await res.json();
        setWardrobeItems([...newItems, ...wardrobeItems]);
        setAddedToWardrobe((prev) => new Set(prev).add(index));
        toast.success("Added to wardrobe");
      }
    } catch {
      toast.error("Could not fetch product image");
    }
    setAddingToWardrobeIdx(null);
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
            <p className="mt-0.5 line-clamp-2 text-xs text-foreground">{product.title}</p>
            <p className="mt-1 text-sm font-semibold text-foreground">{product.price}</p>
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
    </div>
  );
}

export function ProductSearch({
  open: controlledOpen,
  onOpenChange,
}: { open?: boolean; onOpenChange?: (v: boolean) => void } = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => { setInternalOpen(v); onOpenChange?.(v); };

  const dragControls = useDragControls();
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);

  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Lock body scroll when mobile panel is open
  useEffect(() => {
    if (!isDesktop && open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open, isDesktop]);

  // Prefetch on mount so results are ready before the panel opens
  useEffect(() => {
    fetchRecommendations().then((recs) => setRecommendations(recs));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When panel opens, populate from cache (likely already ready)
  useEffect(() => {
    if (!open) return;
    if (_recCache !== null) {
      setRecommendations(_recCache);
      setLoadingRecs(false);
      return;
    }
    setLoadingRecs(true);
    fetchRecommendations().then((recs) => {
      setRecommendations(recs);
      setLoadingRecs(false);
    });
  }, [open]);

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

  const hasResults = !searching && products.length > 0;
  const showRecs = !query.trim() && !searching;

  const searchBar = (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="Search by brand, item, style..."
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
  );

  // Shared content for both mobile and desktop
  const content = (
    <div className="flex flex-col gap-3 min-h-0">
      {/* Brand chips — always visible when no search results */}
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
            {brandChips}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search loading */}
      {searching && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* No search results */}
      {!searching && products.length === 0 && query.trim() && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No products found. Try a different search.
        </p>
      )}

      {/* Search results */}
      <AnimatePresence>
        {hasResults && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ProductGrid products={products} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendations (shown when query is empty) */}
      <AnimatePresence>
        {showRecs && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-3"
          >
            {loadingRecs && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loadingRecs && recommendations.length > 0 && (
              <>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-amber-400" />
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    For You
                  </p>
                </div>
                <ProductGrid products={recommendations} />
              </>
            )}
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
              className="md:hidden fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl"
              style={{ height: "92dvh" }}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              drag="y"
              dragControls={dragControls}
              dragListener={false}
              dragConstraints={{ top: 0 }}
              dragElastic={{ top: 0.05, bottom: 0.3 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120 || info.velocity.y > 500) setOpen(false);
              }}
            >
              {/* Sticky header — drag handle only */}
              <div className="sticky top-0 z-10 bg-background rounded-t-2xl px-4 pt-3 pb-3 space-y-3">
                <div
                  className="flex justify-center cursor-grab active:cursor-grabbing touch-none"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="h-1 w-10 rounded-full bg-border" />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-secondary transition-colors"
                  >
                    <ArrowLeft className="size-4" />
                  </button>
                  <h2 className="text-base font-semibold">Find Items</h2>
                </div>
                {searchBar}
              </div>

              {/* Scrollable content — dismiss when pulling down from top */}
              <div
                ref={scrollRef}
                className="overflow-y-auto px-4 pb-8"
                style={{ height: "calc(92dvh - 9rem)" }}
                onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
                onTouchMove={(e) => {
                  const el = scrollRef.current;
                  if (!el || el.scrollTop > 2) return;
                  const dy = e.touches[0].clientY - touchStartY.current;
                  if (dy > 80) setOpen(false);
                }}
              >
                {content}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop: Dialog */}
      <Dialog open={isDesktop && open} onOpenChange={setOpen}>
        <DialogContent className="h-[85vh] max-w-5xl overflow-hidden p-0">
          <div className="flex flex-col gap-3 p-6 h-full">
            <DialogHeader>
              <DialogTitle>Find Items</DialogTitle>
            </DialogHeader>
            {searchBar}
            <div className="flex-1 overflow-y-auto min-h-0">
              {content}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
