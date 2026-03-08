"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  ColorType,
} from "lightweight-charts";

interface PriceChartProps {
  candles: { timestamp: number; open: number; high: number; low: number; close: number; volume: number }[];
}

export function PriceChart({ candles }: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const prevLengthRef = useRef(0);

  // Create chart once
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#999",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(150,150,150,0.08)" },
        horzLines: { color: "rgba(150,150,150,0.08)" },
      },
      crosshair: {
        vertLine: { color: "rgba(150,150,150,0.3)", width: 1, style: 2 },
        horzLine: { color: "rgba(150,150,150,0.3)", width: 1, style: 2 },
      },
      rightPriceScale: { borderColor: "rgba(150,150,150,0.15)" },
      timeScale: { borderColor: "rgba(150,150,150,0.15)", timeVisible: true },
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });
    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    volumeSeriesRef.current = volumeSeries;

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
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
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      prevLengthRef.current = 0;
    };
  }, []);

  // Update data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || candles.length === 0) return;

    if (prevLengthRef.current === 0 || candles.length <= prevLengthRef.current) {
      // Full reset
      const candleData: CandlestickData[] = candles.map((c) => ({
        time: c.timestamp as CandlestickData["time"],
        open: c.open / 100,
        high: c.high / 100,
        low: c.low / 100,
        close: c.close / 100,
      }));

      const volumeData = candles.map((c) => ({
        time: c.timestamp as CandlestickData["time"],
        value: c.volume,
        color: c.close >= c.open ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
      }));

      candleSeriesRef.current.setData(candleData);
      volumeSeriesRef.current.setData(volumeData);
      chartRef.current?.timeScale().fitContent();
    } else {
      // Append new candles
      for (let i = prevLengthRef.current; i < candles.length; i++) {
        const c = candles[i];
        candleSeriesRef.current.update({
          time: c.timestamp as CandlestickData["time"],
          open: c.open / 100,
          high: c.high / 100,
          low: c.low / 100,
          close: c.close / 100,
        });
        volumeSeriesRef.current.update({
          time: c.timestamp as CandlestickData["time"],
          value: c.volume,
          color: c.close >= c.open ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
        });
      }
    }

    prevLengthRef.current = candles.length;
  }, [candles]);

  return <div ref={containerRef} className="h-full w-full" />;
}
