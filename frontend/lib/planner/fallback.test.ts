import { test } from "node:test";
import assert from "node:assert/strict";
import { pickOutfit } from "./fallback.ts";

const e = (id: string, category: string, daysIdle: number) => ({ id, category, notes: "", wears: 0, daysIdle, lastWorn: null });
const closet = [
  e("tee-old", "tops", 90),
  e("tee-new", "tops", 3),
  e("jeans", "bottoms", 70),
  e("chinos", "bottoms", 10),
  e("boots", "shoes", 40),
  e("coat", "outerwear", 120),
  e("cap", "accessories", 200),
];

test("pickOutfit takes the most idle top, bottom and shoes", () => {
  assert.deepEqual(pickOutfit(closet, "mild", new Set()), ["tee-old", "jeans", "boots"]);
});

test("pickOutfit adds outerwear when it's cold or cool", () => {
  assert.deepEqual(pickOutfit(closet, "cool", new Set()), ["tee-old", "jeans", "boots", "coat"]);
  assert.deepEqual(pickOutfit(closet, "cold", new Set()), ["tee-old", "jeans", "boots", "coat"]);
  assert.deepEqual(pickOutfit(closet, null, new Set()), ["tee-old", "jeans", "boots"]);
});

test("pickOutfit prefers items not used yet this week", () => {
  assert.deepEqual(pickOutfit(closet, "warm", new Set(["tee-old", "jeans"])), ["tee-new", "chinos", "boots"]);
});

test("pickOutfit repeats an item when the category has nothing unused", () => {
  assert.deepEqual(pickOutfit(closet, "warm", new Set(["tee-old", "tee-new", "boots"])), ["tee-old", "jeans", "boots"]);
});

test("pickOutfit skips categories the closet lacks", () => {
  assert.deepEqual(pickOutfit([e("tee", "tops", 1)], "hot", new Set()), ["tee"]);
  assert.deepEqual(pickOutfit([], "hot", new Set()), []);
});
