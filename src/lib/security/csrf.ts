import type { NextRequest } from "next/server";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function isCookieAuthenticated(req: NextRequest) {
  return Boolean(req.cookies.get("session_token")?.value);
}

export function isStateChangingMethod(method: string) {
  return !SAFE_METHODS.has(method.toUpperCase());
}

function normalizeOriginValue(value: string) {
  try {
    const url = new URL(value);
    const hostname =
      url.hostname === "localhost" ? "127.0.0.1" : url.hostname.toLowerCase();
    const protocol = url.protocol.toLowerCase();
    const port = url.port || (protocol === "https:" ? "443" : "80");
    return `${protocol}//${hostname}:${port}`;
  } catch {
    return "";
  }
}

function getRequestOrigin(req: NextRequest) {
  const forwardedProto = req.headers.get("x-forwarded-proto");
  const forwardedHost = req.headers.get("x-forwarded-host");
  const host = req.headers.get("host");

  if (forwardedProto && forwardedHost) {
    return normalizeOriginValue(`${forwardedProto}://${forwardedHost}`);
  }

  if (host) {
    return normalizeOriginValue(`${req.nextUrl.protocol}//${host}`);
  }

  return normalizeOriginValue(req.nextUrl.origin);
}

export function isSameOriginRequest(req: NextRequest) {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const requestOrigin = getRequestOrigin(req);

  if (origin) {
    return normalizeOriginValue(origin) === requestOrigin;
  }

  if (referer) {
    return normalizeOriginValue(referer) === requestOrigin;
  }

  return false;
}
