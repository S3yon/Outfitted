import type { Verdict } from "./verdict.ts";

export type ReasonFacts = {
  title: string;
  category: string;
  price: string | null;
  verdict: Verdict;
  added: number;
  before: number;
  missing: string[];
  duplicateOf: string | null;
  costPerWear: string | null;
  fallback: string;
};

type Msg = { role: "system" | "user"; content: string };

// The model only words the verdict the rules already reached; it never changes it.
export function reasonPrompt(f: ReasonFacts): Msg[] {
  const lines = [
    `Item: ${f.title} (${f.category})${f.price ? `, ${f.price}` : ""}`,
    `Verdict: ${f.verdict}`,
    `Unlocks ${f.added} new outfits (${f.before} now)`,
    f.missing.length ? `Closet has no ${f.missing.join(" or ")}` : null,
    f.duplicateOf ? `Looks like an owned item: ${f.duplicateOf}` : null,
    f.costPerWear ? `Cost per wear over a year: ${f.costPerWear}` : null,
  ].filter(Boolean);
  return [
    {
      role: "system",
      content:
        "You explain a shopping verdict for a wardrobe app in two short sentences, plain words, no emoji, no markdown. Use only the facts given. Do not change the verdict.",
    },
    { role: "user", content: lines.join("\n") },
  ];
}

export function cleanReason(text: string): string | null {
  const plain = text.replace(/[*_`#"]/g, "").replace(/\s+/g, " ").trim();
  if (!plain || plain.length > 300) return null;
  const sentences = plain.match(/[^.!?]+[.!?]+/g) ?? [plain];
  return sentences.slice(0, 2).join(" ").replace(/\s+/g, " ").trim();
}

// One call to the planner's free model; the templated reason whenever it fails or is limited.
export async function writeReason(f: ReasonFacts): Promise<{ reason: string; by: "model" | "rules" }> {
  const base = process.env.PLANNER_BASE_URL || "https://openrouter.ai/api/v1";
  const model = process.env.PLANNER_MODEL || "google/gemma-4-31b-it:free";
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.OPENROUTER_API_KEY) headers.Authorization = `Bearer ${process.env.OPENROUTER_API_KEY}`;
  try {
    const res = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({ model, messages: reasonPrompt(f), max_tokens: 120 }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return { reason: f.fallback, by: "rules" };
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reason = cleanReason(data.choices?.[0]?.message?.content ?? "");
    return reason ? { reason, by: "model" } : { reason: f.fallback, by: "rules" };
  } catch {
    return { reason: f.fallback, by: "rules" };
  }
}
