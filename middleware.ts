import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PUBLIC_PAGE_PATHS = new Set(["/login", "/signup"]);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const { pathname } = nextUrl;

  const isApi = pathname.startsWith("/api/");
  const isPublicPage = PUBLIC_PAGE_PATHS.has(pathname);

  if (isLoggedIn && isPublicPage) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  if (!isLoggedIn) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!isPublicPage) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)"],
};
