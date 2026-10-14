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
    <div className="flex flex-col gap-5">
      {/* Buy / Sell toggle */}
      <div className="flex gap-6 border-b border-border">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={cn(
              "label-caps -mb-px border-b pb-3 transition-colors",
              side === s
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Amount */}
      <div>
        <p className="label-caps mb-2 text-muted-foreground">Amount</p>
        <div className="flex">
          {[1, 10, 50, 100].map((q) => (
            <button
              key={q}
              onClick={() => setQuantity(q)}
              className={cn(
                "-ml-px flex-1 border py-2 font-mono text-sm transition-colors first:ml-0",
                quantity === q
                  ? "relative border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <div>
        {/* Price per token */}
        <div className="flex items-baseline justify-between border-b border-border py-2.5">
          <span className="label-caps text-muted-foreground">Price per token</span>
          <span className="font-mono text-sm">{priceInSol.toFixed(6)} SOL</span>
        </div>

        {/* Total */}
        <div className="flex items-baseline justify-between border-b border-border py-2.5">
          <span className="label-caps text-muted-foreground">Total</span>
          <div className="text-right">
            <p className="font-mono text-sm">{totalSol.toFixed(4)} SOL</p>
            <p className="label-caps mt-0.5 text-muted-foreground">${totalUsd.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <Button size="lg" className="w-full" disabled={submitting} onClick={handleTrade}>
        {submitting ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          `${side} ${quantity} ${ticker}`
        )}
      </Button>
    </div>
  );
}
