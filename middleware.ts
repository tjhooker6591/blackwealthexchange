// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define routes that require any account (login, any type)
const loginRequiredRoutes = [
  "/marketplace",
  "/job-listings",
  "/jobs",
  "/investment",
  "/student-opportunities",
  "/courses",
  "/business-directory/", // details, NOT list/search
];

// Define routes requiring *specific roles*
const roleProtectedRoutes: Record<string, string | string[]> = {
  "/marketplace/add-products": "seller",
  "/marketplace/edit-products": "seller",
  "/marketplace/dashboard": "seller",
  "/post-job": "employer",
  "/employer/jobs": "employer",
  "/employer/applicants": "employer",
  "/add-business": "business",
  "/advertise": ["business", "seller"], // both business and seller can advertise
  "/admin": "admin",
  "/admin/": "admin",
  "/admin/:path*": "admin",
};

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accountType = req.cookies.get("accountType")?.value;
  const isLoggedIn = req.cookies.get("session_token");

  console.log("MIDDLEWARE HIT:", pathname, "accountType:", accountType, "isLoggedIn:", !!isLoggedIn);

  // Allow Next.js internals and static files
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 1. Check role-protected routes first
  for (const [routePrefix, requiredRole] of Object.entries(roleProtectedRoutes)) {
    if (pathname.startsWith(routePrefix)) {
      if (
        !isLoggedIn ||
        !accountType ||
        (Array.isArray(requiredRole)
          ? !requiredRole.includes(accountType)
          : accountType !== requiredRole)
      ) {
        console.log(
          `REDIRECT: ${pathname} requires role: ${requiredRole}, found: ${accountType || "none"}`
        );
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // 2. Check login-required (general, any account type)
  for (const loginRoute of loginRequiredRoutes) {
    // Allow /business-directory?search=... to remain public
    if (
      pathname.startsWith(loginRoute) &&
      !(
        pathname === "/business-directory" &&
        req.nextUrl.searchParams.has("search")
      )
    ) {
      if (!isLoggedIn) {
        console.log(`REDIRECT: ${pathname} requires login, user not logged in.`);
        const loginUrl = req.nextUrl.clone();
        loginUrl.pathname = "/login";
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }
  }

  // Default allow
  return NextResponse.next();
}

// Match all routes except explicit public pages:
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
    "/add-business",
    "/advertise",
    "/admin/:path*",
    "/admin",
  ],
};
