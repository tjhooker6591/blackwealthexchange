import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // ✅ Check if any cookies exist at all
    const rawCookie = req.headers.cookie || "";

    // ✅ Try parsing cookies only if present
    if (!rawCookie.includes("token")) {
      return res
        .status(401)
        .json({ user: null, error: "No token cookie found." });
    }

    const parsed = cookie.parse(rawCookie);
    const token = parsed.token;

    if (!token) {
      return res.status(401).json({ user: null, error: "Token missing." });
    }

    // ✅ Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      accountType: string;
    };

    return res.status(200).json({ user: decoded });
  } catch (error) {
    console.error("JWT auth error:", error);
    return res
      .status(401)
      .json({ user: null, error: "Invalid or expired token." });
  }
}
