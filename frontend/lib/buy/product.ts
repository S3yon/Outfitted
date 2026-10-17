import { parsePrice } from "../wear/price.ts";

export type ReadProduct = {
  title: string;
  imageUrl: string;
  price: number | null; // cents
  currency: string | null;
  brand: string | null;
};

type Json = Record<string, unknown>;

const isType = (node: Json, type: string) =>
  node["@type"] === type || (Array.isArray(node["@type"]) && node["@type"].includes(type));

// Every object in a JSON-LD block, depth first (top level, arrays, @graph).
function nodes(value: unknown): Json[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object") return [];
  const node = value as Json;
  return [node, ...nodes(node["@graph"])];
}

const text = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : typeof value === "number" ? String(value) : null;

function firstImage(value: unknown): string | null {
  if (Array.isArray(value)) return firstImage(value[0]);
  if (value && typeof value === "object") return text((value as Json).url);
  return text(value);
}

function offerPrice(offers: unknown): { price: number | null; currency: string | null } {
  const offer = (Array.isArray(offers) ? offers[0] : offers) as Json | undefined;
  if (!offer || typeof offer !== "object") return { price: null, currency: null };
  const raw = offer.price ?? offer.lowPrice ?? (offer.priceSpecification as Json | undefined)?.price;
  return { price: parsePrice(text(raw)), currency: text(offer.priceCurrency) };
}

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");

function meta(html: string, property: string): string | null {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]*>`, "i");
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=(["'])(.*?)\1/i)?.[2];
  return content ? decode(content.trim()) : null;
}

const absolute = (url: string, base: string) => {
  try {
    return new URL(url, base).href;
  } catch {
    return null;
  }
};

// A product page's HTML → title, image, price. JSON-LD Product first, then OpenGraph tags.
// Null when neither gives a title and an image (a bot wall or a page that renders in JS).
export function productFromHtml(html: string, pageUrl: string): ReadProduct | null {
  const blocks = html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi);
  for (const [, body] of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(body);
    } catch {
      continue;
    }
    const product = nodes(parsed).find((n) => isType(n, "Product"));
    if (!product) continue;
    const title = text(product.name);
    const image = firstImage(product.image);
    const imageUrl = image && absolute(image, pageUrl);
    if (!title || !imageUrl) continue;
    const brand = product.brand && typeof product.brand === "object" ? text((product.brand as Json).name) : text(product.brand);
    return { title: decode(title), imageUrl, ...offerPrice(product.offers), brand };
  }

  const title = meta(html, "og:title");
  const image = meta(html, "og:image");
  const imageUrl = image && absolute(image, pageUrl);
  if (!title || !imageUrl) return null;
  return {
    title,
    imageUrl,
    price: parsePrice(meta(html, "product:price:amount") ?? meta(html, "og:price:amount")),
    currency: meta(html, "product:price:currency") ?? meta(html, "og:price:currency"),
    brand: null,
  };
}

// A search query from the URL's slug, for when the page itself can't be read.
// "textured-knit-sweater-p03332404.html" → "textured knit sweater".
export function titleFromUrl(url: string): string | null {
  let path: string;
  try {
    path = new URL(url).pathname;
  } catch {
    return null;
  }
  const words = path
    .split("/")
    .flatMap((seg) => seg.replace(/\.[a-z]+$/i, "").split(/[-_.]+/))
    .filter((w) => /^[a-z]{3,}$/i.test(w) && !["html", "productpage", "product", "products", "item", "www"].includes(w.toLowerCase()));
  const tail = words.slice(-5);
  return tail.length >= 2 ? tail.join(" ").toLowerCase() : null;
}
