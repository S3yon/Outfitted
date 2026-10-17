"use client";

import { useCallback, useState } from "react";
import { useEmbedder } from "@/lib/import/use-embedder";
import { proxied, type BuyProduct, type CheckReply } from "./types";

export type Stage = "idle" | "reading" | "manual" | "checking" | "done";

const EMBED_WAIT_MS = 25_000; // first load downloads the model; past this, check without it

const withTimeout = <T,>(p: Promise<T>, ms: number, fallback: T) =>
  Promise.race([p, new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms))]);

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Something went wrong");
  return data as T;
}

// Paste a link (or open a saved wishlist item) → product → image embedding → verdict.
export function useBuyCheck() {
  const { embed } = useEmbedder();
  const [stage, setStage] = useState<Stage>("idle");
  const [product, setProduct] = useState<BuyProduct | null>(null);
  const [embedding, setEmbedding] = useState<number[] | null>(null);
  const [result, setResult] = useState<CheckReply | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(
    async (p: BuyProduct) => {
      setProduct(p);
      setStage("checking");
      setError(null);
      try {
        const vector = p.imageUrl
          ? await withTimeout(embed(crypto.randomUUID(), proxied(p.imageUrl)), EMBED_WAIT_MS, null)
          : null;
        setEmbedding(vector);
        const reply = await postJson<CheckReply>("/api/buy/check", {
          product: { title: p.title, category: p.category, price: p.price, itemId: p.itemId },
          embedding: vector,
        });
        setResult(reply);
        setStage("done");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Check failed");
        setStage("manual");
      }
    },
    [embed],
  );

  const read = useCallback(
    async (body: { url: string } | { itemId: string }) => {
      setStage("reading");
      setResult(null);
      setError(null);
      try {
        const { product: p } = await postJson<{ product: BuyProduct }>("/api/buy/read", body);
        // Manual: the store blocked every rung, or the read has no price or title to judge.
        if (p.via === "manual" || !p.title || p.price === null) {
          setProduct(p);
          setStage("manual");
          return;
        }
        await check(p);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't read that link");
        setStage("idle");
      }
    },
    [check],
  );

  const reset = useCallback(() => {
    setStage("idle");
    setProduct(null);
    setResult(null);
    setError(null);
  }, []);

  return { stage, product, embedding, result, error, read, check, reset };
}
