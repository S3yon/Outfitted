"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { WatchItem } from "@/lib/watch/view";
import { markWatchSeen } from "./use-drop-dot";
import { WatchList } from "./watch-list";
import { WatchPanel } from "./watch-panel";

const SEEN_KEY = "outfitted.watch.seenAt";

// Market → Wishlist: watched prices. Opening it refreshes a few stale prices server side and
// counts as having seen every drop so far.
export function WatchTab() {
  const [items, setItems] = useState<WatchItem[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [seenBefore, setSeenBefore] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/watch")
      .then((res) => (res.ok ? res.json() : { items: [] }))
      .then((data: { items: WatchItem[] }) => {
        if (!alive) return;
        try {
          setSeenBefore(localStorage.getItem(SEEN_KEY));
        } catch {
          // no storage: every drop shows as new
        }
        // Newest drop first, then the rest by title.
        const sorted = [...data.items].sort(
          (a, b) => (b.lastDropAt ?? "").localeCompare(a.lastDropAt ?? "") || a.title.localeCompare(b.title),
        );
        setItems(sorted);
        setSelectedId(sorted[0]?.id ?? null);
        markWatchSeen();
      })
      .catch(() => alive && setItems([]));
    return () => {
      alive = false;
    };
  }, []);

  if (!items) {
    return (
      <div className="flex h-[40vh] items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="py-24 text-center">
        <p className="font-serif text-2xl text-muted-foreground">Nothing watched yet.</p>
        <p className="mt-3 text-sm text-muted-foreground">
          <Link href="/buy" className="underline underline-offset-4 hover:text-foreground">
            Check a product link
          </Link>{" "}
          and add it to your wishlist to watch its price here.
        </p>
      </div>
    );
  }

  const selected = items.find((i) => i.id === selectedId) ?? items[0];

  return (
    <div className="mt-6 grid gap-10 lg:grid-cols-[380px_1fr]">
      <WatchList
        items={items}
        selectedId={selected.id}
        seenAt={seenBefore}
        onSelect={(item) => {
          setSelectedId(item.id);
          if (window.innerWidth < 1024) panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
      <div ref={panelRef} className="scroll-mt-6">
        <WatchPanel
          key={selected.id}
          item={selected}
          onTarget={(cents) => setItems((prev) => prev!.map((i) => (i.id === selected.id ? { ...i, targetPrice: cents } : i)))}
        />
      </div>
    </div>
  );
}
