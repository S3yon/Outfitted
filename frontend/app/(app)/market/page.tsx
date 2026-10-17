"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import { Loader2, ArrowLeft } from "lucide-react";
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
import { WatchTab } from "@/components/market/watch-tab";
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

  // Outfits (token trading) or Wishlist (watched prices). ?tab=wishlist opens the second.
  // The page shows a spinner until auth loads, so reading the URL here can't mismatch SSR.
  const [tab, setTab] = useState<"outfits" | "wishlist">(() =>
    typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === "wishlist"
      ? "wishlist"
      : "outfits",
  );
  function changeTab(next: "outfits" | "wishlist") {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "wishlist") url.searchParams.set("tab", "wishlist");
    else url.searchParams.delete("tab");
    window.history.replaceState(null, "", url);
  }

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
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        <button
          onClick={() => setSelected(null)}
          className="label-caps flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5 stroke-[1.5]" />
          Market
        </button>

        <div className="mt-5 flex items-end justify-between gap-6 border-b border-border pb-5">
          <div className="min-w-0">
            <p className="label-caps text-muted-foreground">
              {selected.ticker} ·{" "}
              <span className={isUp ? "text-emerald-700" : "text-red-700"}>
                {isUp ? "+" : ""}{changePercent.toFixed(2)}% 24h
              </span>
            </p>
            <h1 className="mt-2 truncate font-serif text-4xl leading-none tracking-tight md:text-5xl">
              {selected.name}
            </h1>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-mono text-xl md:text-2xl">
              {(selected.currentPrice / 100 / SOL_PRICE).toFixed(4)} SOL
            </p>
            <p className="label-caps mt-1 text-muted-foreground">
              ${(selected.currentPrice / 100).toFixed(2)} · Vol {selected.volume24h.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_320px]">
          {/* Chart */}
          <div className="h-[400px] border-b border-border pb-2">
            {loadingCandles ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <PriceChart candles={candles} />
            )}
          </div>

          {/* Trade panel + outfit preview */}
          <div className="flex flex-col gap-8">
            <TradePanel
              listingId={selected.id}
              ticker={selected.ticker}
              currentPrice={selected.currentPrice}
              onTrade={handleTrade}
            />

            {/* Outfit items */}
            {selected.outfit && (
              <div>
                <p className="label-caps border-b border-border pb-3 text-muted-foreground">
                  Outfit items
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {selected.outfit.items.map((item) => (
                    <div key={item.id} className="relative size-16 bg-white">
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

            <div>
              <p className="label-caps border-b border-border pb-3 text-muted-foreground">Stats</p>
              {[
                ["Supply", selected.totalSupply.toLocaleString()],
                ["Circulating", selected.circulatingSupply.toLocaleString()],
                [
                  "Market cap",
                  `${((selected.currentPrice / 100 / SOL_PRICE) * selected.totalSupply).toFixed(1)} SOL`,
                ],
                ["Creator", selected.creatorName],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-baseline justify-between gap-4 border-b border-border py-2.5"
                >
                  <span className="label-caps text-muted-foreground">{label}</span>
                  <span className="truncate font-mono text-sm">{value}</span>
                </div>
              ))}
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
    <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
      <div className="flex items-end justify-between border-b border-border pb-5">
        <div>
          <p className="label-caps text-muted-foreground">
            {tab === "wishlist"
              ? "Wishlist · real store prices"
              : `${listings.length} ${listings.length === 1 ? "token" : "tokens"} · Solana devnet`}
          </p>
          <h1 className="mt-2 font-serif text-5xl leading-none tracking-tight md:text-6xl">
            Market
          </h1>
        </div>
        <div className={cn("text-right", tab === "wishlist" && "hidden")}>
          <p className="label-caps text-muted-foreground">Balance</p>
          <p className="mt-1.5 font-mono text-sm">{SIMULATED_BALANCE_SOL} SOL</p>
          <p className="label-caps mt-0.5 text-muted-foreground">
            ${(SIMULATED_BALANCE_SOL * SOL_PRICE).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="flex gap-6 border-b border-border py-3">
        {(["outfits", "wishlist"] as const).map((t) => (
          <button
            key={t}
            onClick={() => changeTab(t)}
            aria-pressed={tab === t}
            className={cn(
              "label-caps border-b pb-0.5 transition-colors",
              tab === t ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "outfits" ? "Outfits" : "Wishlist"}
          </button>
        ))}
      </div>

      {tab === "wishlist" ? (
        <WatchTab />
      ) : (
      <>
      {/* Publish section */}
      {unlistedOutfits.length > 0 && (
        <div className="border-b border-border py-5">
          <p className="label-caps mb-3 text-muted-foreground">Publish an outfit</p>
          <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {unlistedOutfits.map((outfit) => (
              <button
                key={outfit.id}
                onClick={() => openPublishDialog(outfit)}
                className="group flex shrink-0 items-center gap-3 text-left"
              >
                <div className="flex gap-1">
                  {outfit.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="relative size-10 bg-white">
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
                <div>
                  <p className="max-w-[180px] truncate text-sm">{outfit.explanation}</p>
                  <p className="label-caps text-muted-foreground transition-colors group-hover:text-foreground">
                    Publish
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Listings table */}
      {listings.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl text-muted-foreground">
            No tokens yet. Publish an outfit to start trading.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <div className="label-caps grid grid-cols-[1fr_80px_70px] gap-4 border-b border-border pb-3 text-muted-foreground sm:grid-cols-[1fr_120px_100px_100px]">
            <span>Token</span>
            <span className="text-right">Price (SOL)</span>
            <span className="text-right">24h</span>
            <span className="hidden text-right sm:block">Volume</span>
          </div>

          {listings.map((listing) => {
            const isUp = listing.change24h >= 0;
            const changePercent = listing.change24h / 100;

            return (
              <button
                key={listing.id}
                onClick={() => openListing(listing)}
                className="grid w-full grid-cols-[1fr_80px_70px] gap-4 border-b border-border py-4 text-left transition-colors hover:bg-secondary sm:grid-cols-[1fr_120px_100px_100px]"
              >
                <div className="flex min-w-0 items-center gap-4">
                  {listing.outfit && listing.outfit.items.length > 0 && (
                    <div className="flex shrink-0 gap-1">
                      {listing.outfit.items.slice(0, 4).map((item) => (
                        <div key={item.id} className="relative size-10 bg-white">
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
                    <p className="label-caps text-foreground">{listing.ticker}</p>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{listing.name}</p>
                  </div>
                </div>
                <p className="self-center text-right font-mono text-sm">
                  {(listing.currentPrice / 100 / SOL_PRICE).toFixed(4)}
                </p>
                <p
                  className={cn(
                    "self-center text-right font-mono text-sm",
                    isUp ? "text-emerald-700" : "text-red-700",
                  )}
                >
                  {isUp ? "+" : ""}{changePercent.toFixed(2)}%
                </p>
                <p className="hidden self-center text-right font-mono text-sm text-muted-foreground sm:block">
                  {listing.volume24h.toLocaleString()}
                </p>
              </button>
            );
          })}
        </div>
      )}

      </>
      )}

      {/* Publish dialog */}
      <Dialog
        open={!!publishOutfit}
        onOpenChange={(open) => { if (!open) setPublishOutfit(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Publish to market</DialogTitle>
          </DialogHeader>

          {publishOutfit && (
            <div className="flex flex-col gap-6">
              {/* Preview items */}
              <div className="flex gap-1">
                {publishOutfit.items.map((item) => (
                  <div key={item.id} className="relative size-14 bg-white">
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
                <label className="label-caps block text-muted-foreground">Token name</label>
                <input
                  value={tokenName}
                  onChange={(e) => setTokenName(e.target.value)}
                  placeholder="e.g. Street Drip"
                  style={{ fontSize: 16 }}
                  className="w-full border-b border-border bg-transparent py-2.5 text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground focus:outline-none"
                />
              </div>

              <div>
                <label className="label-caps block text-muted-foreground">Ticker (optional)</label>
                <input
                  value={tokenTicker}
                  onChange={(e) => setTokenTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  placeholder="Auto-generated if empty"
                  style={{ fontSize: 16 }}
                  className="w-full border-b border-border bg-transparent py-2.5 font-mono text-foreground placeholder:font-sans placeholder:text-muted-foreground transition-colors focus:border-foreground focus:outline-none"
                />
              </div>

              <Button
                size="lg"
                className="w-full"
                disabled={publishing || !tokenName.trim()}
                onClick={handlePublish}
              >
                {publishing ? <Loader2 className="size-4 animate-spin" /> : "Launch token"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
