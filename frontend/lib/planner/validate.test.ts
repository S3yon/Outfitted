import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDay } from "./validate.ts";
import { weekDates } from "./week.ts";

const closet = [
  { id: "tee", category: "tops" },
  { id: "shirt", category: "tops" },
  { id: "jeans", category: "bottoms" },
  { id: "boots", category: "shoes" },
  { id: "coat", category: "outerwear" },
  { id: "cap", category: "accessories" },
  { id: "watch", category: "accessories" },
];
const ctx = { dates: weekDates("2026-10-19"), closet };

test("checkDay takes a full outfit inside the week", () => {
  assert.deepEqual(checkDay({ date: "2026-10-20", itemIds: ["tee", "jeans", "boots", "cap", "watch"], note: " Rain, boots " }, ctx), {
    ok: true,
    value: { date: "2026-10-20", itemIds: ["tee", "jeans", "boots", "cap", "watch"], note: "Rain, boots" },
  });
});

test("checkDay reads arguments sent as a JSON string", () => {
  const r = checkDay(JSON.stringify({ date: "2026-10-19", itemIds: ["tee", "jeans"] }), ctx);
  assert.equal(r.ok, true);
  assert.equal(r.ok && r.value.note, "");
});

test("checkDay refuses dates outside the week", () => {
  assert.deepEqual(checkDay({ date: "2026-10-26", itemIds: ["tee", "jeans"] }, ctx), {
    ok: false,
    error: "date must be one of 2026-10-19, 2026-10-20, 2026-10-21, 2026-10-22, 2026-10-23, 2026-10-24, 2026-10-25",
  });
});

test("checkDay refuses items not in the closet, naming them", () => {
  assert.deepEqual(checkDay({ date: "2026-10-19", itemIds: ["tee", "jeans", "ghost"] }, ctx), {
    ok: false,
    error: "not in the closet: ghost",
  });
});

test("checkDay allows one item per category except accessories", () => {
  assert.deepEqual(checkDay({ date: "2026-10-19", itemIds: ["tee", "shirt", "jeans"] }, ctx), {
    ok: false,
    error: "more than one item in tops",
  });
});

test("checkDay needs a top and a bottom when the closet has them", () => {
  assert.deepEqual(checkDay({ date: "2026-10-19", itemIds: ["tee", "boots"] }, ctx), {
    ok: false,
    error: "needs one item from bottoms",
  });
  const noBottoms = { dates: ctx.dates, closet: closet.filter((c) => c.category !== "bottoms") };
  assert.equal(checkDay({ date: "2026-10-19", itemIds: ["tee"] }, noBottoms).ok, true);
});

test("checkDay refuses broken shapes", () => {
  assert.equal(checkDay(null, ctx).ok, false);
  assert.equal(checkDay("{not json", ctx).ok, false);
  assert.equal(checkDay({ date: "2026-10-19", itemIds: "tee" }, ctx).ok, false);
  assert.equal(checkDay({ date: "2026-10-19", itemIds: [] }, ctx).ok, false);
  assert.equal(checkDay({ date: "2026-10-19", itemIds: ["tee", "tee", "jeans"] }, ctx).ok, true);
});

test("checkDay cuts a long note", () => {
  const r = checkDay({ date: "2026-10-19", itemIds: ["tee", "jeans"], note: "a".repeat(500) }, ctx);
  assert.equal(r.ok && r.value.note.length, 200);
});
