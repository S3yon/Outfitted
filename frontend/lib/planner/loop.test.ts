import { test } from "node:test";
import assert from "node:assert/strict";
import { planWeek, type Message } from "./loop.ts";
import type { Completion } from "./stream.ts";
import type { PlannerEvent } from "./stream.ts";
import { weekDates } from "./week.ts";

const weekStart = "2026-10-19";
const dates = weekDates(weekStart);
const weather = dates.map((date, i) => ({ date, high: 10 + i, low: 4, rainChance: 0, wind: 5, words: "Clear", warmth: "cool" as const }));
const week = dates.map((date) => ({ date, events: [], chip: null }));
const closet = [
  { id: "tee", category: "tops", notes: "", wears: 1, daysIdle: 5, lastWorn: null },
  { id: "jeans", category: "bottoms", notes: "", wears: 0, daysIdle: 80, lastWorn: null },
  { id: "coat", category: "outerwear", notes: "", wears: 0, daysIdle: 70, lastWorn: null },
];

function call(id: string, name: string, args: unknown) {
  return { id, name, arguments: typeof args === "string" ? args : JSON.stringify(args) };
}

// A fake model that plays back scripted replies and records what it was sent.
function script(replies: (Completion | Error)[]) {
  const seen: Message[][] = [];
  const complete = async (messages: Message[]) => {
    seen.push(structuredClone(messages));
    const reply = replies.shift() ?? { content: "done", toolCalls: [] };
    if (reply instanceof Error) throw reply;
    return reply;
  };
  return { complete, seen };
}

function run(replies: (Completion | Error)[], maxSteps?: number) {
  const events: PlannerEvent[] = [];
  const fake = script(replies);
  const counts = { weather: 0, week: 0, closet: 0 };
  const load = {
    weather: async () => (counts.weather++, weather),
    week: async () => (counts.week++, week),
    closet: async () => (counts.closet++, closet),
  };
  const plan = planWeek({ weekStart, complete: fake.complete, load, emit: (e) => events.push(e), maxSteps });
  return { plan, events, seen: fake.seen, counts };
}

test("planWeek runs tools, streams events and returns 7 days", async () => {
  const { plan, events, seen, counts } = run([
    { content: "", toolCalls: [call("a", "get_weather", {}), call("b", "get_closet", "")] },
    { content: "", toolCalls: [call("c", "propose_day", { date: dates[0], itemIds: ["tee", "jeans", "coat"], note: "Cool, coat" })] },
    { content: "That's Monday.", toolCalls: [] },
  ]);
  const result = await plan;

  assert.equal(result.weekStart, weekStart);
  assert.equal(result.days.length, 7);
  assert.deepEqual(result.days[0], {
    date: dates[0],
    weather: weather[0],
    events: [],
    chip: null,
    itemIds: ["tee", "jeans", "coat"],
    note: "Cool, coat",
    filled: false,
  });
  assert.equal(result.days[1].filled, true);
  assert.equal(result.days[1].note, "Filled from idle items");

  assert.deepEqual(
    events.filter((e) => e.type !== "day").map((e) => `${e.type}:${"name" in e ? e.name : ""}`),
    ["tool:get_weather", "result:get_weather", "tool:get_closet", "result:get_closet", "tool:propose_day", "result:propose_day"],
  );
  assert.equal(events.filter((e) => e.type === "day").length, 7);
  assert.deepEqual(events[1], { type: "result", name: "get_weather", summary: "7 days, 4°-16°, no rain" });

  // The tool results went back to the model with their call ids.
  const toolMessages = seen[1].filter((m) => m.role === "tool");
  assert.deepEqual(toolMessages.map((m) => m.tool_call_id), ["a", "b"]);
  assert.deepEqual(JSON.parse(toolMessages[1].content), closet);
  // Each source is fetched once even though fill-in needs it again.
  assert.deepEqual(counts, { weather: 1, week: 1, closet: 1 });
});

test("planWeek returns a rejected day's error to the model", async () => {
  const { plan, events, seen } = run([
    { content: "", toolCalls: [call("a", "propose_day", { date: dates[2], itemIds: ["tee"] })] },
    { content: "", toolCalls: [call("b", "propose_day", { date: dates[2], itemIds: ["tee", "jeans"] })] },
  ]);
  const result = await plan;
  assert.deepEqual(seen[1].at(-1), { role: "tool", tool_call_id: "a", content: "Error: needs one item from bottoms" });
  assert.deepEqual(events[1], { type: "result", name: "propose_day", summary: "Rejected: needs one item from bottoms" });
  assert.equal(result.days[2].filled, false);
  assert.deepEqual(result.days[2].itemIds, ["tee", "jeans"]);
});

test("planWeek nudges once when the model stops with days left", async () => {
  const { plan, seen } = run([{ content: "Here is your week!", toolCalls: [] }]);
  await plan;
  assert.equal(seen.length, 2);
  assert.match(seen[1].at(-1)!.content, /propose_day/);
});

test("planWeek stops at the step cap and fills the rest", async () => {
  const replies = Array.from({ length: 20 }, (_, i) => ({ content: "", toolCalls: [call(`w${i}`, "get_weather", {})] }));
  const { plan, seen } = run(replies, 3);
  const result = await plan;
  assert.equal(seen.length, 3);
  assert.equal(result.days.every((d) => d.filled), true);
});

test("planWeek ends once all 7 days are proposed", async () => {
  const { plan, seen } = run([
    { content: "", toolCalls: dates.map((d, i) => call(`p${i}`, "propose_day", { date: d, itemIds: ["tee", "jeans"] })) },
  ]);
  const result = await plan;
  assert.equal(seen.length, 1);
  assert.equal(result.days.some((d) => d.filled), false);
});

test("planWeek answers an unknown tool with an error", async () => {
  const { plan, seen } = run([{ content: "", toolCalls: [call("x", "buy_shoes", {})] }]);
  await plan;
  assert.deepEqual(seen[1].at(-1), { role: "tool", tool_call_id: "x", content: "Error: unknown tool buy_shoes" });
});

test("planWeek throws when the model fails before any day, fills when it fails later", async () => {
  await assert.rejects(run([new Error("429")]).plan, /429/);

  const later = await run([
    { content: "", toolCalls: [call("a", "propose_day", { date: dates[0], itemIds: ["tee", "jeans"] })] },
    new Error("429"),
  ]).plan;
  assert.equal(later.days[0].filled, false);
  assert.equal(later.days[1].filled, true);
});
