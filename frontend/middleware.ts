import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected app routes — redirect to landing if not authenticated
  const protectedPaths = ["/wardrobe", "/outfits", "/market", "/profile"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const session = await auth0.getSession();
    if (!session?.user) {
      const landing = new URL("/", request.url);
      return Response.redirect(landing);
    }
  }

  return auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
