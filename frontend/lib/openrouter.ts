const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemini-3.1-flash-image-preview";

type IdentifiedItem = {
  category: "tops" | "bottoms" | "shoes" | "outerwear" | "accessories";
  description: string;
};

type AnalysisResult = {
  items: IdentifiedItem[];
};

export async function analyzeClothingImage(
  imageBase64: string,
  mimeType: string,
): Promise<AnalysisResult> {
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
            {
              type: "text",
              text: `Identify the single main clothing item or accessory that is the clear focus of this image. Ignore any items partially visible in the background or worn by other people.

Provide:
- "category": one of "tops", "bottoms", "shoes", "outerwear", "accessories"
- "description": a short description (e.g. "white oversized t-shirt", "black leather chelsea boots")

Category rules:
- tops: t-shirts, shirts, blouses, tank tops, polos, sweaters, hoodies (without zipper/when worn as main top)
- bottoms: pants, jeans, shorts, skirts, trousers, joggers
- shoes: sneakers, boots, sandals, heels, loafers, slides
- outerwear: jackets, coats, blazers, zip-up hoodies, vests, parkas
- accessories: hats, bags, belts, jewelry, watches, sunglasses, scarves, necklaces, bracelets, glasses

Respond ONLY with valid JSON, no markdown:
{ "items": [{ "category": "tops", "description": "white t-shirt" }] }`,
            },
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

  const cleaned = text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleaned);
}
