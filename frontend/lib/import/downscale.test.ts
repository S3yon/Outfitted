import { test } from "node:test";
import assert from "node:assert/strict";
import { fitWithin } from "./downscale.ts";

test("shrinks the long edge to the limit and keeps the ratio", () => {
  assert.deepEqual(fitWithin(4032, 3024, 1280), { width: 1280, height: 960 });
  assert.deepEqual(fitWithin(3024, 4032, 1280), { width: 960, height: 1280 });
});

test("leaves small photos alone", () => {
  assert.deepEqual(fitWithin(800, 600, 1280), { width: 800, height: 600 });
});
