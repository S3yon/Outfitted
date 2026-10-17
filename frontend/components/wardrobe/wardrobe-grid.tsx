"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Trash2, ExternalLink, Loader2, ArrowRightLeft } from "lucide-react";
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
      {/* Filters: category tabs left, status tabs right */}
      <div className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-6 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat ?? "all"}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "label-caps -mb-px shrink-0 border-b py-3 transition-colors",
                activeCategory === cat
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {cat ? CATEGORY_LABELS[cat] : "All"}
            </button>
          ))}
        </div>
        <div className="flex gap-6">
          {(["owned", "wishlisted"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setActiveStatus(activeStatus === s ? null : s)}
              className={cn(
                "label-caps -mb-px border-b py-3 transition-colors",
                activeStatus === s
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "owned" ? "Owned" : "Wishlist"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-2xl text-muted-foreground">
            {wardrobeItems.length === 0
              ? "Your wardrobe is empty. Upload your first item."
              : "No items match your filters."}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
      <div className="flex flex-col">
        <div className="relative aspect-[3/4] animate-pulse bg-white">
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="label-caps text-muted-foreground">
              Updating
            </p>
          </div>
        </div>
        <div className="pt-3">
          <div className="h-2.5 w-16 animate-pulse bg-muted" />
          <div className="mt-1.5 h-2 w-24 animate-pulse bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative flex flex-col">
      {/* Delete button */}
      <button
        onClick={() => !deleting && onDelete(item)}
        disabled={deleting}
        aria-label="Remove item"
        className="absolute right-2 top-2 z-10 p-1.5 text-muted-foreground transition-opacity hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-40"
      >
        {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5 stroke-[1.5]" />}
      </button>

      {/* Image */}
      <div className="relative aspect-[3/4] bg-white">
        <Image
          src={item.cloudinaryUrl}
          alt={item.category}
          fill
          unoptimized
          className="object-contain p-5"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
      </div>

      {/* Caption */}
      <div className="pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="label-caps truncate text-muted-foreground">
            {item.brand ? `${item.brand} · ${item.category}` : item.category}
          </p>
          <p className="label-caps shrink-0 text-muted-foreground">
            {item.status === "owned" ? "Owned" : "Wishlist"}
          </p>
        </div>
        {item.notes && (
          <p className="mt-1 truncate text-sm text-foreground">{item.notes}</p>
        )}
        {isWishlisted && hasPrice && (
          <p className="mt-0.5 text-sm text-foreground">{item.price}</p>
        )}

        {isWishlisted && (
          <div className="mt-3 flex flex-col">
            {/* Buy with SOL hidden
            {hasPrice && (
              <button disabled={busy} onClick={handleBuy} className="...">
                Buy with SOL
              </button>
            )}
            */}
            <div className="flex gap-px">
              <button
                disabled={queued}
                onClick={() => onMarkOwned(item)}
                className="label-caps flex flex-1 items-center justify-center gap-1.5 bg-foreground px-2 py-2 text-background transition-opacity hover:opacity-80 disabled:opacity-50"
              >
                {queued ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    Queued
                  </>
                ) : (
                  <>
                    <ArrowRightLeft className="size-3" />
                    Mark owned
                  </>
                )}
              </button>
              <Link
                href={`/buy?item=${item.id}`}
                className="label-caps flex items-center border border-border px-2.5 text-muted-foreground transition-colors hover:text-foreground"
              >
                Check
              </Link>
              {hasProductUrl && (
                <a
                  href={item.productUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open product page"
                  className="flex items-center border border-border px-2.5 text-muted-foreground transition-colors hover:text-foreground"
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
