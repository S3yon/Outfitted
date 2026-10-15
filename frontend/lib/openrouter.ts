import { DETECT_PROMPT } from "@/lib/import/detect-prompt";
import { parseDetections, type RawDetection } from "@/lib/import/parse";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3.1-flash-image-preview";
// Text model for outfits and recommendations. gemini-2.0-flash-001 was retired on OpenRouter.
export const TEXT_MODEL = "google/gemini-3.1-flash-lite";

type IdentifiedItem = {
  category: "tops" | "bottoms" | "shoes" | "outerwear" | "accessories";
  description: string;
  bbox: { x1: number; y1: number; x2: number; y2: number };
};

type AnalysisResult = {
  items: IdentifiedItem[];
};

export async function analyzeClothingImage(
  imageBase64: string,
  mimeType: string,
): Promise<AnalysisResult> {
  const text = await askImageModel(imageBase64, mimeType, ANALYZE_PROMPT);
  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleaned);
}

// Every garment the main person wears in an outfit photo (camera-roll importer).
export async function detectOutfitItems(imageBase64: string, mimeType: string): Promise<RawDetection[]> {
  return parseDetections(await askImageModel(imageBase64, mimeType, DETECT_PROMPT));
}

const ANALYZE_PROMPT = `Identify the single main clothing item or accessory that is the clear focus of this image. Ignore any items partially visible in the background or worn by other people.

If the image does not contain a wearable clothing item or fashion accessory (e.g. it shows food, weapons, electronics, people without clothing focus, or anything unrelated to fashion), return { "items": [] }.

Provide:
- "category": one of "tops", "bottoms", "shoes", "outerwear", "accessories"
- "description": a short description (e.g. "white oversized t-shirt", "black leather chelsea boots")
- "bbox": bounding box of the item as normalized coordinates (0.0–1.0) — { "x1": left, "y1": top, "x2": right, "y2": bottom }

Category rules:
- tops: t-shirts, shirts, blouses, tank tops, polos, sweaters, hoodies (without zipper/when worn as main top)
- bottoms: pants, jeans, shorts, skirts, trousers, joggers
- shoes: sneakers, boots, sandals, heels, loafers, slides
- outerwear: jackets, coats, blazers, zip-up hoodies, vests, parkas
- accessories: hats, bags, belts, jewelry, watches, sunglasses, scarves, necklaces, bracelets, glasses

Respond ONLY with valid JSON, no markdown:
{ "items": [{ "category": "tops", "description": "white t-shirt", "bbox": { "x1": 0.1, "y1": 0.05, "x2": 0.9, "y2": 0.95 } }] }`;

// One image plus one prompt to the image model; returns the reply's text.
async function askImageModel(imageBase64: string, mimeType: string, prompt: string): Promise<string> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;
  if (!message) throw new Error("No message in OpenRouter response");

  let text: string;
  if (typeof message.content === "string") {
    text = message.content;
  } else if (Array.isArray(message.content)) {
    text = message.content
      .filter((p: { type: string }) => p.type === "text")
      .map((p: { text: string }) => p.text)
      .join("");
  } else {
    throw new Error("Unexpected OpenRouter response format");
  }

  if (!text) throw new Error("No text content in OpenRouter response");
  return text;
}
