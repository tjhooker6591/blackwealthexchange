import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  isCookieAuthenticated,
  isSameOriginRequest,
  isStateChangingMethod,
} from "@/lib/security/csrf";

const loginRequiredRoutes = [
  "/marketplace",
  "/job-listings",
  "/jobs",
  "/investment",
  "/student-opportunities",
  "/courses",
];

const roleProtectedRoutes: Record<string, string | string[]> = {
  "/marketplace/add-products": "seller",
  "/marketplace/edit-products": "seller",
  "/marketplace/dashboard": "seller",
  "/dashboard/seller": "seller",
  "/post-job": "employer",
  "/employer": "employer",
  "/dashboard/employer": "employer",
  "/add-business": "business",
  "/advertise": ["business", "seller"],
  "/admin": "admin",
  "/admin/": "admin",
  "/admin/:path*": "admin",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = req.cookies.get("session_token");

  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api/") &&
    isStateChangingMethod(req.method) &&
    isCookieAuthenticated(req) &&
    !pathname.startsWith("/api/stripe/webhook") &&
    !isSameOriginRequest(req)
  ) {
    return NextResponse.json(
      { error: "CSRF validation failed." },
      { status: 403 },
    );
  }

  for (const [routePrefix] of Object.entries(roleProtectedRoutes)) {
    if (pathname.startsWith(routePrefix) && !isLoggedIn) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/business-directory/") && !isLoggedIn) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  for (const loginRoute of loginRequiredRoutes) {
    if (pathname.startsWith(loginRoute) && !isLoggedIn) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/marketplace/:path*",
    "/marketplace",
    "/marketplace/product/:path*",
    "/job-listings",
    "/jobs/:path*",
    "/jobs",
    "/investment/:path*",
    "/investment",
    "/student-opportunities/:path*",
    "/student-opportunities",
    "/courses/:path*",
    "/courses",
    "/business-directory/:path*",
    "/post-job",
    "/employer/:path*",
    "/employer",
    "/dashboard/employer/:path*",
    "/dashboard/employer",
    "/dashboard/seller/:path*",
    "/dashboard/seller",
    "/add-business",
    "/advertise",
    "/admin/:path*",
    "/admin",
    "/api/:path*",
  ],
};
