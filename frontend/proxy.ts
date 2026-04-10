import type { NextRequest } from "next/server"
import { auth0 } from "./lib/auth0"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let Auth0 handle session refresh / cookie management first
  const authRes = await auth0.middleware(request);

  // Protected app routes — redirect unauthenticated users to landing page
  const protectedPaths = ["/wardrobe", "/outfits", "/market", "/profile"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const session = await auth0.getSession(request);
    if (!session?.user) {
      return Response.redirect(new URL("/", request.url));
    }
  }

  return authRes;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|login).*)",
  ],
}
