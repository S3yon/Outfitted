import { test } from "node:test";
import assert from "node:assert/strict";
import { ownedForCheck } from "./owned.ts";

test("ownedForCheck counts wears and days owned per item", () => {
  const items = [
    { id: "a", category: "tops", notes: "White tee", createdAt: "2026-07-19 10:00:00", embedding: null },
    { id: "b", category: "shoes", notes: null, createdAt: "2026-10-17 08:00:00", embedding: "not json" },
  ];
  const logs = [
    { itemId: "a", wornOn: "2026-10-01" },
    { itemId: "a", wornOn: "2026-10-08" },
    { itemId: "x", wornOn: "2026-10-08" }, // not an owned item
  ];
  assert.deepEqual(ownedForCheck(items, logs, "2026-10-17"), [
    { id: "a", category: "tops", notes: "White tee", wears: 2, daysOwned: 90, embedding: null },
    { id: "b", category: "shoes", notes: null, wears: 0, daysOwned: 0, embedding: null },
  ]);
});
