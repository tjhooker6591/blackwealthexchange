// src/lib/network/shared.ts
//
// Shared helpers for the Phase 5 -- Network Effects capabilities (follow,
// save, reviews, referrals, collections, notifications, inbox, alerts).
// These capabilities all follow the same session-cookie + Mongo pattern
// already used across the app (see src/pages/api/user/save-job.ts,
// src/pages/api/reviews/add.ts, src/pages/api/referrals/code.ts); this
// module exists only to avoid re-deriving that boilerplate in every new
// Phase 5 API route.

import type { NextApiRequest } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId, type Filter } from "mongodb";
import { getJwtSecret } from "@/lib/env";

export type NetworkSession = {
  userId: string;
  email: string;
  accountType: string;
};

export function s(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function toId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (value instanceof ObjectId) return value.toString();
  if (typeof value === "object" && (value as any)?._bsontype === "ObjectId") {
    return String(value);
  }
  return s(value);
}

/** Resolves the logged-in user from the session_token cookie, or null. */
export function getNetworkSession(req: NextApiRequest): NetworkSession | null {
  try {
    const parsed = cookie.parse(req.headers.cookie || "");
    const token = parsed.session_token || req.cookies?.session_token;
    if (!token) return null;
    const payload = jwt.verify(token, getJwtSecret()) as {
      userId?: string;
      id?: string;
      email?: string;
      accountType?: string;
    };
    const userId = s(payload.userId || payload.id);
    if (!userId) return null;
    return {
      userId,
      email: s(payload.email).toLowerCase(),
      accountType: s(payload.accountType) || "user",
    };
  } catch {
    return null;
  }
}

/** Matches either an ObjectId or a legacy string id for the given field. */
export function buildIdFilter(key: string, id: string): Filter<any> | null {
  const trimmed = s(id);
  if (!trimmed) return null;
  if (ObjectId.isValid(trimmed) && String(new ObjectId(trimmed)) === trimmed) {
    return { $or: [{ [key]: new ObjectId(trimmed) }, { [key]: trimmed }] };
  }
  return { [key]: trimmed };
}

export function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}
