import { closetSummary, type ClosetEntry } from "./closet.ts";
import { weekSummary, type WeekDay } from "./events.ts";
import { pickOutfit } from "./fallback.ts";
import type { PlanDay, WeekPlan } from "./plan.ts";
import type { Completion, PlannerEvent } from "./stream.ts";
import { checkDay, type ProposedDay } from "./validate.ts";
import { weatherSummary, type DayWeather } from "./weather.ts";
import { weekDates, weekdayShort } from "./week.ts";

export type Message = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
};

export type Complete = (messages: Message[]) => Promise<Completion>;

// Where each tool's data comes from. The route fetches; tests pass fixtures.
export type Loaders = {
  weather: () => Promise<DayWeather[]>;
  week: () => Promise<WeekDay[]>;
  closet: () => Promise<ClosetEntry[]>;
};

export const MAX_STEPS = 12;
const FILLED_NOTE = "Filled from idle items";

const noArgs = { type: "object", properties: {} };

// OpenAI-style tool definitions sent with every model call.
export const TOOLS = [
  {
    type: "function",
    function: {
      name: "get_weather",
      description: "Daily forecast for the 7 days: high and low in °C, rain chance %, wind, warmth band.",
      parameters: noArgs,
    },
  },
  {
    type: "function",
    function: {
      name: "get_week",
      description:
        "The user's calendar for the 7 days: event titles and start times, plus a chip (Work, Gym, Dinner, Casual, Event, Travel) when the user set one. A chip overrides the events for its day.",
      parameters: noArgs,
    },
  },
  {
    type: "function",
    function: {
      name: "get_closet",
      description:
        "Owned clothing items: id, category, notes, times worn, days since last worn. Longest idle first.",
      parameters: noArgs,
    },
  },
  {
    type: "function",
    function: {
      name: "propose_day",
      description:
        "Save the outfit for one date. One item per category (any number of accessories), and a top and a bottom. Call once per date; calling again replaces that date.",
      parameters: {
        type: "object",
        properties: {
          date: { type: "string", description: "YYYY-MM-DD, one of the 7 dates" },
          itemIds: { type: "array", items: { type: "string" }, description: "Item ids from get_closet" },
          note: { type: "string", description: "One short sentence: why this outfit for this day" },
        },
        required: ["date", "itemIds", "note"],
      },
    },
  },
];

function systemPrompt(dates: string[]): string {
  const days = dates.map((d) => `${weekdayShort(d)} ${d}`).join(", ");
  return `You plan a week of outfits from the user's own closet.
The week: ${days}.
1. Call get_weather, get_week and get_closet.
2. Then call propose_day once for each of the 7 dates.
Dress for each day's weather and plans: layers when it's cold, nothing heavy when it's hot, smarter for work and dinners, sportswear for the gym.
Favour items that have been idle longest, and avoid repeating an item on back-to-back days.
Use only item ids from get_closet. If propose_day returns an error, fix the outfit and call it again.
Keep each note to one short sentence.`;
}

function once<T>(load: () => Promise<T>): () => Promise<T> {
  let promise: Promise<T> | null = null;
  return () => (promise ??= load());
}

function parseArgs(text: string): unknown {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return text;
  }
}

// Run the model with the four tools until it has proposed all 7 days, stops, fails or hits the
// step cap. Days it never proposed are filled from idle items, so the plan always has 7 days.
export async function planWeek(opts: {
  weekStart: string;
  complete: Complete;
  load: Loaders;
  emit: (event: PlannerEvent) => void;
  maxSteps?: number;
}): Promise<WeekPlan> {
  const { weekStart, complete, emit, maxSteps = MAX_STEPS } = opts;
  const dates = weekDates(weekStart);
  const load = {
    weather: once(() => opts.load.weather().catch(() => [] as DayWeather[])),
    week: once(() => opts.load.week()),
    closet: once(() => opts.load.closet()),
  };
  const proposed = new Map<string, ProposedDay>();

  async function toDay(p: ProposedDay, filled: boolean): Promise<PlanDay> {
    const weather = (await load.weather()).find((w) => w.date === p.date) ?? null;
    const day = (await load.week()).find((d) => d.date === p.date);
    return { ...p, weather, events: day?.events ?? [], chip: day?.chip ?? null, filled };
  }

  // Each handler returns what the model reads back and the one line the user sees.
  const handlers: Record<string, (args: unknown) => Promise<{ content: string; summary: string }>> = {
    get_weather: async () => {
      const days = await load.weather();
      return { content: JSON.stringify(days), summary: weatherSummary(days) };
    },
    get_week: async () => {
      const week = await load.week();
      return { content: JSON.stringify(week), summary: weekSummary(week) };
    },
    get_closet: async () => {
      const closet = await load.closet();
      return { content: JSON.stringify(closet), summary: closetSummary(closet) };
    },
    propose_day: async (args) => {
      const checked = checkDay(args, { dates, closet: await load.closet() });
      if (!checked.ok) return { content: `Error: ${checked.error}`, summary: `Rejected: ${checked.error}` };
      proposed.set(checked.value.date, checked.value);
      emit({ type: "day", day: await toDay(checked.value, false) });
      const n = checked.value.itemIds.length;
      return { content: "Saved.", summary: `${weekdayShort(checked.value.date)}: ${n} item${n === 1 ? "" : "s"}` };
    },
  };

  const messages: Message[] = [
    { role: "system", content: systemPrompt(dates) },
    { role: "user", content: `Plan my outfits for the week of ${weekStart}.` },
  ];
  let nudged = false;

  for (let step = 0; step < maxSteps && proposed.size < dates.length; step++) {
    let reply: Completion;
    try {
      reply = await complete(messages);
    } catch (err) {
      if (proposed.size === 0) throw err;
      break; // Keep what the model already planned; the rest is filled below.
    }

    if (reply.toolCalls.length === 0) {
      if (nudged) break;
      nudged = true;
      const left = dates.filter((d) => !proposed.has(d));
      messages.push({ role: "assistant", content: reply.content });
      messages.push({ role: "user", content: `Call propose_day for each remaining date: ${left.join(", ")}.` });
      continue;
    }

    messages.push({
      role: "assistant",
      content: reply.content,
      tool_calls: reply.toolCalls.map((c) => ({
        id: c.id,
        type: "function",
        function: { name: c.name, arguments: c.arguments },
      })),
    });
    for (const call of reply.toolCalls) {
      const args = parseArgs(call.arguments);
      emit({ type: "tool", name: call.name, args });
      const handler = handlers[call.name];
      const { content, summary } = handler
        ? await handler(args)
        : { content: `Error: unknown tool ${call.name}`, summary: "Unknown tool" };
      emit({ type: "result", name: call.name, summary });
      messages.push({ role: "tool", tool_call_id: call.id, content });
    }
  }

  const closet = await load.closet();
  const used = new Set([...proposed.values()].flatMap((p) => p.itemIds));
  const weather = await load.weather();
  const days: PlanDay[] = [];
  for (const date of dates) {
    const p = proposed.get(date);
    if (p) {
      days.push(await toDay(p, false));
      continue;
    }
    const warmth = weather.find((w) => w.date === date)?.warmth ?? null;
    const itemIds = pickOutfit(closet, warmth, used);
    itemIds.forEach((id) => used.add(id));
    const day = await toDay({ date, itemIds, note: FILLED_NOTE }, true);
    emit({ type: "day", day });
    days.push(day);
  }
  return { weekStart, days };
}
