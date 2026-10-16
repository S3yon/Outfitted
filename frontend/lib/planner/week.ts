// Calendar dates as YYYY-MM-DD strings, computed in UTC so the server's time zone never shifts them.

const DAY_MS = 86_400_000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toTime(date: string): number {
  return Date.parse(`${date}T00:00:00Z`);
}

function fromTime(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return fromTime(toTime(date) + days * DAY_MS);
}

export function weekdayShort(date: string): string {
  return WEEKDAYS[new Date(toTime(date)).getUTCDay()];
}

// The Monday on or before `date`.
export function mondayOf(date: string): string {
  const day = new Date(toTime(date)).getUTCDay();
  return addDays(date, -((day + 6) % 7));
}

export function weekDates(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

export function isWeekStart(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ms = toTime(value);
  return !Number.isNaN(ms) && fromTime(ms) === value && mondayOf(value) === value;
}
