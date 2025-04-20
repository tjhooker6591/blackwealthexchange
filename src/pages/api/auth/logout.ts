// src/pages/api/auth/logout.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

/**
 * API Route: POST /api/auth/logout
 *
 * Clears authentication cookies to log the user out across the entire application.
 * This includes custom session_token, accountType, and NextAuth session cookies.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // ─────────────────────────────────────────────────────
  // 1. Prevent caching to ensure logout is effective immediately
  // ─────────────────────────────────────────────────────
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // ─────────────────────────────────────────────────────
  // 2. Only allow POST requests for logout
  // ─────────────────────────────────────────────────────
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  // ─────────────────────────────────────────────────────
  // 3. Build an array of cookies to expire immediately
  // ─────────────────────────────────────────────────────
  const cookiesToClear = [
    // Custom session token cookie
    serialize("session_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: -1,
    }),
    // Custom account type cookie
    serialize("accountType", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: -1,
    }),
    // NextAuth default session cookie
    serialize("next-auth.session-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: -1,
    }),
    // If using encrypted cookie
    serialize("__Secure-next-auth.session-token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: -1,
    }),
    // NextAuth CSRF token cookie
    serialize("next-auth.csrf-token", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: -1,
    }),
    // If using callback URL cookie
    serialize("next-auth.callback-url", "", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: -1,
    }),
  ];

  // ─────────────────────────────────────────────────────
  // 4. Set the headers to clear all cookies
  // ─────────────────────────────────────────────────────
  res.setHeader("Set-Cookie", cookiesToClear);

  // ─────────────────────────────────────────────────────
  // 5. Return a success response to the client
  // ─────────────────────────────────────────────────────
  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
}
