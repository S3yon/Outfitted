import { test } from "node:test";
import assert from "node:assert/strict";
import { localDay, wearEntries, recentWears, rankByCostPerWear } from "./review.ts";

test("localDay is the calendar day in local time", () => {
  assert.equal(localDay(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
  assert.equal(localDay(new Date(2026, 9, 16, 0, 1)), "2026-10-16");
});

test("wearEntries turns review rows into one entry per item and day", () => {
  const entries = wearEntries([
    { date: "2026-10-10", itemIds: ["a", "b"] },
    { date: "2026-10-10", itemIds: ["a"] },
    { date: "2026-10-11", itemIds: ["a"] },
    { date: "", itemIds: ["c"] },
  ]);
  assert.deepEqual(entries, [
    { itemId: "a", wornOn: "2026-10-10", source: "photo" },
    { itemId: "b", wornOn: "2026-10-10", source: "photo" },
    { itemId: "a", wornOn: "2026-10-11", source: "photo" },
  ]);
});

test("recentWears groups the last N days, newest first", () => {
  const days = recentWears(
    [
      { itemId: "a", wornOn: "2026-10-16" },
      { itemId: "b", wornOn: "2026-10-16" },
      { itemId: "a", wornOn: "2026-10-03" },
      { itemId: "c", wornOn: "2026-10-02" },
      { itemId: "c", wornOn: "2026-10-17" },
    ],
    "2026-10-16",
    14,
  );
  assert.deepEqual(days, [
    { day: "2026-10-16", itemIds: ["a", "b"] },
    { day: "2026-10-03", itemIds: ["a"] },
  ]);
});

test("rankByCostPerWear puts the worst value first and unpriced items last", () => {
  const ranked = rankByCostPerWear([
    { id: "cheap", costPerWear: 500 },
    { id: "none", costPerWear: null },
    { id: "dear", costPerWear: 9000 },
    { id: "mid", costPerWear: 2000 },
  ]);
  assert.deepEqual(ranked.map((i) => i.id), ["dear", "mid", "cheap", "none"]);
});
