"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "outfitted.watch.seenAt";
const SEEN_EVENT = "outfitted:watch-seen";

function seenAt(): string | null {
  try {
    return localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

// Called when the Wishlist tab is open: everything up to now has been seen.
export function markWatchSeen() {
  try {
    localStorage.setItem(SEEN_KEY, new Date().toISOString());
  } catch {
    // private mode: the dot just stays until the next look
  }
  window.dispatchEvent(new Event(SEEN_EVENT));
}

// True when a wishlist price dropped after the user last opened the Wishlist tab. Rechecks
// when `key` changes (the nav passes the path).
export function useDropDot(enabled: boolean, key: string) {
  const [lastDrop, setLastDrop] = useState<string | null>(null);
  const [seen, setSeen] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    fetch("/api/watch/drops")
      .then((res) => (res.ok ? res.json() : { lastDropAt: null }))
      .then((data: { lastDropAt: string | null }) => {
        if (!alive) return;
        setLastDrop(data.lastDropAt);
        setSeen(seenAt());
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled, key]);

  useEffect(() => {
    const update = () => setSeen(seenAt());
    window.addEventListener(SEEN_EVENT, update);
    return () => window.removeEventListener(SEEN_EVENT, update);
  }, []);

  return Boolean(lastDrop && (!seen || lastDrop > seen));
}
