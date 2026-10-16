import { test } from "node:test";
import assert from "node:assert/strict";
import { createAccumulator, decodeLines, encodeEvent, sseData } from "./stream.ts";

test("sseData reads data lines and stops at [DONE]", () => {
  const { payloads, rest, done } = sseData('data: {"a":1}\n\n: keep-alive\ndata: {"b":2}\n\ndata: {"c"');
  assert.deepEqual(payloads, [{ a: 1 }, { b: 2 }]);
  assert.equal(rest, 'data: {"c"');
  assert.equal(done, false);
  assert.equal(sseData("data: [DONE]\n\n").done, true);
});

test("sseData skips a line that is not JSON", () => {
  assert.deepEqual(sseData("data: oops\n").payloads, []);
});

test("the accumulator merges content and tool call pieces by index", () => {
  const acc = createAccumulator();
  acc.add({ choices: [{ delta: { content: "Looking " } }] });
  acc.add({ choices: [{ delta: { content: "now", tool_calls: [{ index: 0, id: "c1", function: { name: "get_weather", arguments: "" } }] } }] });
  acc.add({ choices: [{ delta: { tool_calls: [{ index: 1, id: "c2", function: { name: "propose_day", arguments: '{"date":' } }] } }] });
  acc.add({ choices: [{ delta: { tool_calls: [{ index: 1, function: { arguments: '"2026-10-19"}' } }] } }] });
  acc.add({ choices: [{ delta: {}, finish_reason: "tool_calls" }] });
  assert.deepEqual(acc.result(), {
    content: "Looking now",
    toolCalls: [
      { id: "c1", name: "get_weather", arguments: "" },
      { id: "c2", name: "propose_day", arguments: '{"date":"2026-10-19"}' },
    ],
  });
});

test("the accumulator gives ids to calls that came without one", () => {
  const acc = createAccumulator();
  acc.add({ choices: [{ delta: { tool_calls: [{ index: 0, function: { name: "get_week" } }] } }] });
  acc.add({ choices: [] });
  acc.add(null);
  assert.deepEqual(acc.result().toolCalls, [{ id: "call_0", name: "get_week", arguments: "" }]);
});

test("NDJSON events round-trip across split chunks", () => {
  const text = encodeEvent({ type: "tool", name: "get_weather", args: {} }) + encodeEvent({ type: "error", message: "x" });
  const first = decodeLines(text.slice(0, 20));
  assert.deepEqual(first.events, []);
  const second = decodeLines(first.rest + text.slice(20));
  assert.deepEqual(second.events, [
    { type: "tool", name: "get_weather", args: {} },
    { type: "error", message: "x" },
  ]);
  assert.equal(second.rest, "");
});
