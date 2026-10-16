import { test } from "node:test";
import assert from "node:assert/strict";
import { parseItemPatch, readEmbedding } from "./item-patch.ts";

const vector = Array.from({ length: 768 }, (_, i) => i / 768);

test("parseItemPatch leaves out fields the body doesn't send", () => {
  assert.deepEqual(parseItemPatch({ notes: "x" }), { ok: true, value: {} });
});

test("parseItemPatch stores a price normalised", () => {
  assert.deepEqual(parseItemPatch({ price: "CA$45" }), { ok: true, value: { price: "$45" } });
  assert.deepEqual(parseItemPatch({ price: "12.5" }), { ok: true, value: { price: "$12.50" } });
});

test("parseItemPatch clears the price on null or blank", () => {
  assert.deepEqual(parseItemPatch({ price: null }), { ok: true, value: { price: null } });
  assert.deepEqual(parseItemPatch({ price: "  " }), { ok: true, value: { price: null } });
});

test("parseItemPatch rejects a price with no number", () => {
  assert.deepEqual(parseItemPatch({ price: "soon" }), { ok: false, error: "Invalid price" });
  assert.deepEqual(parseItemPatch({ price: 12 }), { ok: false, error: "Invalid price" });
});

test("parseItemPatch stores a 768 float embedding as JSON", () => {
  const result = parseItemPatch({ embedding: vector });
  assert.equal(result.ok, true);
  if (result.ok) assert.deepEqual(JSON.parse(result.value.embedding!), vector);
});

test("parseItemPatch rejects a bad embedding", () => {
  const bad = { ok: false, error: "Invalid embedding" };
  assert.deepEqual(parseItemPatch({ embedding: [1, 2, 3] }), bad);
  assert.deepEqual(parseItemPatch({ embedding: [...vector.slice(1), NaN] }), bad);
  assert.deepEqual(parseItemPatch({ embedding: "[]" }), bad);
});

test("parseItemPatch clears the embedding on null", () => {
  assert.deepEqual(parseItemPatch({ embedding: null }), { ok: true, value: { embedding: null } });
});

test("readEmbedding parses a stored vector", () => {
  assert.deepEqual(readEmbedding(JSON.stringify(vector)), vector);
});

test("readEmbedding gives null for missing or broken values", () => {
  assert.equal(readEmbedding(null), null);
  assert.equal(readEmbedding("not json"), null);
  assert.equal(readEmbedding("[1,2]"), null);
});
