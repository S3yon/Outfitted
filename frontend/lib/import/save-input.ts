import { isCategory, type Category } from "./parse.ts";

export const EMBEDDING_SIZE = 768;
// A 512 px JPEG crop is ~30-80 KB; anything far past that isn't one of ours.
const MAX_CROP_BYTES = 2 * 1024 * 1024;
const MAX_DESCRIPTION = 200;
const CROP_PREFIX = /^data:image\/(jpeg|png|webp);base64,/;

export type SaveInput = {
  image: Buffer;
  category: Category;
  description: string;
  embedding: number[] | null;
};

type Result = { ok: true; value: SaveInput } | { ok: false; error: string };

// Check the body of POST /api/import/save: one reviewed item from the importer.
export function parseSaveInput(body: unknown): Result {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid body" };
  const { crop, category, description, embedding } = body as Record<string, unknown>;

  if (!isCategory(category)) return { ok: false, error: "Invalid category" };
  if (typeof crop !== "string" || !CROP_PREFIX.test(crop)) return { ok: false, error: "Invalid crop" };
  const image = Buffer.from(crop.replace(CROP_PREFIX, ""), "base64");
  if (image.length === 0 || image.length > MAX_CROP_BYTES) return { ok: false, error: "Invalid crop" };

  let vector: number[] | null = null;
  if (embedding != null) {
    const valid =
      Array.isArray(embedding) &&
      embedding.length === EMBEDDING_SIZE &&
      embedding.every((v) => typeof v === "number" && Number.isFinite(v));
    if (!valid) return { ok: false, error: "Invalid embedding" };
    vector = embedding as number[];
  }

  const text = typeof description === "string" ? description.trim().slice(0, MAX_DESCRIPTION) : "";
  return {
    ok: true,
    value: { image, category, description: text || category, embedding: vector },
  };
}
