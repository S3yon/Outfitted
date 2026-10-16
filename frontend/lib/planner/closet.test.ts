import { test } from "node:test";
import assert from "node:assert/strict";
import { closetForModel, closetSummary } from "./closet.ts";

const items = [
  { id: "tee", category: "tops", status: "owned", notes: "white tee", price: "$20", createdAt: "2026-01-01" },
  { id: "jeans", category: "bottoms", status: "owned", notes: null, price: null, createdAt: "2026-09-01" },
  { id: "coat", category: "outerwear", status: "owned", notes: "x".repeat(200), price: null, createdAt: "2026-10-10" },
  { id: "bag", category: "accessories", status: "wishlisted", notes: "tote", price: null, createdAt: "2026-01-01" },
];
const logs = [
  { itemId: "tee", wornOn: "2026-10-14" },
  { itemId: "tee", wornOn: "2026-10-01" },
  { itemId: "jeans", wornOn: "2026-08-01" }, // before it was added: still counts as worn
];

test("closetForModel keeps owned items, idle first, with wear stats", () => {
  const closet = closetForModel(items, logs, "2026-10-16");
  assert.deepEqual(
    closet.map((c) => c.id),
    ["jeans", "coat", "tee"],
  );
  assert.deepEqual(closet[2], {
    id: "tee",
    category: "tops",
    notes: "white tee",
    wears: 2,
    daysIdle: 2,
    lastWorn: "2026-10-14",
  });
  assert.equal(closet[0].daysIdle, 76);
});

test("closetForModel trims long notes and blanks missing ones", () => {
  const closet = closetForModel(items, logs, "2026-10-16");
  const coat = closet.find((c) => c.id === "coat")!;
  assert.equal(coat.notes.length, 80);
  assert.equal(closet.find((c) => c.id === "jeans")!.notes, "");
  assert.equal(coat.lastWorn, null);
});

test("closetSummary counts items and idle ones", () => {
  const closet = closetForModel(items, logs, "2026-10-16");
  assert.equal(closetSummary(closet), "3 items, 1 idle 60+ days");
  assert.equal(closetSummary([]), "Closet is empty");
});
