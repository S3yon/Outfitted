import { test } from "node:test";
import assert from "node:assert/strict";
import { daysBetween, wearStats, type StatItem } from "./stats.ts";

const TODAY = "2026-10-16";

function item(id: string, over: Partial<StatItem> = {}): StatItem {
  return { id, status: "owned", price: "$100", createdAt: "2026-01-01 10:00:00", ...over };
}

test("daysBetween counts whole days between dates", () => {
  assert.equal(daysBetween("2026-10-01", "2026-10-16"), 15);
  assert.equal(daysBetween("2026-02-28", "2026-03-01"), 1);
});

test("counts wears, last worn date and cost per wear", () => {
  const { items } = wearStats(
    [item("a")],
    [
      { itemId: "a", wornOn: "2026-10-01" },
      { itemId: "a", wornOn: "2026-10-10" },
      { itemId: "a", wornOn: "2026-09-01" },
      { itemId: "a", wornOn: "2026-10-03" },
    ],
    TODAY,
  );
  assert.equal(items[0].wears, 4);
  assert.equal(items[0].lastWorn, "2026-10-10");
  assert.equal(items[0].daysIdle, 6);
  assert.equal(items[0].costPerWear, 2500);
});

test("an unworn item costs its full price and idles since it was added", () => {
  const { items } = wearStats([item("a", { createdAt: "2026-08-01 09:00:00" })], [], TODAY);
  assert.equal(items[0].wears, 0);
  assert.equal(items[0].lastWorn, null);
  assert.equal(items[0].costPerWear, 10000);
  assert.equal(items[0].daysIdle, 76);
  assert.equal(items[0].idle, true);
});

test("no price means no cost per wear", () => {
  const { items } = wearStats([item("a", { price: null })], [{ itemId: "a", wornOn: TODAY }], TODAY);
  assert.equal(items[0].price, null);
  assert.equal(items[0].costPerWear, null);
});

test("idle means owned and not worn for 60 days or more", () => {
  const { items } = wearStats(
    [item("a"), item("b"), item("c", { status: "wishlisted" })],
    [
      { itemId: "a", wornOn: "2026-08-17" },
      { itemId: "b", wornOn: "2026-08-18" },
    ],
    TODAY,
  );
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  assert.equal(byId.a.idle, true);
  assert.equal(byId.b.idle, false);
  assert.equal(byId.c, undefined);
});

test("logs for unknown items are ignored", () => {
  const { items } = wearStats([item("a")], [{ itemId: "zzz", wornOn: TODAY }], TODAY);
  assert.equal(items[0].wears, 0);
});

test("summary: wears in 30 days, average cost per wear, idle count", () => {
  const { summary } = wearStats(
    [item("a"), item("b", { price: "$30" }), item("c", { price: null })],
    [
      { itemId: "a", wornOn: "2026-10-16" },
      { itemId: "a", wornOn: "2026-09-16" },
      { itemId: "a", wornOn: "2026-09-15" },
      { itemId: "b", wornOn: "2026-10-01" },
      { itemId: "c", wornOn: "2026-10-02" },
    ],
    TODAY,
  );
  // 30 days back from 10-16 is 09-16 inclusive.
  assert.equal(summary.wears30, 4);
  // a: 10000/3 = 3333, b: 3000/1; mean of items with a price and at least one wear.
  assert.equal(summary.avgCostPerWear, Math.round((3333 + 3000) / 2));
  assert.equal(summary.idle, 0);
});

test("summary average is null with no priced, worn items", () => {
  const { summary } = wearStats([item("a", { price: null })], [], TODAY);
  assert.equal(summary.avgCostPerWear, null);
});
