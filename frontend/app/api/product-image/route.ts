import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

// GET /api/product-image?url=<imageUrl from /api/search>
// Shop images can't be fetched from the browser (no CORS headers), so the
// server fetches them. Only the image hosts product search returns are allowed.
const ALLOWED_HOST_SUFFIXES = [".gstatic.com", ".googleusercontent.com"];
const MAX_BYTES = 10 * 1024 * 1024;
const TIMEOUT_MS = 10_000;

function isAllowedHost(host: string) {
  return ALLOWED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export async function GET(req: Request) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const raw = new URL(req.url).searchParams.get("url");
  let target: URL;
  try {
    target = new URL(raw ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid image url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !isAllowedHost(target.hostname)) {
    return NextResponse.json(
      { error: `Image host not allowed: ${target.hostname}` },
      { status: 400 },
    );
  }

  let res: Response;
  try {
    // redirect: "error" so a redirect can't lead off the allowed hosts
    res = await fetch(target, {
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json({ error: "Could not reach image host" }, { status: 502 });
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!res.ok || !contentType.startsWith("image/")) {
    return NextResponse.json({ error: "Image host returned no image" }, { status: 502 });
  }

  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  const body = await res.arrayBuffer();
  if (body.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  return new NextResponse(body, {
    headers: { "Content-Type": contentType, "Cache-Control": "private, max-age=3600" },
  });
}
