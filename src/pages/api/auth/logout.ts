// src/pages/api/auth/logout.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import {
  getAuthCookieDomain,
  getAuthCookieSecure,
} from "@/lib/authCookiePolicy";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }

  try {
    const raw = req.headers.cookie || "";
    const parsed = cookie.parse(raw);
    const token = parsed.session_token;

    if (token) {
      try {
        const payload = jwt.verify(token, getJwtSecret()) as {
          email?: string;
          accountType?: string;
        };
        const email = typeof payload.email === "string" ? payload.email : "";
        const role = payload.accountType || "user";
        const collectionName =
          role === "seller"
            ? "sellers"
            : role === "employer"
              ? "employers"
              : role === "business"
                ? "businesses"
                : "users";

        if (email) {
          const client = await clientPromise;
          const db = client.db(getMongoDbName());
          await db
            .collection(collectionName)
            .updateOne({ email }, { $inc: { tokenVersion: 1 } });
        }
      } catch {
        // Invalid token should still clear cookies and return success.
      }
    }
  } catch {
    // Never fail logout cookie clearing due revocation-side issues.
  }

  const host = (req.headers.host || "").toLowerCase();
  const isLocalHost =
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1") ||
    host.startsWith("[::1]");
  const isProd = isLocalHost ? false : getAuthCookieSecure();
  const cookieDomain = isLocalHost ? undefined : getAuthCookieDomain();

  function clearCookie(name: string, httpOnly: boolean) {
    const base = {
      httpOnly,
      secure: isProd,
      sameSite: "lax" as const,
      path: "/",
      maxAge: -1,
      expires: new Date(0),
    };

    const hostOnly = serialize(name, "", base);
    const domainScoped = cookieDomain
      ? serialize(name, "", { ...base, domain: cookieDomain })
      : null;

    return domainScoped ? [hostOnly, domainScoped] : [hostOnly];
  }

  const cookiesToClear = [
    ...clearCookie("session_token", true),
    ...clearCookie("accountType", false),
    ...clearCookie("next-auth.session-token", true),
    ...clearCookie("__Secure-next-auth.session-token", true),
    ...clearCookie("next-auth.csrf-token", false),
    ...clearCookie("next-auth.callback-url", false),
  ];

  res.setHeader("Set-Cookie", cookiesToClear);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
}
