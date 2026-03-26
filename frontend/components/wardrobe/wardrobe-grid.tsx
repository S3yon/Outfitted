"use client";

import Image from "next/image";
import { useState } from "react";
import { Trash2, Check, Heart, ExternalLink, Loader2, ArrowRightLeft } from "lucide-react";
// import { useConnection, useWallet } from "@solana/wallet-adapter-react";
// import { useWalletModal } from "@solana/wallet-adapter-react-ui";
// import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useAppStore } from "@/stores/use-app-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ClothingItem } from "@/db/schema";

// Module-level queues — survive React re-renders and component remounts
type OwnedEntry = {
  item: ClothingItem;
  onStart: (id: string) => void;
  onDone: (id: string, updated: ClothingItem | null) => void;
};
const _ownedQueue: OwnedEntry[] = [];
let _ownedProcessing = false;

async function drainOwnedQueue() {
  if (_ownedProcessing) return;
  _ownedProcessing = true;
  let successCount = 0;
  while (_ownedQueue.length > 0) {
    const { item, onStart, onDone } = _ownedQueue.shift()!;
    onStart(item.id);
    try {
      const res = await fetch(`/api/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "owned" }),
      });
      if (!res.ok) {
        onDone(item.id, null);
        toast.error(`Failed to update ${item.category}`);
      } else {
        const updated: ClothingItem = await res.json();
        onDone(item.id, updated);
        successCount++;
      }
    } catch {
      onDone(item.id, null);
      toast.error(`Failed to update ${item.category}`);
    }
  }
  _ownedProcessing = false;
  if (successCount > 0) {
    toast.success(successCount === 1 ? "Item moved to owned" : `${successCount} items moved to owned`);
  }
}

type DeleteEntry = { id: string; onDone: (id: string, success: boolean) => void };
const _deleteQueue: DeleteEntry[] = [];
let _deleteProcessing = false;

async function drainDeleteQueue() {
  if (_deleteProcessing) return;
  _deleteProcessing = true;
  while (_deleteQueue.length > 0) {
    const { id, onDone } = _deleteQueue.shift()!;
    try {
      const res = await fetch(`/api/items/${id}`, { method: "DELETE" });
      onDone(id, res.ok);
    } catch {
      onDone(id, false);
    }
  }
  _deleteProcessing = false;
}

// const TREASURY_WALLET = new PublicKey("11111111111111111111111111111112");

const CATEGORIES = [null, "tops", "bottoms", "shoes", "outerwear", "accessories"] as const;
const CATEGORY_LABELS: Record<string, string> = {
  tops: "Tops",
  bottoms: "Bottoms",
  shoes: "Shoes",
  outerwear: "Outerwear",
  accessories: "Accessories",
};

export function WardrobeGrid() {
  const {
    wardrobeItems,
    updateWardrobeItem,
    activeCategory,
    setActiveCategory,
    activeStatus,
    setActiveStatus,
    removeWardrobeItem,
    processingItemIds,
    addProcessingItem,
    removeProcessingItem,
  } = useAppStore();
  const [queuedItemIds, setQueuedItemIds] = useState<Set<string>>(new Set());
  const [deletingItemIds, setDeletingItemIds] = useState<Set<string>>(new Set());

  const filtered = wardrobeItems
    .filter((i) => (activeCategory ? i.category === activeCategory : true))
    .filter((i) => (activeStatus ? i.status === activeStatus : true));

  function handleDelete(item: ClothingItem) {
    setDeletingItemIds((prev) => new Set(prev).add(item.id));
    _deleteQueue.push({
      id: item.id,
      onDone: (id, success) => {
        setDeletingItemIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        if (success) {
          removeWardrobeItem(id);
          toast.success("Item removed");
        } else {
          toast.error("Failed to delete item");
        }
      },
    });
    drainDeleteQueue();
  }

  function handleMarkOwned(item: ClothingItem) {
    // Optimistic UI: mark as owned immediately
    updateWardrobeItem(item.id, { status: "owned" });
    setQueuedItemIds((prev) => new Set(prev).add(item.id));

    _ownedQueue.push({
      item,
      onStart: (id) => {
        setQueuedItemIds((prev) => { const s = new Set(prev); s.delete(id); return s; });
        addProcessingItem(id);
      },
      onDone: (id, updated) => {
        removeProcessingItem(id);
        if (updated) {
          updateWardrobeItem(id, updated);
        } else {
          // Revert optimistic update on failure
          updateWardrobeItem(id, { status: "wishlisted" });
        }
      },
    });

    drainOwnedQueue();
  }

  // async function handleBuyWithSol(item: ClothingItem) { /* Solana hidden */ }

  return (
    <div>
      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map((cat) => (
          <button
            key={cat ?? "all"}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "shrink-0 rounded-full border px-4 py-1.5 text-xs transition-all",
              activeCategory === cat
                ? "border-foreground/30 bg-foreground/10 text-foreground font-medium"
                : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20",
            )}
          >
            {cat ? CATEGORY_LABELS[cat] : "All"}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="mt-3 flex gap-2">
        {(["owned", "wishlisted"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setActiveStatus(activeStatus === s ? null : s)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs capitalize transition-all",
              activeStatus === s
                ? "border-foreground/30 bg-foreground/10 text-foreground font-medium"
                : "border-white/10 bg-white/5 text-muted-foreground hover:border-white/20",
            )}
          >
            {s === "owned" ? "Owned" : "Wishlist"}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            {wardrobeItems.length === 0
              ? "Your wardrobe is empty. Upload your first item."
              : "No items match your filters."}
          </p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              processing={processingItemIds.includes(item.id)}
              queued={queuedItemIds.has(item.id)}
              deleting={deletingItemIds.has(item.id)}
              onDelete={handleDelete}
              onMarkOwned={handleMarkOwned}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({
  item,
  processing,
  queued,
  deleting,
  onDelete,
  onMarkOwned,
}: {
  item: ClothingItem;
  processing: boolean;
  queued: boolean;
  deleting: boolean;
  onDelete: (item: ClothingItem) => void;
  onMarkOwned: (item: ClothingItem) => void;
}) {
  const isWishlisted = item.status === "wishlisted";
  const hasPrice = Boolean(item.price);
  const hasProductUrl = Boolean(item.productUrl);

  if (processing) {
    return (
      <div className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white">
        <div className="relative aspect-[3/4] animate-pulse bg-muted">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-[10px] font-medium text-muted-foreground">
              Updating...
            </p>
          </div>
        </div>
        <div className="border-t border-black/5 bg-background p-2.5">
          <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
          <div className="mt-1.5 h-2 w-24 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-white/10 bg-white transition-shadow hover:shadow-lg hover:shadow-black/20">
      {/* Status badge */}
      <div className="absolute left-2 top-2 z-10">
        {item.status === "owned" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-gold/90 px-2 py-0.5 text-[10px] font-medium text-black">
            <Check className="size-2.5" />
            Owned
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-neon/90 px-2 py-0.5 text-[10px] font-medium text-black">
            <Heart className="size-2.5" />
            Wishlist
          </span>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={() => !deleting && onDelete(item)}
        disabled={deleting}
        className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1.5 text-white/60 transition-opacity hover:text-red-400 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-40"
      >
        {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
      </button>

      {/* Image */}
      <div className="relative aspect-[3/4]">
        <Image
          src={item.cloudinaryUrl}
          alt={item.category}
          fill
          unoptimized
          className="object-contain p-3"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
      </div>

      {/* Info — always visible below image */}
      <div className="border-t border-black/5 bg-background p-2.5">
        {item.brand && (
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {item.brand}
          </p>
        )}
        <p className="text-xs font-medium capitalize text-foreground">{item.category}</p>
        {item.notes && (
          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{item.notes}</p>
        )}
        {isWishlisted && hasPrice && (
          <p className="mt-1 text-sm font-semibold text-foreground">{item.price}</p>
        )}

        {isWishlisted && (
          <div className="mt-2 flex flex-col gap-1.5">
            {/* Buy with SOL hidden
            {hasPrice && (
              <button disabled={busy} onClick={handleBuy} className="...">
                Buy with SOL
              </button>
            )}
            */}
            <div className="flex gap-1.5">
              <button
                disabled={queued}
                onClick={() => onMarkOwned(item)}
                className="flex flex-1 items-center justify-center gap-1 rounded-md bg-gold px-2 py-1.5 text-[11px] font-medium text-black transition-colors hover:bg-gold/80 disabled:opacity-50"
              >
                {queued ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Queued
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="size-3" />
                    Mark Owned
                  </>
                )}
              </button>
              {hasProductUrl && (
                <a
                  href={item.productUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center rounded-md border border-border px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
