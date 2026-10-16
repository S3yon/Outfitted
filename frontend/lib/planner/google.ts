// Google Calendar, read-only, for one hour. The access token lives in an httpOnly cookie;
// no refresh token is asked for and nothing is stored in the database.

export const TOKEN_COOKIE = "planner_google_token";
export const STATE_COOKIE = "planner_google_state";
export const SCOPE = "https://www.googleapis.com/auth/calendar.events.readonly";
export const MAX_AGE = 3600;

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function redirectUri(origin: string): string {
  return `${origin}/api/planner/google/callback`;
}

export function cookieOptions(path: string, maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path,
    maxAge,
  };
}
