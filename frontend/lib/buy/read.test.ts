import { test } from "node:test";
import assert from "node:assert/strict";
import { readProduct, type Fetchers } from "./read.ts";

const page = `<meta property="og:title" content="Linen Shirt"><meta property="og:image" content="https://s.com/l.jpg"><meta property="product:price:amount" content="45">`;
const none = async () => null;
const calls: string[] = [];
const fetchers = (over: Partial<Fetchers>): Fetchers => ({
  page: async () => (calls.push("page"), null),
  reader: async () => (calls.push("reader"), null),
  search: async () => (calls.push("search"), null),
  ...over,
});

test("readProduct uses the page when it has product data", async () => {
  const p = await readProduct("https://s.com/linen-shirt", fetchers({ page: async () => page }));
  assert.equal(p.via, "page");
  assert.equal(p.title, "Linen Shirt");
  assert.equal(p.category, "tops");
  assert.equal(p.price, 4500);
  assert.equal(p.store, "s.com");
});

test("readProduct falls back to the reader, then to search by the URL slug", async () => {
  calls.length = 0;
  const viaReader = await readProduct("https://s.com/x", fetchers({ reader: async () => page }));
  assert.equal(viaReader.via, "reader");
  assert.deepEqual(calls, ["page"]);

  let query = "";
  const viaSearch = await readProduct(
    "https://www.zara.com/ca/en/textured-knit-sweater-p03332404.html",
    fetchers({ search: async (q) => ((query = q), { title: "Textured Knit Sweater", imageUrl: "https://z.com/s.jpg", price: 5990, currency: null, brand: "Zara" }) }),
  );
  assert.equal(query, "textured knit sweater");
  assert.equal(viaSearch.via, "search");
  assert.equal(viaSearch.category, "tops");
  assert.equal(viaSearch.store, "zara.com");
});

test("readProduct asks for manual entry when nothing works, keeping a guessed title", async () => {
  const p = await readProduct("https://www.zara.com/ca/en/wide-leg-trousers-p1.html", fetchers({ search: none }));
  assert.equal(p.via, "manual");
  assert.equal(p.title, "wide leg trousers");
  assert.equal(p.category, "bottoms");
  assert.equal(p.imageUrl, null);
});

test("readProduct treats a fetcher error as a miss and keeps going", async () => {
  const p = await readProduct("https://s.com/x", fetchers({ page: async () => { throw new Error("403"); }, reader: async () => page }));
  assert.equal(p.via, "reader");
});
