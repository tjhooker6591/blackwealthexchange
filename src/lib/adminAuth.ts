import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";

export type AdminDecoded = {
  userId?: string;
  email?: string;
  accountType?: string;
  role?: string;
  isAdmin?: boolean;
  roles?: string[];
};

export function isAdminDecoded(decoded: AdminDecoded) {
  if (decoded?.isAdmin) return true;
  if (decoded?.accountType === "admin") return true;
  if (decoded?.role === "admin") return true;
  if (Array.isArray(decoded?.roles) && decoded.roles.includes("admin")) {
    return true;
  }

  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length && decoded?.email) {
    return allow.includes(decoded.email.toLowerCase());
  }

  return false;
}

export function getAdminDecodedFromRequest(
  req: NextApiRequest,
): AdminDecoded | null {
  try {
    const parsed = cookie.parse(req.headers.cookie || "");
    const token = parsed.session_token || req.cookies?.session_token;
    if (!token) return null;

    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!secret) return null;

    return jwt.verify(token, secret) as AdminDecoded;
  } catch {
    return null;
  }
}

export async function requireAdminFromRequest(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<AdminDecoded | null> {
  const decoded = getAdminDecodedFromRequest(req);
  if (!decoded) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    if (!isAdminDecoded(decoded)) {
      res.status(403).json({ error: "Forbidden" });
      return null;
    }

    return decoded;
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}
