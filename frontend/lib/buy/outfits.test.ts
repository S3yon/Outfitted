import { test } from "node:test";
import assert from "node:assert/strict";
import { countOutfits, unlocks, examples } from "./outfits.ts";

const item = (id: string, category: string, wears = 0) => ({ id, category, wears });
const closet = [
  item("t1", "tops", 5), item("t2", "tops", 1),
  item("b1", "bottoms", 3),
  item("s1", "shoes", 2), item("s2", "shoes", 0),
  item("o1", "outerwear"),
];

test("countOutfits multiplies tops, bottoms and shoes", () => {
  assert.equal(countOutfits(closet), 4);
  assert.equal(countOutfits([]), 0);
});

test("unlocks counts the new core outfits a top, bottom or shoe adds", () => {
  assert.deepEqual(unlocks(closet, "tops"), { before: 4, after: 6, added: 2, missing: [] });
  assert.deepEqual(unlocks(closet, "bottoms"), { before: 4, after: 8, added: 4, missing: [] });
});

test("unlocks counts a layer or accessory as going over every core outfit", () => {
  assert.deepEqual(unlocks(closet, "outerwear"), { before: 4, after: 4, added: 4, missing: [] });
});

test("unlocks names what is missing when the item can't make an outfit", () => {
  const noShoes = closet.filter((i) => i.category !== "shoes");
  assert.deepEqual(unlocks(noShoes, "tops"), { before: 0, after: 0, added: 0, missing: ["shoes"] });
  assert.deepEqual(unlocks([], "accessories"), { before: 0, after: 0, added: 0, missing: ["tops", "bottoms", "shoes"] });
});

test("examples pairs the item with the least worn owned pieces first", () => {
  assert.deepEqual(examples(closet, "tops", 3), [["b1", "s2"], ["b1", "s1"]]);
  assert.deepEqual(examples(closet, "outerwear", 2), [["t2", "b1", "s2"], ["t2", "b1", "s1"]]);
});
