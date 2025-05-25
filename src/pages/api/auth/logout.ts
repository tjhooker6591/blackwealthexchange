// src/pages/api/auth/logout.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const isProd = process.env.NODE_ENV === "production";
  const cookieDomain = isProd ? ".blackwealthexchange.com" : undefined;

  const cookiesToClear = [
    serialize("session_token", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: -1,
      expires: new Date(0),
      domain: cookieDomain,
    }),
    serialize("accountType", "", {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: -1,
      expires: new Date(0),
      domain: cookieDomain,
    }),
    serialize("next-auth.session-token", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: -1,
      expires: new Date(0),
      domain: cookieDomain,
    }),
    serialize("__Secure-next-auth.session-token", "", {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: -1,
      expires: new Date(0),
      domain: cookieDomain,
    }),
    serialize("next-auth.csrf-token", "", {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: -1,
      expires: new Date(0),
      domain: cookieDomain,
    }),
    serialize("next-auth.callback-url", "", {
      httpOnly: false,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: -1,
      expires: new Date(0),
      domain: cookieDomain,
    }),
  ];

  res.setHeader("Set-Cookie", cookiesToClear);

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
}
