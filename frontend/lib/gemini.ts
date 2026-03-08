import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// gemini-1.5-flash — fastest and cheapest for the hackathon
export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export type GeminiOutfit = {
  outfit_description: string;
  item_ids: string[];
  explanation: string;
};

export type GeminiResponse = {
  outfits: GeminiOutfit[];
};

// Strips markdown code fences Gemini sometimes wraps around JSON
export function cleanGeminiJson(raw: string): string {
  return raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();
}
