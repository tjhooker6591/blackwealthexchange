import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  isCookieAuthenticated,
  isSameOriginRequest,
  isStateChangingMethod,
} from "@/lib/security/csrf";

const loginRequiredRoutes = ["/investment", "/student-opportunities", "/courses"];

const roleProtectedRoutes: Record<string, string | string[]> = {
  "/seller": "seller",
  "/business": "business",
  "/business/profile": "business",
  "/business-dashboard": "business",
  "/edit-business": "business",
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

async function getSessionRole(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get("session_token")?.value;
  if (!token) return null;

  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    const role = payload?.accountType;
    return typeof role === "string" ? role : null;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = req.cookies.get("session_token");
  const requestProto =
    req.headers.get("x-forwarded-proto") ||
    req.nextUrl.protocol.replace(":", "");

  if (process.env.NODE_ENV === "production" && requestProto !== "https") {
    const httpsUrl = req.nextUrl.clone();
    httpsUrl.protocol = "https:";
    return NextResponse.redirect(httpsUrl, 308);
  }

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

  for (const [routePrefix, requiredRole] of Object.entries(
    roleProtectedRoutes,
  )) {
    if (!pathname.startsWith(routePrefix)) continue;

    if (!isLoggedIn) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = await getSessionRole(req);
    const allowed = Array.isArray(requiredRole)
      ? requiredRole.includes(role || "")
      : role === requiredRole;

    if (!allowed) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  for (const loginRoute of loginRequiredRoutes) {
    if (pathname.startsWith(loginRoute) && !isLoggedIn) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const res = NextResponse.next();
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }
  return res;
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
    "/post-job",
    "/employer/:path*",
    "/employer",
    "/dashboard/employer/:path*",
    "/dashboard/employer",
    "/dashboard/seller/:path*",
    "/dashboard/seller",
    "/seller/:path*",
    "/seller",
    "/business",
    "/business/profile",
    "/business-dashboard",
    "/edit-business",
    "/add-business",
    "/advertise",
    "/admin/:path*",
    "/admin",
    "/api/:path*",
  ],
};
