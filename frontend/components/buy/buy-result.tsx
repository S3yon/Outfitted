"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/wear/price";
import { DUPLICATE_AT } from "@/lib/buy/verdict";
import type { BuyProduct, CheckReply, ShownItem } from "./types";

const VERDICT = {
  buy: { label: "Buy", tone: "bg-emerald-700 text-white" },
  wait: { label: "Wait", tone: "bg-amber-600 text-white" },
  skip: { label: "Skip", tone: "bg-foreground text-background" },
} as const;

const VIA = { page: "Read from the page", reader: "Read through Jina Reader", search: "Found by shopping search", manual: "Entered by hand" };

function Tile({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={cn("relative aspect-[3/4] bg-white", className)}>
      <Image src={src} alt={alt} fill unoptimized className="object-contain p-2" sizes="120px" />
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 border-b border-border py-4 sm:grid-cols-[150px_1fr]">
      <p className="label-caps pt-0.5 text-muted-foreground">{label}</p>
      <div className="min-w-0 text-sm">{children}</div>
    </div>
  );
}

export function BuyResult({
  product,
  reply,
  saving,
  saved,
  onSave,
}: {
  product: BuyProduct;
  reply: CheckReply;
  saving: boolean;
  saved: boolean;
  onSave: () => void;
}) {
  const { check, items } = reply;
  const byId = new Map<string, ShownItem>(items.map((i) => [i.id, i]));
  const twin = check.duplicate ? byId.get(check.duplicate.itemId) : undefined;
  const verdict = VERDICT[check.verdict];
  const watched = Boolean(product.itemId) || saved;

  return (
    <div className="mt-8 grid gap-10 md:grid-cols-[260px_1fr]">
      <div className="flex gap-4 md:block">
        {product.imageUrl ? (
          <Tile src={product.imageUrl} alt={product.title ?? "Product"} className="w-28 shrink-0 md:w-full" />
        ) : (
          <div className="flex aspect-[3/4] w-28 shrink-0 items-center justify-center bg-white text-sm text-muted-foreground md:w-full">No image</div>
        )}
        <div className="min-w-0">
        <p className="label-caps truncate text-muted-foreground md:mt-3">
          {product.store} · {product.category}
        </p>
        <p className="mt-1 text-sm">{product.title}</p>
        <p className="mt-0.5 font-mono text-sm">
          {product.price !== null ? formatCents(product.price) : "No price"}
          {product.currency && product.currency !== "USD" ? ` ${product.currency}` : ""}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{VIA[product.via]}</p>
        {product.url && (
          <a href={product.url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            Open product page <ExternalLink className="size-3" />
          </a>
        )}
        </div>
      </div>

      <div className="min-w-0">
        <div className="flex items-center gap-4 border-b border-border pb-5">
          <span className={cn("label-caps px-3 py-1.5", verdict.tone)}>{verdict.label}</span>
          <p className="font-mono text-2xl">
            {check.score}
            <span className="text-sm text-muted-foreground">/100</span>
          </p>
        </div>
        <p className="mt-5 font-serif text-2xl leading-snug md:text-3xl">{check.reason}</p>
        {reply.reasonBy === "rules" && <p className="mt-2 text-xs text-muted-foreground">Worded from the numbers below.</p>}

        <div className="mt-6 border-t border-border">
          <Row label="Outfits">
            {check.outfits.missing.length ? (
              <span>None yet: you own no {check.outfits.missing.join(" or ")}.</span>
            ) : (
              <span className="font-mono">
                {check.outfits.before} → {check.outfits.before + check.outfits.added}
                <span className="ml-2 text-emerald-700">+{check.outfits.added}</span>
              </span>
            )}
          </Row>
          {check.examples.length > 0 && (
            <Row label="Wear it with">
              <div className="flex flex-col gap-3">
                {check.examples.map((ids) => (
                  <div key={ids.join("|")} className="flex gap-1">
                    {product.imageUrl && <Tile src={product.imageUrl} alt="This item" className="w-14 ring-1 ring-foreground" />}
                    {ids.map((id) => {
                      const item = byId.get(id);
                      return item ? <Tile key={id} src={item.imageUrl} alt={item.notes ?? item.category} className="w-14" /> : null;
                    })}
                  </div>
                ))}
              </div>
            </Row>
          )}
          <Row label="Cost per wear">
            {check.costPerWear === null ? (
              <span className="text-muted-foreground">Needs a price</span>
            ) : (
              <span>
                <span className="font-mono">{formatCents(check.costPerWear)}</span>
                <span className="text-muted-foreground"> over about {check.expectedWears} wears a year</span>
              </span>
            )}
          </Row>
          <Row label="Closest owned">
            {twin && check.duplicate ? (
              <div className="flex items-center gap-3">
                <Tile src={twin.imageUrl} alt={twin.notes ?? twin.category} className="w-14 shrink-0" />
                <p>
                  {twin.notes ?? twin.category}
                  <span className={cn("ml-2 font-mono", check.duplicate.score >= DUPLICATE_AT ? "text-red-700" : "text-muted-foreground")}>
                    {Math.round(check.duplicate.score * 100)}% match
                  </span>
                </p>
              </div>
            ) : (
              <span className="text-muted-foreground">
                {reply.items.length || check.examples.length ? "Nothing that looks like it" : "Nothing to compare yet"}
              </span>
            )}
          </Row>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {watched ? (
            <>
              <p className="label-caps flex items-center gap-1.5">
                <Check className="size-3.5" /> On your wishlist
              </p>
              <Link href="/market?tab=wishlist" className="label-caps text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                See its price history
              </Link>
            </>
          ) : (
            <Button size="lg" disabled={saving || !product.imageUrl} onClick={onSave}>
              {saving && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
              Add to wishlist
            </Button>
          )}
          {!watched && !product.imageUrl && <p className="text-xs text-muted-foreground">Add an image link to save it.</p>}
        </div>
      </div>
    </div>
  );
}
