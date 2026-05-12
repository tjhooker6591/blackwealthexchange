import type { NextApiRequest } from "next";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type BuyerToken = {
  userId?: string;
  email?: string;
};

export function resolveBuyerSession(
  req: NextApiRequest,
):
  | { ok: true; userId: string; email: string }
  | { ok: false; status: number; error: string } {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.session_token || cookies.token;
  if (!token) {
    return { ok: false, status: 401, error: "Unauthorized: No token provided" };
  }

  let decoded: BuyerToken;
  try {
    decoded = jwt.verify(token, getJwtSecret()) as BuyerToken;
  } catch {
    return { ok: false, status: 401, error: "Unauthorized: Invalid token" };
  }

  const userId = String(decoded.userId || "").trim();
  const email = String(decoded.email || "")
    .trim()
    .toLowerCase();

  if (!userId && !email) {
    return {
      ok: false,
      status: 401,
      error: "Unauthorized: Missing buyer identity",
    };
  }

  return { ok: true, userId, email };
}
