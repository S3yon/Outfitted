import type { PlanDay, WeekPlan } from "./plan.ts";

// ─── Model side: OpenAI-style server-sent events ─────────────────────────────

export type ToolCall = { id: string; name: string; arguments: string };
export type Completion = { content: string; toolCalls: ToolCall[] };

// Split a buffer into the JSON payloads of complete `data:` lines. `rest` is the unfinished tail.
export function sseData(buffer: string): { payloads: unknown[]; rest: string; done: boolean } {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  const payloads: unknown[] = [];
  for (const line of lines) {
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trim();
    if (data === "[DONE]") return { payloads, rest: "", done: true };
    try {
      payloads.push(JSON.parse(data));
    } catch {
      // A malformed line is skipped rather than ending the plan.
    }
  }
  return { payloads, rest, done: false };
}

type ToolCallDelta = { index?: number; id?: string; function?: { name?: string; arguments?: string } };
type Chunk = { choices?: { delta?: { content?: string; tool_calls?: ToolCallDelta[] } }[] };

// Stream chunks carry a tool call in pieces keyed by index: the id and name first, then the
// arguments a few characters at a time.
export function createAccumulator() {
  let content = "";
  const calls: { id?: string; name: string; arguments: string }[] = [];

  return {
    add(chunk: unknown) {
      const delta = (chunk as Chunk | null)?.choices?.[0]?.delta;
      if (!delta) return;
      if (typeof delta.content === "string") content += delta.content;
      for (const piece of delta.tool_calls ?? []) {
        const i = piece.index ?? 0;
        const call = (calls[i] ??= { name: "", arguments: "" });
        if (piece.id) call.id = piece.id;
        if (piece.function?.name) call.name += piece.function.name;
        if (piece.function?.arguments) call.arguments += piece.function.arguments;
      }
    },
    result(): Completion {
      const toolCalls = calls
        .map((c, i) => ({ id: c.id ?? `call_${i}`, name: c.name, arguments: c.arguments }))
        .filter((c) => c.name);
      return { content, toolCalls };
    },
  };
}

// ─── Browser side: NDJSON events from POST /api/planner ──────────────────────

export type PlannerEvent =
  | { type: "tool"; name: string; args: unknown }
  | { type: "result"; name: string; summary: string }
  | { type: "day"; day: PlanDay }
  | { type: "done"; plan: WeekPlan }
  | { type: "error"; message: string };

export function encodeEvent(event: PlannerEvent): string {
  return JSON.stringify(event) + "\n";
}

export function decodeLines(buffer: string): { events: PlannerEvent[]; rest: string } {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  const events = lines.filter((l) => l.trim()).map((l) => JSON.parse(l) as PlannerEvent);
  return { events, rest };
}
