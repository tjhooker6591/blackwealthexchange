import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { ADMIN_ERROR_CODES, adminFail } from "@/lib/adminApiContract";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import clientPromise from "@/lib/mongodb";

export type AdminDecoded = {
  userId?: string;
  email?: string;
  accountType?: string;
  role?: string;
  isAdmin?: boolean;
  roles?: string[];
  tokenVersion?: number;
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

    const secret = getJwtSecret();
    if (!secret) return null;

    return jwt.verify(token, secret) as AdminDecoded;
  } catch {
    return null;
  }
}

/**
 * Phase 8 -- P8-01 Identity Fortress. `isAdminDecoded` above only checks
 * claims baked into the JWT at login time. Because nothing previously
 * re-checked those claims against the database, a session token kept its
 * admin authority for its full lifetime even after an operator revoked
 * `isAdmin` (or the account was disabled) in the `users` collection --
 * privilege revocation, an explicit part of the incident-response
 * lifecycle (P8-14: REVOKE), did not actually take effect until the token
 * expired on its own. This performs one real-time database check against
 * the canonical `users` record (the same collection login.ts treats as
 * the source of truth for `isAdmin`) so a revoked admin loses access on
 * their very next request, not after up to 30 minutes. Every admin route
 * that calls requireAdminFromRequest gets this for free -- no route-level
 * changes needed.
 */
function isAllowlistedAdminEmail(email: string | undefined): boolean {
  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(allow.length && email && allow.includes(email.toLowerCase()));
}

async function verifyAdminStillAuthorizedInDb(
  decoded: AdminDecoded,
): Promise<boolean> {
  // The ADMIN_EMAILS env allowlist is a config-based grant independent of
  // any users.isAdmin flag (see isAdminDecoded above) -- preserve that
  // existing mechanism unchanged rather than requiring a DB flag it was
  // never designed to have.
  if (isAllowlistedAdminEmail(decoded.email)) return true;

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const filter =
      decoded.userId && ObjectId.isValid(decoded.userId)
        ? { _id: new ObjectId(decoded.userId) }
        : { email: (decoded.email || "").toLowerCase() };

    const canonical = await db.collection("users").findOne(filter, {
      projection: { isAdmin: 1, tokenVersion: 1 },
    });

    if (!canonical || canonical.isAdmin !== true) return false;

    const currentTokenVersion =
      typeof canonical.tokenVersion === "number" ? canonical.tokenVersion : 0;
    const incomingTokenVersion =
      typeof decoded.tokenVersion === "number" ? decoded.tokenVersion : 0;
    if (incomingTokenVersion !== currentTokenVersion) return false;

    return true;
  } catch (err) {
    console.error("[adminAuth] admin re-verification failed:", err);
    // Fail closed: if the re-check itself errors, do not grant admin access.
    return false;
  }
}

export async function requireAdminFromRequest(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<AdminDecoded | null> {
  const decoded = getAdminDecodedFromRequest(req);
  if (!decoded) {
    adminFail(res, 401, ADMIN_ERROR_CODES.UNAUTHORIZED, "Unauthorized");
    return null;
  }

  try {
    if (!isAdminDecoded(decoded)) {
      adminFail(res, 403, ADMIN_ERROR_CODES.FORBIDDEN, "Forbidden");
      return null;
    }

    const stillAuthorized = await verifyAdminStillAuthorizedInDb(decoded);
    if (!stillAuthorized) {
      adminFail(res, 403, ADMIN_ERROR_CODES.FORBIDDEN, "Forbidden");
      return null;
    }

    return decoded;
  } catch {
    adminFail(res, 401, ADMIN_ERROR_CODES.UNAUTHORIZED, "Unauthorized");
    return null;
  }
}
