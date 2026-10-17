import { test } from "node:test";
import assert from "node:assert/strict";
import { isStale, shouldStore, summary, droppedSince } from "./history.ts";

const now = "2026-10-17T12:00:00.000Z";
const p = (price: number, checkedAt: string) => ({ price, checkedAt });

test("isStale is true when never checked or older than the window", () => {
  assert.equal(isStale(null, now, 12), true);
  assert.equal(isStale("2026-10-16T23:59:00.000Z", now, 12), true);
  assert.equal(isStale("2026-10-17T01:00:00.000Z", now, 12), false);
});

test("shouldStore only when the price is new or changed", () => {
  assert.equal(shouldStore(null, 4500), true);
  assert.equal(shouldStore(4500, 4500), false);
  assert.equal(shouldStore(4500, 3900), true);
  assert.equal(shouldStore(4500, null), false);
});

test("summary gives current, change, lows and whether it just dropped", () => {
  const points = [
    p(6000, "2026-06-01T00:00:00.000Z"), // still the price when the 90-day window opened
    p(8000, "2026-08-01T00:00:00.000Z"),
    p(7000, "2026-10-01T00:00:00.000Z"),
    p(7500, "2026-10-10T00:00:00.000Z"),
    p(7200, "2026-10-16T00:00:00.000Z"),
  ];
  assert.deepEqual(summary(points, now), {
    current: 7200,
    first: 6000,
    changePct: 20,
    allTimeLow: 6000,
    low30: 7000,
    low90: 6000,
    high30: 8000, // 8000 was in force when the 30-day window opened
    dropped: true,
  });
});

test("summary carries the price in force at the start of the window", () => {
  // 7000 was set before the 30-day window and was still the price inside it.
  const points = [p(7000, "2026-09-01T00:00:00.000Z"), p(9000, "2026-10-10T00:00:00.000Z")];
  const s = summary(points, now);
  assert.equal(s?.low30, 7000);
  assert.equal(s?.dropped, false);
  assert.equal(summary([], now), null);
});

test("droppedSince is true when a drop landed after the last look", () => {
  const points = [p(8000, "2026-10-01T00:00:00.000Z"), p(7000, "2026-10-15T00:00:00.000Z")];
  assert.equal(droppedSince(points, null), true);
  assert.equal(droppedSince(points, "2026-10-14T00:00:00.000Z"), true);
  assert.equal(droppedSince(points, "2026-10-16T00:00:00.000Z"), false);
  assert.equal(droppedSince([p(7000, "2026-10-01T00:00:00.000Z"), p(8000, "2026-10-15T00:00:00.000Z")], null), false);
});
