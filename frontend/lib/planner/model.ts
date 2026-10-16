import { TOOLS, type Message } from "./loop.ts";
import { createAccumulator, sseData, type Completion } from "./stream.ts";

// Any OpenAI-compatible endpoint: OpenRouter's free model by default, or a local server
// (Ollama, LM Studio) through PLANNER_BASE_URL.
const BASE_URL = process.env.PLANNER_BASE_URL || "https://openrouter.ai/api/v1";
export const PLANNER_MODEL = process.env.PLANNER_MODEL || "google/gemma-4-31b-it:free";

// The free model's daily or per-minute limit. No paid fallback: the user is told to wait.
export class PlannerLimitError extends Error {
  constructor() {
    super("Free planning limit reached, try again tomorrow");
  }
}

// One streamed chat completion with the planner's tools; returns the merged reply.
export async function complete(messages: Message[]): Promise<Completion> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const key = process.env.OPENROUTER_API_KEY;
  if (key) headers.Authorization = `Bearer ${key}`;

  const res = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify({ model: PLANNER_MODEL, messages, tools: TOOLS, stream: true }),
  });
  if (res.status === 429) throw new PlannerLimitError();
  if (!res.ok || !res.body) throw new Error(`Planner model error ${res.status}`);

  const acc = createAccumulator();
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const parsed = sseData(buffer + value);
    buffer = parsed.rest;
    for (const payload of parsed.payloads) {
      // OpenRouter reports mid-stream failures (including rate limits) as an error payload.
      const error = (payload as { error?: { code?: number } }).error;
      if (error) throw error.code === 429 ? new PlannerLimitError() : new Error("Planner model error");
      acc.add(payload);
    }
    if (parsed.done) break;
  }
  return acc.result();
}
