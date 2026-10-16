import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";
import { cookieOptions, googleConfigured, redirectUri, SCOPE, STATE_COOKIE } from "@/lib/planner/google";

// GET /api/planner/google/start: send the user to Google's consent screen.
export async function GET(req: NextRequest) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (!googleConfigured()) {
    return NextResponse.redirect(new URL("/week?google=unavailable", req.url));
  }

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(req.nextUrl.origin),
    response_type: "code",
    scope: SCOPE,
    access_type: "online", // no refresh token
    include_granted_scopes: "true",
    state,
  });
  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  res.cookies.set(STATE_COOKIE, state, cookieOptions("/api/planner/google", 600));
  return res;
}
