export const MAX_ENTRIES = 500;
const SOURCES = ["photo", "manual"] as const;

export type WearSource = (typeof SOURCES)[number];
export type LogEntry = { itemId: string; wornOn: string; source: WearSource };

type Result = { ok: true; value: LogEntry[] } | { ok: false; error: string };

function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

// Check the body of POST /api/wear. `today` is the latest allowed date (the client sends its
// local date, so allow up to the server's today plus one for time zones ahead of UTC).
export function parseLogInput(body: unknown, today: string): Result {
  const entries = (body as { entries?: unknown } | null)?.entries;
  if (!Array.isArray(entries) || entries.length === 0) return { ok: false, error: "No entries" };
  if (entries.length > MAX_ENTRIES) return { ok: false, error: "Too many entries" };

  const seen = new Set<string>();
  const value: LogEntry[] = [];
  for (const e of entries) {
    const { itemId, wornOn, source } = (e ?? {}) as Record<string, unknown>;
    if (typeof itemId !== "string" || !itemId) return { ok: false, error: "Invalid item" };
    if (!isDate(wornOn) || wornOn > today) return { ok: false, error: "Invalid date" };
    if (!SOURCES.includes(source as WearSource)) return { ok: false, error: "Invalid source" };
    const key = `${itemId}|${wornOn}`;
    if (seen.has(key)) continue;
    seen.add(key);
    value.push({ itemId, wornOn, source: source as WearSource });
  }
  return { ok: true, value };
}
