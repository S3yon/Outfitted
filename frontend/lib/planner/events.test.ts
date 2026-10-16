import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWeek, calendarUrl, parseChips, weekSummary } from "./events.ts";
import { weekDates } from "./week.ts";

const dates = weekDates("2026-10-19");

const google = {
  items: [
    { summary: "Standup", start: { dateTime: "2026-10-19T09:30:00-04:00" }, end: { dateTime: "2026-10-19T09:45:00-04:00" } },
    { summary: "Dinner with Sam", start: { dateTime: "2026-10-21T19:00:00-04:00" }, end: { dateTime: "2026-10-21T21:00:00-04:00" } },
    { summary: "Cottage", start: { date: "2026-10-24" }, end: { date: "2026-10-27" } },
    { summary: "Last week", start: { dateTime: "2026-10-18T10:00:00-04:00" }, end: { dateTime: "2026-10-18T11:00:00-04:00" } },
    { start: { dateTime: "2026-10-20T08:00:00-04:00" } },
    { summary: "Cancelled thing", status: "cancelled", start: { dateTime: "2026-10-20T12:00:00-04:00" } },
  ],
};

test("calendarUrl asks for single events across the week with a day of margin", () => {
  const url = new URL(calendarUrl("2026-10-19"));
  assert.equal(url.origin + url.pathname, "https://www.googleapis.com/calendar/v3/calendars/primary/events");
  assert.equal(url.searchParams.get("singleEvents"), "true");
  assert.equal(url.searchParams.get("orderBy"), "startTime");
  assert.equal(url.searchParams.get("timeMin"), "2026-10-18T00:00:00Z");
  assert.equal(url.searchParams.get("timeMax"), "2026-10-27T00:00:00Z");
});

test("buildWeek puts timed events on their local date with a start time", () => {
  const week = buildWeek(dates, google, {});
  assert.equal(week.length, 7);
  assert.deepEqual(week[0], { date: "2026-10-19", events: [{ title: "Standup", time: "09:30" }], chip: null });
  assert.deepEqual(week[2].events, [{ title: "Dinner with Sam", time: "19:00" }]);
});

test("buildWeek spreads all-day events over every day they cover, end exclusive", () => {
  const week = buildWeek(dates, google, {});
  assert.deepEqual(week[5].events, [{ title: "Cottage", time: "all day" }]);
  assert.deepEqual(week[6].events, [{ title: "Cottage", time: "all day" }]);
  assert.deepEqual(week[4].events, []);
});

test("buildWeek drops untitled, cancelled and out-of-week events", () => {
  const week = buildWeek(dates, google, {});
  assert.deepEqual(week[1].events, []);
});

test("buildWeek works with chips only and keeps them per day", () => {
  const week = buildWeek(dates, null, { "2026-10-20": "Gym", "2026-10-24": "Travel" });
  assert.equal(week[1].chip, "Gym");
  assert.equal(week[5].chip, "Travel");
  assert.equal(week[0].chip, null);
  assert.deepEqual(week[0].events, []);
});

test("parseChips keeps known chips on dates inside the week", () => {
  assert.deepEqual(
    parseChips({ "2026-10-20": "Gym", "2026-10-21": "Rave", "2026-11-30": "Work", "2026-10-22": "Work" }, dates),
    { "2026-10-20": "Gym", "2026-10-22": "Work" },
  );
  assert.deepEqual(parseChips(null, dates), {});
  assert.deepEqual(parseChips(["Gym"], dates), {});
});

test("weekSummary counts events and chips", () => {
  assert.equal(weekSummary(buildWeek(dates, google, { "2026-10-20": "Gym" })), "4 events, 1 day set by hand");
  assert.equal(weekSummary(buildWeek(dates, null, {})), "No events");
});
