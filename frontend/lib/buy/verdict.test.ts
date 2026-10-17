import { test } from "node:test";
import assert from "node:assert/strict";
import { closest, expectedWears, score, checkBuy, type OwnedItem } from "./verdict.ts";

const own = (id: string, category: string, extra: Partial<OwnedItem> = {}): OwnedItem => ({
  id, category, wears: 0, daysOwned: 365, embedding: null, notes: null, ...extra,
});

test("closest finds the most similar owned item of the same category", () => {
  const owned = [
    own("a", "tops", { embedding: [1, 0] }),
    own("b", "tops", { embedding: [0.8, 0.6] }),
    own("c", "bottoms", { embedding: [1, 0] }),
  ];
  assert.deepEqual(closest([1, 0], owned, "tops"), { itemId: "a", score: 1 });
  assert.equal(closest([0, 1], owned, "tops"), null); // b scores 0.6, under the show line
  assert.equal(closest(null, owned, "tops"), null);
});

test("expectedWears is the median yearly wear rate in the category, 30 without history", () => {
  const owned = [
    own("a", "tops", { wears: 10, daysOwned: 365 }),
    own("b", "tops", { wears: 20, daysOwned: 182 }),
    own("c", "tops", { wears: 2, daysOwned: 365 }),
  ];
  assert.equal(expectedWears(owned, "tops"), 10);
  assert.equal(expectedWears(owned, "shoes"), 30);
  assert.equal(expectedWears([own("x", "tops", { wears: 0 })], "tops"), 30);
});

test("score rewards new outfits and takes off for duplicates, crowding and cost per wear", () => {
  assert.equal(score({ before: 20, added: 20, duplicate: null, categoryCount: 2, medianCategoryCount: 2, costPerWear: 100 }), 100);
  assert.equal(score({ before: 20, added: 0, duplicate: null, categoryCount: 2, medianCategoryCount: 2, costPerWear: 100 }), 0);
  assert.equal(score({ before: 20, added: 20, duplicate: 0.9, categoryCount: 2, medianCategoryCount: 2, costPerWear: 100 }), 60);
  assert.equal(score({ before: 20, added: 20, duplicate: null, categoryCount: 4, medianCategoryCount: 2, costPerWear: 100 }), 80);
  assert.equal(score({ before: 20, added: 20, duplicate: null, categoryCount: 2, medianCategoryCount: 2, costPerWear: 1000 }), 80);
});

const closet = [
  own("t1", "tops", { wears: 12, embedding: [1, 0], notes: "White oxford shirt" }),
  own("b1", "bottoms", { wears: 30 }),
  own("b2", "bottoms", { wears: 5 }),
  own("s1", "shoes", { wears: 40 }),
];

test("checkBuy says buy when the item adds outfits at a fair cost per wear", () => {
  const c = checkBuy({ category: "tops", price: 4000, embedding: [0, 1], owned: closet, low30: null });
  assert.equal(c.verdict, "buy");
  assert.deepEqual(c.outfits, { before: 2, after: 4, added: 2, missing: [] });
  assert.equal(c.costPerWear, 333);
  assert.deepEqual(c.examples, [["b2", "s1"], ["b1", "s1"]]);
  assert.equal(c.duplicate, null);
  assert.match(c.reason, /2 new outfits/);
});

test("checkBuy says skip for a near duplicate and names it", () => {
  const c = checkBuy({ category: "tops", price: 4000, embedding: [1, 0], owned: closet, low30: null });
  assert.equal(c.verdict, "skip");
  assert.deepEqual(c.duplicate, { itemId: "t1", score: 1 });
  assert.match(c.reason, /White oxford shirt/);
});

test("checkBuy says skip when there is nothing to wear it with", () => {
  const c = checkBuy({ category: "tops", price: 4000, embedding: null, owned: closet.filter((i) => i.category !== "shoes"), low30: null });
  assert.equal(c.verdict, "skip");
  assert.match(c.reason, /no shoes/);
});

test("checkBuy says wait when the price is 5% or more above its 30-day low", () => {
  const c = checkBuy({ category: "bottoms", price: 5000, embedding: null, owned: closet, low30: 4000 });
  assert.equal(c.verdict, "wait");
  assert.match(c.reason, /\$40/);
  assert.equal(checkBuy({ category: "bottoms", price: 4100, embedding: null, owned: closet, low30: 4000 }).verdict, "buy");
});
