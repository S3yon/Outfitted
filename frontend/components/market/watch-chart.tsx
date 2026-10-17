"use client";

import { useEffect, useRef } from "react";
import { ColorType, LineStyle, LineType, createChart, type IChartApi, type ISeriesApi, type UTCTimestamp } from "lightweight-charts";
import { stepSeries } from "@/lib/watch/series";
import type { WatchItem } from "@/lib/watch/view";

// One wishlist item's real price history: a step line (a price holds until it changes), a
// marker on the all-time low, and lines for the 30-day low and the target.
export function WatchChart({ item }: { item: WatchItem }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: "#737373", fontSize: 11 },
      grid: { vertLines: { visible: false }, horzLines: { color: "#e6e6e6" } },
      crosshair: {
        vertLine: { color: "#111111", width: 1, style: 2, labelBackgroundColor: "#111111" },
        horzLine: { color: "#111111", width: 1, style: 2, labelBackgroundColor: "#111111" },
      },
      rightPriceScale: { borderColor: "#d9d9d9", scaleMargins: { top: 0.2, bottom: 0.2 } },
      timeScale: { borderColor: "#d9d9d9" },
      handleScroll: false,
      handleScale: false,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });
    chartRef.current = chart;
    seriesRef.current = chart.addLineSeries({
      color: "#111111",
      lineWidth: 2,
      lineType: LineType.WithSteps,
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
      lastValueVisible: true,
      priceLineVisible: false,
    });
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      chart.applyOptions({ width, height });
    });
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;
    const data = stepSeries(item.points, new Date().toISOString()).map((p) => ({ time: p.time as UTCTimestamp, value: p.value }));
    series.setData(data);
    // Keep the target in view even when it sits below every price so far.
    const target = item.targetPrice ? item.targetPrice / 100 : null;
    series.applyOptions({
      autoscaleInfoProvider: (original: () => { priceRange: { minValue: number; maxValue: number } } | null) => {
        const range = original();
        if (!range || target === null) return range;
        return {
          ...range,
          priceRange: { minValue: Math.min(range.priceRange.minValue, target), maxValue: Math.max(range.priceRange.maxValue, target) },
        };
      },
    });

    const s = item.summary;
    const low = s ? item.points.find((p) => p.price === s.allTimeLow) : undefined;
    series.setMarkers(
      low && item.points.length > 1
        ? [{ time: Math.floor(Date.parse(low.checkedAt) / 1000) as UTCTimestamp, position: "belowBar", color: "#047857", shape: "arrowUp", text: "Low" }]
        : [],
    );
    const lines = [
      s && item.points.length > 1
        ? series.createPriceLine({ price: s.low30 / 100, color: "#047857", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "30-day low" })
        : null,
      item.targetPrice
        ? series.createPriceLine({ price: item.targetPrice / 100, color: "#b45309", lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: "Target" })
        : null,
    ];
    chartRef.current?.timeScale().fitContent();
    return () => {
      for (const line of lines) if (line) seriesRef.current?.removePriceLine(line);
    };
  }, [item]);

  return <div ref={containerRef} className="h-full w-full" />;
}
