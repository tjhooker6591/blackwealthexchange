import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  /* allow POST only */
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  /* expire both cookies with the *same* attributes used at login */
  res.setHeader("Set-Cookie", [
    serialize("session_token", "", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: -1,         // delete immediately
    }),
    serialize("accountType", "", {
      path: "/",
      httpOnly: true,     // added for extra safety
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: -1,
    }),
  ]);

  res.status(200).json({ success: true });
}
