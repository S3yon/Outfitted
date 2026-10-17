import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCheckInput } from "./check-input.ts";

const vector = Array.from({ length: 768 }, () => 0.01);

test("parseCheckInput reads a product and an optional embedding", () => {
  assert.deepEqual(
    parseCheckInput({ product: { title: " Linen shirt ", category: "tops", price: 4500, itemId: "i1" }, embedding: vector }),
    { ok: true, value: { title: "Linen shirt", category: "tops", price: 4500, itemId: "i1", embedding: vector } },
  );
  assert.deepEqual(parseCheckInput({ product: { title: "Cap", category: "accessories", price: null } }), {
    ok: true,
    value: { title: "Cap", category: "accessories", price: null, itemId: null, embedding: null },
  });
});

test("parseCheckInput rejects bad categories, prices and vectors", () => {
  assert.equal(parseCheckInput({ product: { title: "x", category: "hats", price: 1 } }).ok, false);
  assert.equal(parseCheckInput({ product: { title: "x", category: "tops", price: -5 } }).ok, false);
  assert.equal(parseCheckInput({ product: { title: "", category: "tops", price: 5 } }).ok, false);
  assert.equal(parseCheckInput({ product: { title: "x", category: "tops", price: 5 }, embedding: [1, 2] }).ok, false);
  assert.equal(parseCheckInput(null).ok, false);
});
