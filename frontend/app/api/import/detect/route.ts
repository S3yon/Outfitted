import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";
import { detectOutfitItems } from "@/lib/openrouter";
import { cropDetection } from "@/lib/import/crop";

// The browser downscales to 1280 px JPEG first, so a real photo is well under this.
const MAX_BYTES = 8 * 1024 * 1024;

// Camera-roll importer, step 1: find every garment in one outfit photo and return the crops.
// Nothing is uploaded or saved here; the user reviews first.
export async function POST(req: Request) {
  try {
    const session = await auth0.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Photo is too large" }, { status: 413 });
    }

    const image = Buffer.from(await file.arrayBuffer());
    const found = await detectOutfitItems(image.toString("base64"), file.type || "image/jpeg");

    const detections = await Promise.all(
      found.map(async (d) => ({ ...d, ...(await cropDetection(image, d.bbox)) })),
    );
    return NextResponse.json({ detections });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[import/detect] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
