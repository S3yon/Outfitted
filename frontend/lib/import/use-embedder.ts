"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type EmbedderStatus = "loading" | "ready" | "failed";

type Reply =
  | { type: "ready" }
  | { type: "failed"; error: string }
  | { type: "embedding"; id: string; vector: number[] }
  | { type: "error"; id: string; error: string };

// Starts the FashionSigLIP worker on mount. `embed` resolves to a vector, or null when the model
// failed to load or that crop failed, so grouping can fall back to text.
export function useEmbedder() {
  const workerRef = useRef<Worker | null>(null);
  const pending = useRef(new Map<string, (vector: number[] | null) => void>());
  const statusRef = useRef<EmbedderStatus>("loading");
  const [status, setStatus] = useState<EmbedderStatus>("loading");

  useEffect(() => {
    const waiting = pending.current;
    const settle = (next: EmbedderStatus) => {
      statusRef.current = next;
      setStatus(next);
    };

    let worker: Worker;
    try {
      worker = new Worker(new URL("./embed-worker.ts", import.meta.url), { type: "module" });
    } catch {
      settle("failed");
      return;
    }
    workerRef.current = worker;

    const failAll = () => {
      settle("failed");
      for (const resolve of waiting.values()) resolve(null);
      waiting.clear();
    };

    worker.onmessage = (event: MessageEvent<Reply>) => {
      const msg = event.data;
      if (msg.type === "ready") return settle("ready");
      if (msg.type === "failed") {
        console.warn("[import] embedder failed to load:", msg.error);
        return failAll();
      }
      const resolve = waiting.get(msg.id);
      waiting.delete(msg.id);
      resolve?.(msg.type === "embedding" ? msg.vector : null);
    };
    worker.onerror = failAll;

    return () => {
      worker.terminate();
      workerRef.current = null;
      for (const resolve of waiting.values()) resolve(null);
      waiting.clear();
    };
  }, []);

  const embed = useCallback((id: string, crop: string): Promise<number[] | null> => {
    const worker = workerRef.current;
    if (!worker || statusRef.current === "failed") return Promise.resolve(null);
    return new Promise((resolve) => {
      pending.current.set(id, resolve);
      worker.postMessage({ id, crop });
    });
  }, []);

  return { status, embed };
}
