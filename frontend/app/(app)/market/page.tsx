"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import { Loader2, TrendingUp, TrendingDown, ArrowLeft, Wallet, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppStore, type PopulatedOutfit } from "@/stores/use-app-store";
import { PriceChart } from "@/components/market/price-chart";
import { TradePanel } from "@/components/market/trade-panel";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SOL_PRICE = 147.32;
const SIMULATED_BALANCE_SOL = 24.82;

type Listing = {
  id: string;
  outfitId: string;
  ticker: string;
  name: string;
  currentPrice: number;
  totalSupply: number;
  circulatingSupply: number;
  volume24h: number;
  change24h: number;
  creatorName: string;
  outfit: PopulatedOutfit | null;
};

type Candle = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export default function MarketPage() {
  const { user: auth0User, isLoading: authLoading } = useUser();
  const { outfits, setOutfits } = useAppStore();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [publishOutfit, setPublishOutfit] = useState<PopulatedOutfit | null>(null);
  const [tokenName, setTokenName] = useState("");
  const [tokenTicker, setTokenTicker] = useState("");

  // Detail view
  const [selected, setSelected] = useState<Listing | null>(null);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loadingCandles, setLoadingCandles] = useState(false);

  useEffect(() => {
    if (!auth0User) return;

    async function fetchData() {
      const [listingsRes, outfitsRes] = await Promise.all([
        fetch("/api/market"),
        outfits.length === 0 ? fetch("/api/outfits") : null,
      ]);
      if (listingsRes.ok) setListings(await listingsRes.json());
      if (outfitsRes?.ok) setOutfits(await outfitsRes.json());
      setLoading(false);
    }

    fetchData();
  }, [auth0User, outfits.length, setOutfits]);

  function openPublishDialog(outfit: PopulatedOutfit) {
    setPublishOutfit(outfit);
    setTokenName(outfit.explanation.slice(0, 60));
    setTokenTicker("");
  }

  async function handlePublish() {
    if (!publishOutfit) return;
    setPublishing(true);
    const res = await fetch("/api/market", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        outfitId: publishOutfit.id,
        name: tokenName || undefined,
        ticker: tokenTicker || undefined,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Failed to publish");
      setPublishing(false);
      return;
    }

    toast.success(`Published as ${data.ticker}`);
    setPublishOutfit(null);
    const refreshed = await fetch("/api/market");
    if (refreshed.ok) setListings(await refreshed.json());
    setPublishing(false);
  }

  async function openListing(listing: Listing) {
    setSelected(listing);
    setLoadingCandles(true);
    const res = await fetch(`/api/market/${listing.id}/candles`);
    if (res.ok) setCandles(await res.json());
    setLoadingCandles(false);
  }

  function handleTrade(newPrice: number, newCandle?: Candle) {
    if (!selected) return;
    const updated = { ...selected, currentPrice: newPrice };
    setSelected(updated);
    setListings((prev) =>
      prev.map((l) => (l.id === updated.id ? { ...l, currentPrice: newPrice } : l)),
    );
    if (newCandle) {
      setCandles((prev) => [...prev, newCandle]);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Detail view
  if (selected) {
    const changePercent = selected.change24h / 100;
    const isUp = selected.change24h >= 0;

    return (
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8">
        <button
          onClick={() => setSelected(null)}
          className="mb-4 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Market
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{selected.ticker}</h1>
              <span
                className={cn(
                  "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                  isUp ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500",
                )}
              >
                {isUp ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {isUp ? "+" : ""}{changePercent.toFixed(2)}%
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{selected.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold font-mono">
              {(selected.currentPrice / 100 / SOL_PRICE).toFixed(4)} SOL
            </p>
            <p className="text-xs text-muted-foreground">
              ${(selected.currentPrice / 100).toFixed(2)} &middot; Vol {selected.volume24h.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Chart */}
          <div className="h-[400px] rounded-xl border border-border bg-secondary/20 p-2">
            {loadingCandles ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <PriceChart candles={candles} />
            )}
          </div>

          {/* Trade panel + outfit preview */}
          <div className="flex flex-col gap-4">
            <TradePanel
              listingId={selected.id}
              ticker={selected.ticker}
              currentPrice={selected.currentPrice}
              onTrade={handleTrade}
            />

            {/* Outfit items */}
            {selected.outfit && (
              <div className="rounded-xl border border-border p-3">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Outfit Items
                </p>
                <div className="flex flex-wrap gap-2">
                  {selected.outfit.items.map((item) => (
                    <div
                      key={item.id}
                      className="relative size-16 overflow-hidden rounded-lg bg-white"
                    >
                      <Image
                        src={item.cloudinaryUrl}
                        alt={item.notes ?? item.category}
                        fill
                        className="object-contain p-1"
                        sizes="64px"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-border p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Stats
              </p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Supply</p>
                  <p className="font-medium">{selected.totalSupply.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Circulating</p>
                  <p className="font-medium">{selected.circulatingSupply.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Market Cap</p>
                  <p className="font-medium font-mono">
                    {((selected.currentPrice / 100 / SOL_PRICE) * selected.totalSupply).toFixed(1)} SOL
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Creator</p>
                  <p className="truncate font-medium">{selected.creatorName}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Find which outfits are already listed
  const listedOutfitIds = new Set(listings.map((l) => l.outfitId));
  const unlistedOutfits = outfits.filter((o) => !listedOutfitIds.has(o.id));

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Market</h1>
          <p className="text-xs text-muted-foreground">
            Trade tokenized outfits on Solana
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2">
          <Wallet className="size-4 text-muted-foreground" />
          <div className="text-right">
            <p className="text-sm font-semibold">{SIMULATED_BALANCE_SOL} SOL</p>
            <p className="text-[10px] text-muted-foreground">
              ${(SIMULATED_BALANCE_SOL * SOL_PRICE).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Publish section */}
      {unlistedOutfits.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Publish an Outfit
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {unlistedOutfits.map((outfit) => (
              <button
                key={outfit.id}
                onClick={() => openPublishDialog(outfit)}
                className="flex shrink-0 items-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/30 p-3 transition-all hover:border-foreground/30"
              >
                <div className="flex -space-x-2">
                  {outfit.items.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      className="relative size-10 overflow-hidden rounded-lg border-2 border-background bg-white"
                    >
                      <Image
                        src={item.cloudinaryUrl}
                        alt={item.category}
                        fill
                        className="object-contain p-0.5"
                        sizes="40px"
                      />
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <p className="max-w-[150px] truncate text-sm font-medium">
                    {outfit.explanation}
                  </p>
                  <p className="text-xs text-muted-foreground">Click to publish</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Listings grid */}
      {listings.length === 0 ? (
        <div className="mt-24 flex flex-col items-center text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-secondary">
            <TrendingUp className="size-7 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            No tokens yet. Publish an outfit to start trading.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="rounded-xl border border-border">
            {/* Header */}
            <div className="grid grid-cols-[1fr_100px_100px_100px] gap-4 border-b border-border px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <span>Token</span>
              <span className="text-right">Price (SOL)</span>
              <span className="text-right">24h</span>
              <span className="text-right">Volume</span>
            </div>

            {/* Rows */}
            {listings.map((listing) => {
              const isUp = listing.change24h >= 0;
              const changePercent = listing.change24h / 100;

              return (
                <button
                  key={listing.id}
                  onClick={() => openListing(listing)}
                  className="grid w-full grid-cols-[1fr_100px_100px_100px] gap-4 px-4 py-3 text-left transition-colors hover:bg-secondary/50"
                >
                  <div className="flex items-center gap-3">
                    {listing.outfit && listing.outfit.items.length > 0 && (
                      <div className="flex shrink-0 -space-x-2">
                        {listing.outfit.items.slice(0, 4).map((item) => (
                          <div
                            key={item.id}
                            className="relative size-10 overflow-hidden rounded-lg border-2 border-background bg-white"
                          >
                            <Image
                              src={item.cloudinaryUrl}
                              alt={item.category}
                              fill
                              className="object-contain p-0.5"
                              sizes="40px"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{listing.ticker}</p>
                      <p className="truncate text-xs text-muted-foreground">{listing.name}</p>
                    </div>
                  </div>
                  <p className="self-center text-right text-sm font-medium font-mono">
                    {(listing.currentPrice / 100 / SOL_PRICE).toFixed(4)}
                  </p>
                  <p
                    className={cn(
                      "self-center text-right text-sm font-medium",
                      isUp ? "text-green-500" : "text-red-500",
                    )}
                  >
                    {isUp ? "+" : ""}{changePercent.toFixed(2)}%
                  </p>
                  <p className="self-center text-right text-sm text-muted-foreground">
                    {listing.volume24h.toLocaleString()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Publish dialog */}
      <Dialog
        open={!!publishOutfit}
        onOpenChange={(open) => { if (!open) setPublishOutfit(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Publish to Market</DialogTitle>
          </DialogHeader>

          {publishOutfit && (
            <div className="flex flex-col gap-4">
              {/* Preview items */}
              <div className="flex justify-center -space-x-2">
                {publishOutfit.items.map((item) => (
                  <div
                    key={item.id}
                    className="relative size-14 overflow-hidden rounded-lg border-2 border-background bg-white"
                  >
                    <Image
                      src={item.cloudinaryUrl}
                      alt={item.category}
                      fill
                      className="object-contain p-1"
                      sizes="56px"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Token Name
                </label>
                <input
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. Street Drip"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">
                  Ticker (optional)
                </label>
                <input
                  value={tokenTicker}
                  onChange={(e) => setTokenTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  placeholder="Auto-generated if empty"
                  className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-mono outline-none focus:border-foreground"
                />
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={publishing || !tokenName.trim()}
                onClick={handlePublish}
              >
                {publishing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <>
                    <Rocket className="size-4" />
                    Launch Token
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
