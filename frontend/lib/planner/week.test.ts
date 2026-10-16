import { test } from "node:test";
import assert from "node:assert/strict";
import { isWeekStart, mondayOf, weekDates, weekdayShort } from "./week.ts";

test("mondayOf finds the Monday on or before a date", () => {
  assert.equal(mondayOf("2026-10-19"), "2026-10-19"); // Monday
  assert.equal(mondayOf("2026-10-16"), "2026-10-12"); // Friday
  assert.equal(mondayOf("2026-10-18"), "2026-10-12"); // Sunday
  assert.equal(mondayOf("2026-11-01"), "2026-10-26"); // across a month
});

test("weekDates lists 7 days from the start", () => {
  assert.deepEqual(weekDates("2026-10-26"), [
    "2026-10-26",
    "2026-10-27",
    "2026-10-28",
    "2026-10-29",
    "2026-10-30",
    "2026-10-31",
    "2026-11-01",
  ]);
});

test("weekdayShort names the day", () => {
  assert.equal(weekdayShort("2026-10-22"), "Thu");
  assert.equal(weekdayShort("2026-10-25"), "Sun");
});

test("isWeekStart takes only a real Monday", () => {
  assert.equal(isWeekStart("2026-10-19"), true);
  assert.equal(isWeekStart("2026-10-20"), false);
  assert.equal(isWeekStart("2026-02-30"), false);
  assert.equal(isWeekStart("monday"), false);
  assert.equal(isWeekStart(undefined), false);
});
