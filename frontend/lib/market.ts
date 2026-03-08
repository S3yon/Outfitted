import type { PriceCandle } from "@/db/schema";

const CANDLE_INTERVAL = 300; // 5 minutes per candle

/** Generate simulated OHLC history for a listing. */
export function generatePriceHistory(
  listingId: string,
  startPrice: number,
  candleCount: number,
): Omit<PriceCandle, "id">[] {
  const now = Math.floor(Date.now() / 1000);
  const startTime = now - candleCount * CANDLE_INTERVAL;

  let price = startPrice;
  const candles: Omit<PriceCandle, "id">[] = [];

  for (let i = 0; i < candleCount; i++) {
    const open = price;
    const drift = (Math.random() - 0.48) * 0.04; // slight upward bias
    const volatility = 0.02 + Math.random() * 0.03;

    const move1 = open * (1 + (Math.random() - 0.5) * volatility);
    const move2 = open * (1 + (Math.random() - 0.5) * volatility);
    const close = Math.max(1, Math.round(open * (1 + drift)));

    const high = Math.max(open, close, Math.round(move1), Math.round(move2));
    const low = Math.min(open, close, Math.round(move1), Math.round(move2));
    const volume = Math.floor(50 + Math.random() * 500);

    candles.push({
      listingId,
      timestamp: startTime + i * CANDLE_INTERVAL,
      open,
      high: Math.max(high, 1),
      low: Math.max(low, 1),
      close,
      volume,
    });

    price = close;
  }

  return candles;
}

/** Generate a ticker from an outfit description. */
export function generateTicker(description: string): string {
  const words = description
    .replace(/[^a-zA-Z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return "$FIT" + Math.floor(Math.random() * 999);

  const ticker = words
    .slice(0, 3)
    .map((w) => w.slice(0, 2).toUpperCase())
    .join("");

  return "$" + ticker;
}
