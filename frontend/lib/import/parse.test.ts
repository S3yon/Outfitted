import { test } from "node:test";
import assert from "node:assert/strict";
import { parseDetections } from "./parse.ts";

const box = { x1: 0.1, y1: 0.1, x2: 0.6, y2: 0.5 };

test("parses fenced JSON and keeps valid items", () => {
  const text = "```json\n" + JSON.stringify({ items: [{ category: "Tops", description: " Black tee ", color: "Black", bbox: box }] }) + "\n```";
  assert.deepEqual(parseDetections(text), [{ category: "tops", description: "Black tee", color: "black", bbox: box }]);
});

test("drops unknown categories and items without a usable box", () => {
  const text = JSON.stringify({ items: [
    { category: "socks", description: "x", bbox: box },
    { category: "shoes", description: "white sneakers", bbox: { x1: 0, y1: 0, x2: 0.01, y2: 0.01 } },
    { category: "bottoms", description: "jeans", bbox: box },
  ] });
  assert.deepEqual(parseDetections(text).map((d) => d.category), ["bottoms"]);
});

test("falls back to the category when the description is missing", () => {
  const [d] = parseDetections(JSON.stringify({ items: [{ category: "shoes", bbox: box }] }));
  assert.equal(d.description, "shoes");
  assert.equal(d.color, null);
});

test("returns no items when the reply has none", () => {
  assert.deepEqual(parseDetections('{"items": []}'), []);
  assert.deepEqual(parseDetections("{}"), []);
});

test("throws on a reply that is not JSON", () => {
  assert.throws(() => parseDetections("Sorry, I can't help with that."));
});
