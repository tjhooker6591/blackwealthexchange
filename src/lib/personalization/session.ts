// src/lib/personalization/session.ts
//
// Shared session/authorization helpers for Phase 4 personalization APIs.
// Mirrors the established cookie/JWT pattern used across the app (see
// src/pages/api/user/get-dashboard.ts, src/pages/api/auth/me.ts) rather than
// introducing a new auth mechanism.

import type { NextApiRequest } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import { ObjectId, type Db } from "mongodb";
import { getJwtSecret } from "@/lib/env";
import { resolvePerson360, type Person360Resolved } from "@/lib/person360";
import { resolvePrimaryVerifiedBusinessOwnership } from "@/lib/directoryOwnership";

export type PersonalizationSession = {
  userId: string;
  email: string;
  accountType: string;
  isAdmin?: boolean;
};

export function getPersonalizationSession(
  req: NextApiRequest,
): PersonalizationSession | null {
  const rawCookies = req.headers.cookie ?? "";
  const { session_token: token } = cookie.parse(rawCookies);
  if (!token) return null;

  try {
    const payload = jwt.verify(token, getJwtSecret()) as {
      userId?: string;
      email?: string;
      accountType?: string;
      isAdmin?: boolean;
    };
    if (!payload?.userId) return null;
    return {
      userId: String(payload.userId),
      email: String(payload.email || ""),
      accountType: String(payload.accountType || ""),
      isAdmin: Boolean(payload.isAdmin),
    };
  } catch {
    return null;
  }
}

/**
 * Resolves Person360 for the session user and confirms the user has an
 * authoritative relationship (owner, verified representative, manager, or
 * seller) to the requested businessId -- or is an admin. Returns null when
 * access should be denied.
 */
export async function authorizeBusinessAccess(
  db: Db,
  session: PersonalizationSession,
  businessId: string,
): Promise<{ person: Person360Resolved; businessId: string } | null> {
  if (!businessId) return null;

  const person = await resolvePerson360(db, {
    userId: session.userId,
    includeBusiness360: false,
  });
  if (!person.ok) return null;

  if (session.isAdmin || person.roles.includes("ADMIN")) {
    return { person, businessId };
  }

  const relationship = person.businessRelationships.find(
    (entry) => entry.businessId === businessId,
  );
  if (!relationship) return null;

  const authoritativeTypes = new Set([
    "OWNER",
    "VERIFIED_REPRESENTATIVE",
    "MANAGER",
    "SELLER",
  ]);
  const hasAccess = relationship.relationshipTypes.some((type) =>
    authoritativeTypes.has(type),
  );
  if (!hasAccess) return null;

  return { person, businessId };
}

/**
 * Resolves which businessId a request should act on: an explicit
 * businessId query param (authorized via authorizeBusinessAccess), or --
 * when omitted -- the session user's own business.
 *
 * BWE has two distinct ways a session can be tied to a business:
 *   1. A person (users._id) who claimed/manages a business via
 *      personBusinessRelationships -- resolved through Person360
 *      ownership, same as src/pages/api/business/profile.ts.
 *   2. An accountType "business" login, which authenticates directly as
 *      a row in the `businesses` collection (see
 *      src/pages/api/auth/login.ts: the JWT userId is that row's own
 *      _id, not a users._id). For this login shape there is no separate
 *      person to look up -- the business *is* the session principal.
 */
export async function resolveRequestedBusinessId(
  db: Db,
  session: PersonalizationSession,
  requestedBusinessId: string,
): Promise<string | null> {
  if (requestedBusinessId) {
    if (
      session.accountType === "business" &&
      requestedBusinessId === session.userId
    ) {
      const business = await db
        .collection("businesses")
        .findOne(
          { _id: new ObjectId(session.userId) },
          { projection: { _id: 1 } },
        );
      return business ? requestedBusinessId : null;
    }
    const authorized = await authorizeBusinessAccess(
      db,
      session,
      requestedBusinessId,
    );
    return authorized ? requestedBusinessId : null;
  }

  if (session.accountType === "business" && ObjectId.isValid(session.userId)) {
    const business = await db
      .collection("businesses")
      .findOne(
        { _id: new ObjectId(session.userId) },
        { projection: { _id: 1 } },
      );
    if (business) return session.userId;
  }

  const ownership = await resolvePrimaryVerifiedBusinessOwnership(
    db,
    session.userId,
  );
  return ownership?.entityId || null;
}
