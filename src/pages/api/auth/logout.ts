// src/pages/api/auth/logout.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import { getAuthCookieDomain, getAuthCookieSecure } from "@/lib/authCookiePolicy";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const isProd = getAuthCookieSecure();
  const cookieDomain = getAuthCookieDomain();

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
