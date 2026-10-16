import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePrice, formatCents } from "./price.ts";

test("parsePrice reads shop prices into cents", () => {
  assert.equal(parsePrice("$49.99"), 4999);
  assert.equal(parsePrice("$1,299.00"), 129900);
  assert.equal(parsePrice("CA$45"), 4500);
  assert.equal(parsePrice("12.5"), 1250);
  assert.equal(parsePrice(" 80 "), 8000);
});

test("parsePrice takes the first number of a range", () => {
  assert.equal(parsePrice("$20 - $30"), 2000);
});

test("parsePrice gives null when there is no price", () => {
  assert.equal(parsePrice(null), null);
  assert.equal(parsePrice(""), null);
  assert.equal(parsePrice("free shipping"), null);
  assert.equal(parsePrice("$0"), null);
});

test("formatCents drops .00 and keeps real cents", () => {
  assert.equal(formatCents(4500), "$45");
  assert.equal(formatCents(1250), "$12.50");
  assert.equal(formatCents(129900), "$1,299");
  assert.equal(formatCents(333), "$3.33");
});
