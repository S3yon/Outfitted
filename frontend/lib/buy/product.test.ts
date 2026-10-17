import { test } from "node:test";
import assert from "node:assert/strict";
import { productFromHtml, titleFromUrl } from "./product.ts";

const ld = (json: unknown) => `<html><head><script type="application/ld+json">${JSON.stringify(json)}</script></head></html>`;

test("productFromHtml reads a JSON-LD Product with one Offer", () => {
  const html = ld({
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Oxford Shirt",
    image: ["https://cdn.shop.com/a.jpg", "https://cdn.shop.com/b.jpg"],
    brand: { "@type": "Brand", name: "Uniqlo" },
    offers: { "@type": "Offer", price: "39.90", priceCurrency: "CAD" },
  });
  assert.deepEqual(productFromHtml(html, "https://shop.com/p/1"), {
    title: "Oxford Shirt",
    imageUrl: "https://cdn.shop.com/a.jpg",
    price: 3990,
    currency: "CAD",
    brand: "Uniqlo",
  });
});

test("productFromHtml finds the Product inside @graph and reads AggregateOffer lowPrice", () => {
  const html = ld({
    "@graph": [
      { "@type": "WebPage", name: "page" },
      { "@type": ["Product"], name: "Chinos", image: { url: "/img/c.jpg" }, offers: { "@type": "AggregateOffer", lowPrice: 55, priceCurrency: "USD" } },
    ],
  });
  const p = productFromHtml(html, "https://shop.com/p/2");
  assert.equal(p?.title, "Chinos");
  assert.equal(p?.imageUrl, "https://shop.com/img/c.jpg");
  assert.equal(p?.price, 5500);
});

test("productFromHtml takes the first offer of a list and skips broken JSON blocks", () => {
  const html =
    `<script type="application/ld+json">{ not json</script>` +
    ld([{ "@type": "Product", name: "Boots", image: "https://x.com/b.jpg", offers: [{ price: "120", priceCurrency: "USD" }, { price: "99" }] }]);
  const p = productFromHtml(html, "https://x.com/boots");
  assert.equal(p?.price, 12000);
  assert.equal(p?.currency, "USD");
});

test("productFromHtml falls back to OpenGraph and product meta tags", () => {
  const html = `<meta property="og:title" content="Wool Coat &amp; Belt">
    <meta property="og:image" content="https://img.com/coat.jpg">
    <meta property="product:price:amount" content="249.00">
    <meta property="product:price:currency" content="EUR">`;
  assert.deepEqual(productFromHtml(html, "https://img.com/coat"), {
    title: "Wool Coat & Belt",
    imageUrl: "https://img.com/coat.jpg",
    price: 24900,
    currency: "EUR",
    brand: null,
  });
});

test("productFromHtml keeps apostrophes inside a quoted meta value", () => {
  const html = `<meta content="Levi's 501 Jeans" property="og:title"><meta property="og:image" content="https://l.com/j.jpg">`;
  assert.equal(productFromHtml(html, "https://l.com/j")?.title, "Levi's 501 Jeans");
});

test("productFromHtml gives null without a title and image", () => {
  assert.equal(productFromHtml("<html><title>Access denied</title></html>", "https://zara.com/x"), null);
});

test("titleFromUrl turns a product slug into words", () => {
  assert.equal(titleFromUrl("https://www.zara.com/ca/en/textured-knit-sweater-p03332404.html?v1=1"), "textured knit sweater");
  assert.equal(titleFromUrl("https://www2.hm.com/en_ca/productpage.1234567001.html"), null);
});
