import { test } from "node:test";
import assert from "node:assert/strict";
import { matchPhoto, type Crop, type ClosetItem } from "./match.ts";

const closet: ClosetItem[] = [
  { id: "tee", category: "tops", embedding: [1, 0, 0] },
  { id: "shirt", category: "tops", embedding: [0.8, 0.6, 0] },
  { id: "jeans", category: "bottoms", embedding: [0, 1, 0] },
  { id: "old", category: "shoes", embedding: null },
];

function crop(id: string, category: string, embedding?: number[]): Crop {
  return { id, category, embedding };
}

test("matches a crop to the closest item in its category", () => {
  const result = matchPhoto([crop("c1", "tops", [0.99, 0.05, 0])], closet, 0.85);
  assert.equal(result[0].itemId, "tee");
  assert.ok(result[0].score > 0.99);
});

test("no match under the threshold or across categories", () => {
  const result = matchPhoto(
    [crop("c1", "tops", [0, 0, 1]), crop("c2", "bottoms", [1, 0, 0])],
    closet,
    0.85,
  );
  assert.deepEqual(result.map((r) => r.itemId), [null, null]);
});

test("crops without an embedding and items without one never match", () => {
  const result = matchPhoto([crop("c1", "tops"), crop("c2", "shoes", [1, 0, 0])], closet, 0.85);
  assert.deepEqual(result.map((r) => r.itemId), [null, null]);
});

test("one item per photo: the better crop keeps it", () => {
  const result = matchPhoto(
    [crop("weak", "tops", [0.95, 0.3, 0]), crop("strong", "tops", [1, 0.01, 0])],
    [closet[0]],
    0.85,
  );
  const byId = Object.fromEntries(result.map((r) => [r.cropId, r.itemId]));
  assert.equal(byId.strong, "tee");
  assert.equal(byId.weak, null);
});

test("a crop that loses its item falls back to its next best match", () => {
  // Both crops are closest to "tee"; "a" is closer, so "b" takes "shirt".
  const result = matchPhoto(
    [crop("a", "tops", [1, 0, 0]), crop("b", "tops", [0.95, 0.3, 0])],
    closet,
    0.85,
  );
  const byId = Object.fromEntries(result.map((r) => [r.cropId, r.itemId]));
  assert.equal(byId.a, "tee");
  assert.equal(byId.b, "shirt");
});
