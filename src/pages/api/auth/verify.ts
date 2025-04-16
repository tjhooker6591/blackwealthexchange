// File: src/pages/api/auth/verify.ts
import { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import { verifyToken } from "../../../lib/verifyToken";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Parse the incoming cookies
    const cookies = parse(req.headers.cookie || "");
    // Look for the session_token (what your login API actually sets),
    // falling back to token if you ever used that name elsewhere
    const token = cookies.session_token || cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    // Verify and decode
    const decoded = verifyToken(token);
    if (!decoded || decoded.accountType !== "seller") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // All good
    return res.status(200).json({ message: "Authorized" });
  } catch (err) {
    console.error("Verification error:", err);
    return res.status(401).json({ error: "Unauthorized" });
  }
}
