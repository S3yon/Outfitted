import { test } from "node:test";
import assert from "node:assert/strict";
import { stepSeries } from "./series.ts";

test("stepSeries turns points into ascending unix seconds and carries the price to now", () => {
  const points = [
    { price: 5000, checkedAt: "2026-10-01T00:00:00.000Z" },
    { price: 4500, checkedAt: "2026-10-01T00:00:00.400Z" }, // same second: the later one wins
    { price: 4000, checkedAt: "2026-10-10T00:00:00.000Z" },
  ];
  assert.deepEqual(stepSeries(points, "2026-10-17T00:00:00.000Z"), [
    { time: 1790812800, value: 45 },
    { time: 1791590400, value: 40 },
    { time: 1792195200, value: 40 },
  ]);
  assert.deepEqual(stepSeries([], "2026-10-17T00:00:00.000Z"), []);
});
