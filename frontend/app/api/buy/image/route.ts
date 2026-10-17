import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { BlockedUrlError, safeFetch } from "@/lib/net/safe-fetch";

const IMAGE_LIMIT = 5 * 1024 * 1024;

// GET /api/buy/image?u=<image url>: product images through the guarded fetch, so the browser
// can read the pixels (for FashionSigLIP) without the store's CORS headers.
export async function GET(req: NextRequest) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const u = req.nextUrl.searchParams.get("u");
  if (!u) return NextResponse.json({ error: "u is required" }, { status: 400 });

  try {
    const res = await safeFetch(u, { maxBytes: IMAGE_LIMIT, headers: { Accept: "image/*" } });
    const type = res.contentType.split(";")[0].trim();
    if (res.status !== 200 || !type.startsWith("image/") || type.includes("svg")) {
      return NextResponse.json({ error: "Not an image" }, { status: 415 });
    }
    if (res.body.byteLength >= IMAGE_LIMIT) {
      return NextResponse.json({ error: "Image too large" }, { status: 413 });
    }
    return new Response(new Uint8Array(res.body), {
      headers: { "Content-Type": type, "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" },
    });
  } catch (err) {
    const status = err instanceof BlockedUrlError ? 400 : 502;
    return NextResponse.json({ error: "Couldn't load that image" }, { status });
  }
}
