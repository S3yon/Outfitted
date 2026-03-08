"use client";

import { useState } from "react";
import { Search, Plus, Loader2, ExternalLink, X } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
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

const TREASURY_WALLET = new PublicKey("11111111111111111111111111111112");

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

export function ProductSearch() {
  const { setWardrobeItems, wardrobeItems } = useAppStore();
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingIdx, setAddingIdx] = useState<number | null>(null);
  const [buyingIdx, setBuyingIdx] = useState<number | null>(null);

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

  async function handleBuyWithSol(product: Product, index: number) {
    if (!publicKey) {
      setOpen(false);
      setTimeout(() => openWalletModal(true), 150);
      return;
    }

    setBuyingIdx(index);

    // Add to wishlist first to create the DB record
    const wishlistRes = await fetch("/api/wishlist", {
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

    if (!wishlistRes.ok) {
      toast.error("Failed to create item");
      setBuyingIdx(null);
      return;
    }

    const item = await wishlistRes.json();

    // Calculate SOL amount from USD price
    const priceStr = product.price.replace(/[^0-9.]/g, "");
    const priceUsd = parseFloat(priceStr);
    if (!priceUsd || priceUsd <= 0) {
      toast.error("Could not parse price");
      setWardrobeItems([item, ...wardrobeItems]);
      setBuyingIdx(null);
      return;
    }

    const solPrice = priceUsd / 150;
    const lamports = Math.round(solPrice * LAMPORTS_PER_SOL);

    try {
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: TREASURY_WALLET,
          lamports,
        }),
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      // Mark as owned with tx signature
      const patchRes = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "owned", nftMintAddress: signature }),
      });

      if (patchRes.ok) {
        const updated = await patchRes.json();
        setWardrobeItems([updated, ...wardrobeItems]);
        toast.success(`Purchased for ~${solPrice.toFixed(3)} SOL`);
      } else {
        setWardrobeItems([item, ...wardrobeItems]);
        toast.error("Payment succeeded but failed to update status");
      }
    } catch (err) {
      // Payment failed — item stays as wishlisted
      setWardrobeItems([item, ...wardrobeItems]);
      toast.error(err instanceof Error ? err.message : "Transaction failed");
    }

    setBuyingIdx(null);
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="h-10 w-10 p-0 sm:h-11 sm:w-auto sm:gap-2 sm:px-6"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden sm:inline">Search Products</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>Search Products</DialogTitle>
          </DialogHeader>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search by brand, item, style..."
              className="w-full rounded-lg border border-border bg-secondary py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30"
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

          {/* Brand quick-select */}
          <div className="flex flex-wrap gap-1.5">
            {BRANDS.map((brand) => (
              <button
                key={brand}
                onClick={() => handleBrandClick(brand)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition-all",
                  query === brand
                    ? "border-foreground/30 bg-foreground/10 text-foreground"
                    : "border-border bg-secondary text-muted-foreground hover:border-foreground/20",
                )}
              >
                {brand}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {searching && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {!searching && products.length === 0 && query && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No products found. Try a different search.
              </p>
            )}

            {!searching && products.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-xl border border-border bg-secondary"
                  >
                    {/* Product image */}
                    <div className="relative aspect-square bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="h-full w-full object-contain p-2"
                      />
                    </div>

                    {/* Info */}
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

                    {/* Action buttons */}
                    <div className="flex flex-col gap-1.5 px-2.5 pb-2.5">
                      <Button
                        size="sm"
                        className="w-full bg-purple-600 text-xs text-white hover:bg-purple-500"
                        disabled={buyingIdx === i || addingIdx === i}
                        onClick={() => handleBuyWithSol(product, i)}
                      >
                        {buyingIdx === i ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <>Buy with SOL</>
                        )}
                      </Button>
                      <div className="flex gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-xs"
                          disabled={addingIdx === i || buyingIdx === i}
                          onClick={() => handleAddToWishlist(product, i)}
                        >
                          {addingIdx === i ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Plus className="size-3" />
                          )}
                          Wishlist
                        </Button>
                        <a
                          href={product.link}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="outline" className="text-xs">
                            <ExternalLink className="size-3" />
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
