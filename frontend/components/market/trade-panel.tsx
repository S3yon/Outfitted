"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const SOL_PRICE_USD = 147.32; // simulated SOL/USD rate

type CandleData = {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

interface TradePanelProps {
  listingId: string;
  ticker: string;
  currentPrice: number; // in cents
  onTrade: (newPrice: number, candle?: CandleData) => void;
}

export function TradePanel({ listingId, ticker, currentPrice, onTrade }: TradePanelProps) {
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState(10);
  const [submitting, setSubmitting] = useState(false);

  const priceInSol = currentPrice / 100 / SOL_PRICE_USD;
  const totalSol = priceInSol * quantity;
  const totalUsd = (currentPrice / 100) * quantity;

  async function handleTrade() {
    setSubmitting(true);

    const res = await fetch(`/api/market/${listingId}/trade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ side, quantity }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.error ?? "Trade failed");
      setSubmitting(false);
      return;
    }

    toast.success(`${side === "buy" ? "Bought" : "Sold"} ${quantity} ${ticker}`);
    onTrade(data.newPrice, data.candle);
    setSubmitting(false);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-4">
      {/* Buy / Sell toggle */}
      <div className="flex gap-1 rounded-lg bg-secondary p-1">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium capitalize transition-all",
              side === s
                ? s === "buy"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div>
        <p className="mb-1 text-xs text-muted-foreground">Amount</p>
        <div className="flex items-center gap-2">
          {[1, 10, 50, 100].map((q) => (
            <button
              key={q}
              onClick={() => setQuantity(q)}
              className={cn(
                "flex-1 rounded-lg border py-2 text-sm transition-all",
                quantity === q
                  ? "border-foreground bg-foreground/5 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Price per token */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-xs text-muted-foreground">Price per token</span>
        <span className="font-mono text-xs">{priceInSol.toFixed(6)} SOL</span>
      </div>

      {/* Total */}
      <div className="rounded-lg bg-secondary px-3 py-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Total</span>
          <div className="text-right">
            <p className="text-sm font-semibold">{totalSol.toFixed(4)} SOL</p>
            <p className="text-xs text-muted-foreground">${totalUsd.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className={cn(
          "w-full capitalize",
          side === "buy"
            ? "bg-green-500 hover:bg-green-600 text-white"
            : "bg-red-500 hover:bg-red-600 text-white",
        )}
        disabled={submitting}
        onClick={handleTrade}
      >
        {submitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          `${side} ${quantity} ${ticker}`
        )}
      </Button>
    </div>
  );
}
