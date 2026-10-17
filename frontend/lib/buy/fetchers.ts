import { parsePrice } from "../wear/price.ts";
import { safeFetch } from "../net/safe-fetch.ts";
import { parseSafeUrl } from "../net/safe-url.ts";
import type { Fetchers } from "./read.ts";

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "en-US,en;q=0.9",
};
const HTML_LIMIT = 2 * 1024 * 1024;

// The real network side of the read ladder (lib/buy/read.ts). Server only.
export const fetchers: Fetchers = {
  async page(url) {
    const res = await safeFetch(url, { maxBytes: HTML_LIMIT, headers: BROWSER_HEADERS });
    return res.status === 200 && res.contentType.includes("html") ? res.body.toString("utf8") : null;
  },

  // Jina Reader loads the page in its own browser and returns the rendered HTML. Free without
  // a key at a low rate; JINA_API_KEY raises it.
  async reader(url) {
    if (!parseSafeUrl(url)) return null;
    const headers: Record<string, string> = { "X-Return-Format": "html" };
    if (process.env.JINA_API_KEY) headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
    const res = await fetch(`https://r.jina.ai/${url}`, { headers, signal: AbortSignal.timeout(20_000) });
    return res.ok ? (await res.text()).slice(0, HTML_LIMIT) : null;
  },

  // Serper's Google Shopping search, first result. Paid per call after the free credits, so it
  // is the last rung before manual entry.
  async search(query) {
    const key = process.env.SERPER_API_KEY;
    if (!key) return null;
    const res = await fetch("https://google.serper.dev/shopping", {
      method: "POST",
      headers: { "X-API-KEY": key, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, num: 5, gl: "us" }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { shopping?: { title: string; imageUrl: string; price?: string; source?: string }[] };
    const first = data.shopping?.find((r) => r.title && r.imageUrl);
    if (!first) return null;
    return { title: first.title, imageUrl: first.imageUrl, price: parsePrice(first.price), currency: null, brand: first.source ?? null };
  },
};
