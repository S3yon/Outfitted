import { test } from "node:test";
import assert from "node:assert/strict";
import { inferCategory } from "./category.ts";

test("inferCategory reads the category from a product title", () => {
  assert.equal(inferCategory("Nike Air Force 1 Sneaker"), "shoes");
  assert.equal(inferCategory("Relaxed Linen Shirt"), "tops");
  assert.equal(inferCategory("Wide Leg Jeans"), "bottoms");
  assert.equal(inferCategory("Wool Overcoat"), "outerwear");
  assert.equal(inferCategory("Leather Belt"), "accessories");
});

test("inferCategory falls back to accessories", () => {
  assert.equal(inferCategory("Mystery item"), "accessories");
});
