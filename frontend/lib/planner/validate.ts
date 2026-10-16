export type ProposedDay = { date: string; itemIds: string[]; note: string };
type Context = { dates: string[]; closet: { id: string; category: string }[] };
type Result = { ok: true; value: ProposedDay } | { ok: false; error: string };

// Any number of these; every other category takes one item a day.
const MANY = "accessories";
// A day needs one of each of these, when the closet has any.
const REQUIRED = ["tops", "bottoms"];
const MAX_ITEMS = 8;
const NOTE_CHARS = 200;

// Check the model's propose_day call. The error goes back to the model as the tool result,
// so it says exactly what to fix.
export function checkDay(args: unknown, { dates, closet }: Context): Result {
  if (typeof args === "string") {
    try {
      args = JSON.parse(args);
    } catch {
      return { ok: false, error: "arguments are not valid JSON" };
    }
  }
  const { date, itemIds, note } = (args ?? {}) as Record<string, unknown>;

  if (typeof date !== "string" || !dates.includes(date)) {
    return { ok: false, error: `date must be one of ${dates.join(", ")}` };
  }
  if (!Array.isArray(itemIds) || itemIds.length === 0 || !itemIds.every((id) => typeof id === "string")) {
    return { ok: false, error: "itemIds must be a non-empty list of item ids" };
  }
  const ids = [...new Set(itemIds as string[])];
  if (ids.length > MAX_ITEMS) return { ok: false, error: `at most ${MAX_ITEMS} items` };

  const category = new Map(closet.map((c) => [c.id, c.category]));
  const missing = ids.filter((id) => !category.has(id));
  if (missing.length) return { ok: false, error: `not in the closet: ${missing.join(", ")}` };

  const counts = new Map<string, number>();
  for (const id of ids) counts.set(category.get(id)!, (counts.get(category.get(id)!) ?? 0) + 1);
  for (const [cat, n] of counts) {
    if (cat !== MANY && n > 1) return { ok: false, error: `more than one item in ${cat}` };
  }
  const owned = new Set(category.values());
  for (const cat of REQUIRED) {
    if (owned.has(cat) && !counts.has(cat)) return { ok: false, error: `needs one item from ${cat}` };
  }

  const text = typeof note === "string" ? note.trim().slice(0, NOTE_CHARS) : "";
  return { ok: true, value: { date, itemIds: ids, note: text } };
}
