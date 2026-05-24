import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

interface JwtPayload {
  userId: string;
  email: string;
  accountType?: string;
  isAdmin?: boolean;
  role?: string;
  roles?: string[];
  tokenVersion?: number;
}

interface UserProfile {
  _id: ObjectId;
  email: string;
  accountType?: string;
  fullName?: string;
  businessName?: string;
  businessAddress?: string;
  businessPhone?: string;
  createdAt?: Date;
  updatedAt?: Date;
  password?: string;
  isPremium?: boolean;
  isAdmin?: boolean;
  role?: string;
  roles?: string[];
  currentPlan?: string;
  premiumStatus?: string;
  premiumActivatedAt?: Date | null;
  blackCardTier?: string;
  blackCardStatus?: string;
  blackCardMemberSince?: Date | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  subscriptionStatus?: string | null;
  subscriptionCurrentPeriodStart?: Date | null;
  subscriptionCurrentPeriodEnd?: Date | null;
  subscriptionCancelAtPeriodEnd?: boolean;
  nextBillingDate?: Date | null;
  renewalStatus?: string | null;
  tokenVersion?: number;
  [key: string]: unknown;
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isAdminPayload(payload: {
  accountType?: string;
  isAdmin?: boolean;
  role?: string;
  roles?: string[];
}) {
  return (
    payload.isAdmin === true ||
    payload.accountType === "admin" ||
    payload.role === "admin" ||
    (Array.isArray(payload.roles) && payload.roles.includes("admin"))
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store");

  const startedAt = Date.now();
  try {
    const raw = req.headers.cookie || "";
    const cookieNames = Object.keys(cookie.parse(raw));
    const cookies = cookie.parse(raw);
    const token = cookies.session_token;

    if (!token) {
      return res.status(200).json({ user: null });
    }

    let secret: string;
    try {
      secret = getJwtSecret();
    } catch {
      return res.status(500).json({
        user: null,
        error: "Server auth configuration is missing required secrets.",
      });
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, secret) as JwtPayload;
    } catch (err) {
      console.error("[/api/auth/me] JWT verification failed:", err);
      return res.status(200).json({ user: null });
    }

    const role = payload.accountType || "user";
    console.info("[auth/me] token_ok", {
      host: String(req.headers.host || ""),
      proto: String(req.headers["x-forwarded-proto"] || ""),
      cookieNames,
      tokenRole: role,
      email: payload.email,
    });

    const emailNorm = String(payload.email || "")
      .trim()
      .toLowerCase();

    const orderedCollections =
      role === "seller"
        ? ["sellers", "users", "businesses", "employers"]
        : role === "employer"
          ? ["employers", "users", "businesses", "sellers"]
          : role === "business"
            ? ["businesses", "users", "sellers", "employers"]
            : ["users", "businesses", "sellers", "employers"];

    const mongoStart = Date.now();
    const client = await clientPromise;
    const mongoConnectMs = Date.now() - mongoStart;
    const db = client.db(getMongoDbName());

    const queryStart = Date.now();
    let profile: UserProfile | null = null;
    for (const collName of orderedCollections) {
      profile = await db
        .collection<UserProfile>(collName)
        .findOne({ email: emailNorm });
      if (!profile) {
        profile = await db.collection<UserProfile>(collName).findOne({
          email: { $regex: `^${escapeRegex(emailNorm)}$`, $options: "i" },
        } as any);
      }
      if (!profile) {
        profile = await db
          .collection<UserProfile>(collName)
          .findOne({ ownerEmail: emailNorm } as any);
      }
      if (!profile) {
        profile = await db.collection<UserProfile>(collName).findOne({
          ownerEmail: {
            $regex: `^${escapeRegex(emailNorm)}$`,
            $options: "i",
          },
        } as any);
      }
      if (!profile) {
        profile = await db
          .collection<UserProfile>(collName)
          .findOne({ business_email: emailNorm } as any);
      }
      if (!profile) {
        profile = await db.collection<UserProfile>(collName).findOne({
          business_email: {
            $regex: `^${escapeRegex(emailNorm)}$`,
            $options: "i",
          },
        } as any);
      }
      if (profile) break;
    }

    const mongoQueryMs = Date.now() - queryStart;
    if (process.env.NODE_ENV !== "production") {
      res.setHeader(
        "Server-Timing",
        `mongo_connect;dur=${mongoConnectMs}, mongo_query;dur=${mongoQueryMs}, total;dur=${Date.now() - startedAt}`,
      );
      console.info(
        `[timing][api/auth/me] total=${Date.now() - startedAt}ms connect=${mongoConnectMs}ms query=${mongoQueryMs}ms role=${role}`,
      );
    }

    if (!profile) {
      console.info("[auth/me] profile_not_found", {
        email: payload.email,
        tokenRole: role,
      });
      return res.status(200).json({ user: null });
    }

    const currentTokenVersion =
      typeof profile.tokenVersion === "number" &&
      Number.isFinite(profile.tokenVersion)
        ? profile.tokenVersion
        : 0;
    const incomingTokenVersion =
      typeof payload.tokenVersion === "number" &&
      Number.isFinite(payload.tokenVersion)
        ? payload.tokenVersion
        : 0;

    if (incomingTokenVersion !== currentTokenVersion) {
      return res.status(200).json({ user: null });
    }

    const canonicalIdentity = await db
      .collection<UserProfile>("users")
      .findOne({ email: payload.email }, { projection: { isAdmin: 1 } });

    const isAdmin =
      canonicalIdentity?.isAdmin === true ||
      profile.isAdmin === true ||
      isAdminPayload(payload);

    const { password: _password, ...sanitized } = profile;

    const normalizedAccountType =
      typeof profile.accountType === "string" && profile.accountType.trim()
        ? profile.accountType
        : role;

    const normalizedCurrentPlan =
      typeof profile.currentPlan === "string" && profile.currentPlan.trim()
        ? profile.currentPlan.toLowerCase()
        : profile.isPremium === true
          ? "premium"
          : "free";

    const normalizedPremiumStatus =
      typeof profile.premiumStatus === "string" && profile.premiumStatus.trim()
        ? profile.premiumStatus.toLowerCase()
        : normalizedCurrentPlan === "premium" ||
            normalizedCurrentPlan === "founding" ||
            profile.isPremium === true
          ? "active"
          : "inactive";

    const normalizedIsPremium =
      profile.isPremium === true ||
      normalizedCurrentPlan === "premium" ||
      normalizedCurrentPlan === "founding" ||
      normalizedPremiumStatus === "active";

    const normalizedBlackCardTier =
      typeof profile.blackCardTier === "string" ? profile.blackCardTier : null;

    const rawBlackCardStatus =
      typeof profile.blackCardStatus === "string"
        ? profile.blackCardStatus.toLowerCase()
        : "inactive";

    const rawBlackCardPlanExpiresAt = profile.blackCardPlanExpiresAt;
    const blackCardPlanExpiresAt =
      rawBlackCardPlanExpiresAt instanceof Date
        ? rawBlackCardPlanExpiresAt
        : typeof rawBlackCardPlanExpiresAt === "string" ||
            typeof rawBlackCardPlanExpiresAt === "number"
          ? new Date(rawBlackCardPlanExpiresAt)
          : null;

    const blackCardExpired =
      !!blackCardPlanExpiresAt &&
      Number.isFinite(blackCardPlanExpiresAt.getTime()) &&
      blackCardPlanExpiresAt.getTime() <= Date.now();

    const normalizedBlackCardStatus = blackCardExpired
      ? "inactive"
      : rawBlackCardStatus;

    console.info("[auth/me] success", {
      email: payload.email,
      tokenRole: role,
      normalizedAccountType,
      isAdmin,
    });
    return res.status(200).json({
      user: {
        ...sanitized,
        id: payload.userId,
        email: payload.email,
        accountType: normalizedAccountType,
        isAdmin,
        isPremium: normalizedIsPremium,
        currentPlan: normalizedCurrentPlan,
        premiumStatus: normalizedPremiumStatus,
        premiumActivatedAt: profile.premiumActivatedAt ?? null,
        blackCardTier: normalizedBlackCardTier,
        blackCardStatus: normalizedBlackCardStatus,
        blackCardMemberSince: profile.blackCardMemberSince ?? null,
        stripeSubscriptionId: profile.stripeSubscriptionId ?? null,
        stripeCustomerId: profile.stripeCustomerId ?? null,
        subscriptionStatus: profile.subscriptionStatus ?? null,
        subscriptionCurrentPeriodStart:
          profile.subscriptionCurrentPeriodStart ?? null,
        subscriptionCurrentPeriodEnd:
          profile.subscriptionCurrentPeriodEnd ?? null,
        subscriptionCancelAtPeriodEnd:
          profile.subscriptionCancelAtPeriodEnd ?? false,
        nextBillingDate: profile.nextBillingDate ?? null,
        renewalStatus: profile.renewalStatus ?? null,
      },
    });
  } catch (err) {
    console.error("[/api/auth/me] Unexpected error:", err);
    return res
      .status(500)
      .json({ user: null, error: "Internal server error." });
  }
}
