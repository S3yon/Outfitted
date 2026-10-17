import { inferCategory } from "./category.ts";
import { productFromHtml, titleFromUrl, type ReadProduct } from "./product.ts";

export type ReadVia = "page" | "reader" | "search" | "manual";

export type Product = {
  url: string;
  title: string | null;
  imageUrl: string | null;
  price: number | null; // cents
  currency: string | null;
  brand: string | null;
  store: string;
  category: string;
  via: ReadVia;
};

// Injected so the ladder is testable without the network. Each returns null on a miss.
export type Fetchers = {
  page: (url: string) => Promise<string | null>; // the page's HTML
  reader: (url: string) => Promise<string | null>; // the page's HTML through a reader service
  search: (query: string) => Promise<ReadProduct | null>; // first shopping result
};

const attempt = async <T>(fn: () => Promise<T | null>): Promise<T | null> => {
  try {
    return await fn();
  } catch {
    return null;
  }
};

// A pasted link → product. Free ladder: the page itself, then a reader service (for pages
// that render in JS), then a shopping search by the URL's slug, then manual entry.
export async function readProduct(url: string, f: Fetchers): Promise<Product> {
  const store = new URL(url).hostname.replace(/^www\d?\./, "");
  const done = (p: ReadProduct, via: ReadVia): Product => ({
    url,
    ...p,
    store,
    category: inferCategory(p.title),
    via,
  });

  const html = await attempt(() => f.page(url));
  const fromPage = html && productFromHtml(html, url);
  if (fromPage) return done(fromPage, "page");

  const read = await attempt(() => f.reader(url));
  const fromReader = read && productFromHtml(read, url);
  if (fromReader) return done(fromReader, "reader");

  const guess = titleFromUrl(url);
  const found = guess ? await attempt(() => f.search(guess)) : null;
  if (found) return done(found, "search");

  return {
    url,
    title: guess,
    imageUrl: null,
    price: null,
    currency: null,
    brand: null,
    store,
    category: guess ? inferCategory(guess) : "tops",
    via: "manual",
  };
}
