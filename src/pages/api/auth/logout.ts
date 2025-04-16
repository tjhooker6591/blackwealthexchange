// src/pages/api/auth/logout.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  /* ─ Allow POST only ─ */
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  /* ─ Expire both cookies ─ */
  res.setHeader("Set-Cookie", [
    serialize("session_token", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: -1, // delete immediately
    }),
    serialize("accountType", "", {
      path: "/",
      httpOnly: true,   // <‑‑ added
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: -1,
    }),
  ]);

  res.status(200).json({ success: true });
}
