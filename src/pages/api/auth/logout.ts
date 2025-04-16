// src/pages/api/auth/logout.ts
import { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  // Expire the cookies
  res.setHeader("Set-Cookie", [
    serialize("session_token", "", {
      path: "/",
      expires: new Date(0),
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    }),
    serialize("accountType", "", {
      path: "/",
      expires: new Date(0),
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    }),
  ]);

  // Optionally: clear any client‑side storage
  // (we stopped writing to localStorage in the last iteration)

  res.status(200).json({ success: true });
}
