import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  isCookieAuthenticated,
  isSameOriginRequest,
  isStateChangingMethod,
} from "@/lib/security/csrf";

const loginRequiredRoutes = [
  "/investment",
  "/student-opportunities",
  "/courses",
];

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

type SessionClaims = {
  role: string | null;
  isAdmin: boolean;
};

function isAdminFromClaims(payload: Record<string, unknown>) {
  if (payload?.isAdmin === true) return true;
  if (payload?.accountType === "admin") return true;
  if (payload?.role === "admin") return true;
  if (Array.isArray(payload?.roles) && payload.roles.includes("admin")) {
    return true;
  }
  return false;
}

async function getSessionClaims(req: NextRequest): Promise<SessionClaims> {
  const token = req.cookies.get("session_token")?.value;
  if (!token) return { role: null, isAdmin: false };

  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return { role: null, isAdmin: false };

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    const role = payload?.accountType;
    return {
      role: typeof role === "string" ? role : null,
      isAdmin: isAdminFromClaims(payload),
    };
  } catch {
    return { role: null, isAdmin: false };
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = req.cookies.get("session_token");
  const requestProto =
    req.headers.get("x-forwarded-proto") ||
    req.nextUrl.protocol.replace(":", "");

  const host = req.headers.get("host") || "";
  const isLocalHost =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]");

  if (
    process.env.NODE_ENV === "production" &&
    !isLocalHost &&
    requestProto !== "https"
  ) {
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
      if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/employer") ||
        pathname.startsWith("/marketplace")
      ) {
        console.info("[middleware] redirect_login_missing_cookie", {
          path: pathname,
          host,
          requestProto,
        });
      }
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const { role, isAdmin } = await getSessionClaims(req);
    const allowed =
      requiredRole === "admin"
        ? isAdmin
        : Array.isArray(requiredRole)
          ? requiredRole.includes(role || "")
          : role === requiredRole;

    if (!allowed) {
      if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/employer") ||
        pathname.startsWith("/marketplace")
      ) {
        console.info("[middleware] redirect_login_role_mismatch", {
          path: pathname,
          requiredRole,
          tokenRole: role,
          isAdmin,
        });
      }
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
