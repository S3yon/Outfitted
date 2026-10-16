import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import {
  cookieOptions,
  googleConfigured,
  MAX_AGE,
  redirectUri,
  STATE_COOKIE,
  TOKEN_COOKIE,
} from "@/lib/planner/google";

// GET /api/planner/google/callback: check state, trade the code for an access token, keep
// the token in an httpOnly cookie for up to an hour, and go back to the Week tab.
export async function GET(req: NextRequest) {
  const back = (result: string) => {
    const res = NextResponse.redirect(new URL(`/week?google=${result}`, req.url));
    res.cookies.delete({ name: STATE_COOKIE, path: "/api/planner/google" });
    return res;
  };

  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  if (!googleConfigured() || !code || !state || state !== req.cookies.get(STATE_COOKIE)?.value) {
    return back("error");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(req.nextUrl.origin),
      grant_type: "authorization_code",
    }),
  });
  const token = (await tokenRes.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number }
    | null;
  if (!tokenRes.ok || !token?.access_token) {
    return back("error");
  }

  const res = back("connected");
  const maxAge = Math.min(token.expires_in ?? MAX_AGE, MAX_AGE);
  res.cookies.set(TOKEN_COOKIE, token.access_token, cookieOptions("/api/planner", maxAge));
  return res;
}
