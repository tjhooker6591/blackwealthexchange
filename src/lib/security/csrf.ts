import type { NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isCookieAuthenticated(req: NextRequest) {
  return Boolean(req.cookies.get("session_token")?.value);
}

export function isStateChangingMethod(method: string) {
  return !SAFE_METHODS.has(method.toUpperCase());
}

export function isSameOriginRequest(req: NextRequest) {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const hostOrigin = req.nextUrl.origin;

  if (origin) {
    return origin === hostOrigin;
  }

  if (referer) {
    try {
      const ref = new URL(referer);
      return ref.origin === hostOrigin;
    } catch {
      return false;
    }
  }

  return false;
}
