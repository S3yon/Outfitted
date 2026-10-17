"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BuyResult } from "@/components/buy/buy-result";
import { ManualForm } from "@/components/buy/manual-form";
import { useBuyCheck } from "@/components/buy/use-buy-check";
import { formatCents } from "@/lib/wear/price";

const STEP = { reading: "Reading the page", checking: "Comparing with your closet" } as const;

function BuyCheckPage() {
  const { user: auth0User, isLoading: authLoading } = useUser();
  const params = useSearchParams();
  const buy = useBuyCheck();
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const opened = useRef(false);

  // ?item=<id>: check a wishlist item that is already saved.
  useEffect(() => {
    const itemId = params.get("item");
    if (!auth0User || !itemId || opened.current) return;
    opened.current = true;
    buy.read({ itemId });
  }, [auth0User, params, buy]);

  useEffect(() => {
    if (buy.error) toast.error(buy.error);
  }, [buy.error]);

  async function save() {
    const p = buy.product;
    if (!p?.imageUrl || !p.title) return;
    setSaving(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: p.title,
          imageUrl: p.imageUrl,
          price: p.price !== null ? formatCents(p.price) : null,
          priceCents: p.price,
          currency: p.currency,
          via: p.via,
          category: p.category,
          source: p.brand ?? p.store,
          link: p.url || null,
          embedding: buy.embedding,
        }),
      });
      if (!res.ok) throw new Error(`wishlist ${res.status}`);
      setSaved(true);
      toast.success("Added to your wishlist. Its price is now watched.");
    } catch {
      toast.error("Could not save it. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const busy = buy.stage === "reading" || buy.stage === "checking";

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 sm:px-8">
      <Link href="/?home=1" className="mb-6 block font-serif text-2xl leading-none md:hidden">
        Outfitted
      </Link>
      <div className="border-b border-border pb-5">
        <p className="label-caps text-muted-foreground">Checked against your closet</p>
        <h1 className="mt-2 font-serif text-5xl leading-none tracking-tight md:text-6xl">Should I buy this?</h1>
      </div>

      <form
        className="flex items-end gap-3 border-b border-border py-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!url.trim()) return;
          setSaved(false);
          buy.read({ url: url.trim() });
        }}
      >
        <label className="min-w-0 flex-1">
          <span className="label-caps block text-muted-foreground">Product link</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            inputMode="url"
            placeholder="Paste a link from any store"
            style={{ fontSize: 16 }}
            className="w-full border-b border-border bg-transparent py-2.5 text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground focus:outline-none"
          />
        </label>
        <Button size="lg" type="submit" disabled={busy || !url.trim()}>
          {busy && <Loader2 className="size-4 animate-spin" data-icon="inline-start" />}
          Check
        </Button>
      </form>

      {busy && (
        <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          {STEP[buy.stage as keyof typeof STEP]}
        </p>
      )}

      {buy.stage === "manual" && buy.product && <ManualForm key={buy.product.url} product={buy.product} onCheck={buy.check} />}

      {buy.stage === "done" && buy.product && buy.result && (
        <BuyResult product={buy.product} reply={buy.result} saving={saving} saved={saved} onSave={save} />
      )}

      {buy.stage === "idle" && (
        <p className="py-10 text-sm text-muted-foreground">
          Paste a product link. You get how many outfits it makes with what you own, whether you already have
          something like it, its cost per wear, and a Buy, Skip or Wait call.
        </p>
      )}
    </div>
  );
}

export default function BuyPage() {
  return (
    <Suspense>
      <BuyCheckPage />
    </Suspense>
  );
}
