"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCents, parsePrice } from "@/lib/wear/price";
import type { WatchItem } from "@/lib/watch/view";
import { WatchChart } from "./watch-chart";

function ago(iso: string | null) {
  if (!iso) return "Not yet";
  const hours = Math.round((Date.now() - Date.parse(iso)) / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

// The selected wishlist item: its price history and a target price.
export function WatchPanel({ item, onTarget }: { item: WatchItem; onTarget: (cents: number | null) => void }) {
  const s = item.summary;
  const [target, setTarget] = useState(item.targetPrice ? (item.targetPrice / 100).toFixed(2) : "");
  const [saving, setSaving] = useState(false);

  async function saveTarget(cents: number | null) {
    setSaving(true);
    try {
      const res = await fetch(`/api/watch/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPrice: cents }),
      });
      if (!res.ok) throw new Error(`target ${res.status}`);
      onTarget(cents);
      if (cents === null) setTarget("");
    } catch {
      toast.error("Could not save the target. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const stats: [string, string][] = s
    ? [
        ["All-time low", formatCents(s.allTimeLow)],
        ["30-day low", formatCents(s.low30)],
        ["90-day low", formatCents(s.low90)],
        ["First seen at", formatCents(s.first)],
        ["Last checked", ago(item.checkedAt)],
      ]
    : [["Last checked", ago(item.checkedAt)]];

  return (
    <div className="min-w-0">
      <div className="flex items-end justify-between gap-6 border-b border-border pb-5">
        <div className="min-w-0">
          <p className="label-caps truncate text-muted-foreground">{item.store ?? "No product link"}</p>
          <h2 className="mt-2 truncate font-serif text-3xl leading-none tracking-tight md:text-4xl">{item.title}</h2>
        </div>
        {s && (
          <div className="shrink-0 text-right">
            <p className="font-mono text-xl md:text-2xl">{formatCents(s.current)}</p>
            <p className={cn("label-caps mt-1", s.changePct < 0 ? "text-emerald-700" : s.changePct > 0 ? "text-red-700" : "text-muted-foreground")}>
              {s.changePct > 0 ? "+" : ""}
              {s.changePct}% since added
            </p>
          </div>
        )}
      </div>

      <div className="mt-6 h-[300px] border-b border-border pb-2 md:h-[360px]">
        {item.points.length ? (
          <WatchChart item={item} />
        ) : (
          <p className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            {item.productUrl ? "No price read yet. It is checked every 12 hours." : "Add a product link to watch its price."}
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-10 sm:grid-cols-2">
        <div>
          {stats.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 border-b border-border py-2.5">
              <span className="label-caps text-muted-foreground">{label}</span>
              <span className="font-mono text-sm">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const cents = parsePrice(target);
              if (cents !== null) saveTarget(cents);
            }}
          >
            <label>
              <span className="label-caps block text-muted-foreground">Target price</span>
              <div className="flex items-end gap-3">
                <input
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  inputMode="decimal"
                  placeholder={s ? (s.low30 / 100).toFixed(2) : "0.00"}
                  style={{ fontSize: 16 }}
                  className="w-full border-b border-border bg-transparent py-2.5 font-mono text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground focus:outline-none"
                />
                <Button type="submit" variant="outline" disabled={saving || parsePrice(target) === null}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : "Set"}
                </Button>
                {item.targetPrice !== null && (
                  <Button type="button" variant="ghost" disabled={saving} onClick={() => saveTarget(null)}>
                    Clear
                  </Button>
                )}
              </div>
            </label>
            {item.targetPrice !== null && s && (
              <p className="mt-2 text-xs text-muted-foreground">
                {s.current <= item.targetPrice
                  ? "At or under your target now."
                  : `${formatCents(s.current - item.targetPrice)} above your target.`}
              </p>
            )}
          </form>
          <div className="flex flex-wrap items-center gap-4">
            <Button asChild size="lg">
              <Link href={`/buy?item=${item.id}`}>Should I buy it?</Link>
            </Button>
            {item.productUrl && (
              <a
                href={item.productUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="label-caps inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
              >
                Product page <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
