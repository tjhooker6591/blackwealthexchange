import type { NextApiRequest } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

const COURSE_IDS = [
  "financial-literacy-premium",
  "personal-finance-101",
] as const;

type SessionPayload = {
  userId?: string;
  id?: string;
  email?: string;
};

export type CourseAccessResult = {
  ok: boolean;
  authenticated: boolean;
  hasAccess: boolean;
  userId?: string;
  email?: string;
  reason?: string;
};

function getSession(req: NextApiRequest): SessionPayload | null {
  const parsed = cookie.parse(req.headers.cookie || "");
  const token = parsed.session_token || req.cookies?.session_token;
  if (!token) return null;

  try {
    return jwt.verify(token, getJwtSecret()) as SessionPayload;
  } catch {
    return null;
  }
}

export async function resolvePremiumCourseAccess(
  req: NextApiRequest,
): Promise<CourseAccessResult> {
  const session = getSession(req);
  if (!session?.email) {
    return {
      ok: true,
      authenticated: false,
      hasAccess: false,
      reason: "login_required",
    };
  }

  const userId = String(session.userId || session.id || "").trim();
  const email = String(session.email || "")
    .trim()
    .toLowerCase();

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const user = await db
    .collection("users")
    .findOne(
      ObjectId.isValid(userId) ? { _id: new ObjectId(userId) } : { email },
      {
        projection: {
          _id: 1,
          email: 1,
          purchasedCourses: 1,
          isPremium: 1,
          premiumStatus: 1,
          currentPlan: 1,
        },
      },
    );

  if (!user) {
    return {
      ok: true,
      authenticated: true,
      hasAccess: false,
      userId,
      email,
      reason: "user_not_found",
    };
  }

  const resolvedUserId = String(user._id);
  const normalizedPlan = String(user.currentPlan || "").toLowerCase();
  const premiumActive =
    user.isPremium === true ||
    normalizedPlan === "premium" ||
    normalizedPlan === "founding" ||
    String(user.premiumStatus || "").toLowerCase() === "active";

  if (premiumActive) {
    return {
      ok: true,
      authenticated: true,
      hasAccess: true,
      userId: resolvedUserId,
      email,
      reason: "premium_active",
    };
  }

  const enrollment = await db.collection("enrollments").findOne(
    {
      userId: resolvedUserId,
      courseId: { $in: [...COURSE_IDS] },
      entitlementStatus: { $in: ["granted", "active"] },
      accessStatus: { $in: ["active", null] },
    },
    { projection: { _id: 1 } },
  );

  if (enrollment) {
    return {
      ok: true,
      authenticated: true,
      hasAccess: true,
      userId: resolvedUserId,
      email,
      reason: "enrollment_granted",
    };
  }

  const purchased = Array.isArray((user as any).purchasedCourses)
    ? ((user as any).purchasedCourses as unknown[]).map((v) => String(v))
    : [];
  if (purchased.some((id) => COURSE_IDS.includes(id as any))) {
    return {
      ok: true,
      authenticated: true,
      hasAccess: true,
      userId: resolvedUserId,
      email,
      reason: "user_purchased_courses",
    };
  }

  return {
    ok: true,
    authenticated: true,
    hasAccess: false,
    userId: resolvedUserId,
    email,
    reason: "no_entitlement",
  };
}
