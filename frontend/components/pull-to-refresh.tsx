"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const THRESHOLD = 64; // px of pull needed to trigger refresh

export function PullToRefresh({
  onRefresh,
  children,
}: {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startYRef = useRef(0);
  const activeRef = useRef(false);
  const refreshingRef = useRef(false);
  const pullYRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 2) return;
      startYRef.current = e.touches[0].clientY;
      activeRef.current = true;
    }

    function onTouchMove(e: TouchEvent) {
      if (!activeRef.current || refreshingRef.current) return;
      const delta = e.touches[0].clientY - startYRef.current;
      if (delta <= 0) { activeRef.current = false; return; }
      // Resist the pull with damping
      const resistance = Math.min(THRESHOLD + 16, delta * 0.45);
      pullYRef.current = resistance;
      setPullY(resistance);
    }

    async function onTouchEnd() {
      if (!activeRef.current) return;
      activeRef.current = false;
      if (pullYRef.current >= THRESHOLD * 0.75) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullY(THRESHOLD * 0.55);
        await onRefresh();
        refreshingRef.current = false;
        setRefreshing(false);
      }
      pullYRef.current = 0;
      setPullY(0);
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [onRefresh]);

  const indicatorHeight = refreshing ? THRESHOLD * 0.55 : pullY;

  return (
    <div ref={containerRef}>
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: indicatorHeight,
          transition: pullY === 0 ? "height 0.25s ease" : "none",
        }}
      >
        {indicatorHeight > 4 && (
          <Loader2
            className="size-5 text-muted-foreground"
            style={{
              transform: refreshing ? undefined : `rotate(${Math.min(360, (pullY / THRESHOLD) * 360)}deg)`,
              animation: refreshing ? "spin 0.8s linear infinite" : "none",
            }}
          />
        )}
      </div>
      {children}
    </div>
  );
}
