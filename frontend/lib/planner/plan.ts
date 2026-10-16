import type { DayEvent, Chip } from "./events.ts";
import type { DayWeather } from "./weather.ts";

// One day of a saved plan, as stored in week_plans.plan and drawn on the Week tab.
export type PlanDay = {
  date: string;
  weather: DayWeather | null;
  events: DayEvent[];
  chip: Chip | null;
  itemIds: string[];
  note: string;
  filled: boolean; // true when fallback.ts picked the items, not the model
};

export type WeekPlan = { weekStart: string; days: PlanDay[] };
