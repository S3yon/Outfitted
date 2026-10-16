import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLogInput, MAX_ENTRIES } from "./log-input.ts";

const TODAY = "2026-10-16";

test("accepts entries and dedupes item + day", () => {
  const r = parseLogInput(
    {
      entries: [
        { itemId: "a", wornOn: "2026-10-15", source: "photo" },
        { itemId: "a", wornOn: "2026-10-15", source: "manual" },
        { itemId: "b", wornOn: "2026-10-16", source: "manual" },
      ],
    },
    TODAY,
  );
  assert.ok(r.ok);
  assert.deepEqual(r.value, [
    { itemId: "a", wornOn: "2026-10-15", source: "photo" },
    { itemId: "b", wornOn: "2026-10-16", source: "manual" },
  ]);
});

test("rejects bad bodies", () => {
  assert.equal(parseLogInput(null, TODAY).ok, false);
  assert.equal(parseLogInput({ entries: [] }, TODAY).ok, false);
  assert.equal(parseLogInput({ entries: "x" }, TODAY).ok, false);
});

test("rejects bad dates, future dates and unknown sources", () => {
  const one = (e: object) => parseLogInput({ entries: [{ itemId: "a", source: "photo", ...e }] }, TODAY).ok;
  assert.equal(one({ wornOn: "2026-13-01" }), false);
  assert.equal(one({ wornOn: "16/10/2026" }), false);
  assert.equal(one({ wornOn: "2026-10-17" }), false);
  assert.equal(one({ wornOn: "2026-10-16", source: "magic" }), false);
  assert.equal(one({ wornOn: "2026-10-16", itemId: "" }), false);
});

test("caps the number of entries", () => {
  const entries = Array.from({ length: MAX_ENTRIES + 1 }, (_, i) => ({
    itemId: `i${i}`,
    wornOn: TODAY,
    source: "photo",
  }));
  assert.equal(parseLogInput({ entries }, TODAY).ok, false);
});
