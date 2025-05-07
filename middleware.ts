// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next.js internals and static files (HMR, assets, etc)
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const accountType = req.cookies.get("accountType")?.value;
  const isLoggedIn = req.cookies.get("session_token");

  const protectedRoutes: Record<string, string> = {
    "/marketplace": "seller",
    "/marketplace/add-products": "seller",
    "/marketplace/edit-products": "seller",
    "/post-job": "employer",
    "/employer/jobs": "employer",
    "/employer/applicants": "employer",
    "/add-business": "business",
    "/advertise": "business",
  };

  for (const [routePrefix, requiredRole] of Object.entries(protectedRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      if (!isLoggedIn || !accountType || accountType !== requiredRole) {
        console.warn(
          `🚫 Unauthorized access attempt to ${pathname} by ${accountType || "unauthenticated user"}`,
        );
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/marketplace/:path*",
    "/post-job",
    "/employer/:path*",
    "/add-business",
    "/advertise",
  ],
};
