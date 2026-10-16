import { addDays } from "./week.ts";

export const CHIPS = ["Work", "Gym", "Dinner", "Casual", "Event", "Travel"] as const;
export type Chip = (typeof CHIPS)[number];
export type Chips = Record<string, Chip>; // YYYY-MM-DD → chip

export type DayEvent = { title: string; time: string }; // time: HH:MM or "all day"
export type WeekDay = { date: string; events: DayEvent[]; chip: Chip | null };

type GoogleTime = { date?: string; dateTime?: string };
type GoogleEvent = { summary?: string; status?: string; start?: GoogleTime; end?: GoogleTime };

// The user's primary calendar, one day either side of the week so every time zone is covered.
// Events are then placed by the local date in their own timestamps.
export function calendarUrl(weekStart: string): string {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    timeMin: `${addDays(weekStart, -1)}T00:00:00Z`,
    timeMax: `${addDays(weekStart, 8)}T00:00:00Z`,
    maxResults: "250",
  });
  return `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`;
}

// Google's events list (or null when not connected) plus the chips → one row per date.
export function buildWeek(dates: string[], google: unknown, chips: Chips): WeekDay[] {
  const byDate = new Map<string, DayEvent[]>(dates.map((d) => [d, []]));
  const items = (google as { items?: unknown } | null)?.items;

  for (const e of Array.isArray(items) ? (items as GoogleEvent[]) : []) {
    const title = e.summary?.trim();
    if (!title || e.status === "cancelled") continue;

    if (e.start?.dateTime) {
      // "2026-10-19T09:30:00-04:00": the date and time as the calendar shows them.
      byDate.get(e.start.dateTime.slice(0, 10))?.push({ title, time: e.start.dateTime.slice(11, 16) });
    } else if (e.start?.date) {
      const end = e.end?.date ?? addDays(e.start.date, 1);
      for (let d = e.start.date; d < end; d = addDays(d, 1)) {
        byDate.get(d)?.push({ title, time: "all day" });
      }
    }
  }

  return dates.map((date) => ({ date, events: byDate.get(date)!, chip: chips[date] ?? null }));
}

// Chips from the request body: known names on dates inside the week, nothing else.
export function parseChips(body: unknown, dates: string[]): Chips {
  if (!body || typeof body !== "object" || Array.isArray(body)) return {};
  const chips: Chips = {};
  for (const [date, chip] of Object.entries(body)) {
    if (dates.includes(date) && CHIPS.includes(chip as Chip)) chips[date] = chip as Chip;
  }
  return chips;
}

// One line for the steps list: "4 events, 1 day set by hand".
export function weekSummary(week: WeekDay[]): string {
  const events = week.reduce((n, d) => n + d.events.length, 0);
  const chips = week.filter((d) => d.chip).length;
  const parts = [];
  if (events) parts.push(`${events} event${events === 1 ? "" : "s"}`);
  if (chips) parts.push(`${chips} day${chips === 1 ? "" : "s"} set by hand`);
  return parts.length ? parts.join(", ") : "No events";
}
