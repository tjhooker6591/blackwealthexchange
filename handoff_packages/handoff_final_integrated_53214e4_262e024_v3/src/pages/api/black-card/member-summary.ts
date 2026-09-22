import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import { getVerificationUrl } from "@/lib/black-card-identity";
import { resolveBlackCardState } from "@/lib/black-card-state";

interface JwtPayload {
  userId: string;
  email: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;

    if (!token) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, getJwtSecret()) as JwtPayload;
    } catch {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const userDoc = await db
      .collection("users")
      .findOne(
        ObjectId.isValid(payload.userId)
          ? { _id: new ObjectId(payload.userId) }
          : { email: payload.email },
        {
          projection: {
            email: 1,
            fullName: 1,
            blackCardTier: 1,
            blackCardStatus: 1,
            blackCardMemberSince: 1,
            blackCardPlanExpiresAt: 1,
            blackCardRewardsBalance: 1,
            currentPlan: 1,
            premiumStatus: 1,
          },
        },
      );

    if (!userDoc) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    const recentActivity = await db
      .collection("flow_events")
      .find({
        userId: payload.userId,
        eventType: { $regex: /^black_card_/i },
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const recentRedemptions = await db
      .collection("black_card_redemptions")
      .find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const ledger = await db
      .collection("black_card_rewards_ledger")
      .find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const membership = await db
      .collection("black_card_memberships")
      .findOne(
        { $or: [{ userId: payload.userId }, { email: payload.email }] },
        { projection: { _id: 1 } },
      );

    const pendingDigitalRequest = await db
      .collection("black_card_digital_requests")
      .findOne(
        {
          $or: [{ userId: payload.userId }, { email: payload.email }],
          status: "pending",
        },
        {
          projection: {
            _id: 1,
            status: 1,
            createdAt: 1,
            membershipStatusAtRequest: 1,
          },
        },
      );

    const cardByMembership = membership
      ? await db.collection("black_card_cards").findOne(
          { membershipId: String(membership._id) },
          {
            sort: { issueVersion: -1, updatedAt: -1, createdAt: -1 },
            projection: {
              cardIdDisplay: 1,
              digitalStatus: 1,
              issueVersion: 1,
              memberId: 1,
              cardSerial: 1,
              cardType: 1,
              status: 1,
              publicVerificationId: 1,
            },
          },
        )
      : null;

    const cardByIdentity = await db.collection("black_card_cards").findOne(
      {
        $or: [{ userId: payload.userId }, { email: payload.email }],
      },
      {
        sort: { status: -1, issueVersion: -1, updatedAt: -1, createdAt: -1 },
        projection: {
          cardIdDisplay: 1,
          digitalStatus: 1,
          issueVersion: 1,
          memberId: 1,
          cardSerial: 1,
          cardType: 1,
          status: 1,
          publicVerificationId: 1,
        },
      },
    );

    const card = cardByMembership || cardByIdentity;

    const now = Date.now();
    const expiresAt = userDoc.blackCardPlanExpiresAt
      ? new Date(userDoc.blackCardPlanExpiresAt).getTime()
      : null;
    const renewalState = !expiresAt
      ? "unknown"
      : expiresAt < now
        ? "expired"
        : expiresAt - now < 1000 * 60 * 60 * 24 * 7
          ? "renewal_due"
          : "active";

    const resolvedState = resolveBlackCardState({
      loggedIn: true,
      currentPlan: String((userDoc as any)?.currentPlan || "unknown"),
      premiumStatus: String((userDoc as any)?.premiumStatus || "unknown"),
      hasPendingRequest: Boolean(pendingDigitalRequest),
      cardStatus: String(
        (card as any)?.status || (card as any)?.digitalStatus || "",
      ),
      hasActiveCardSignal: Boolean(
        card &&
        (String((card as any)?.status || "").toLowerCase() === "active" ||
          (card as any)?.cardIdDisplay),
      ),
    });

    const plan = String(
      (userDoc as any)?.currentPlan || "unknown",
    ).toLowerCase();
    const planName =
      plan === "premium"
        ? "Premium"
        : plan === "founding"
          ? "Founding Member"
          : plan === "free"
            ? "Free"
            : "Unknown";
    const rawTier = String((userDoc as any)?.blackCardTier || "").toLowerCase();
    const tier =
      rawTier === "elite" || rawTier === "signature" || rawTier === "standard"
        ? rawTier
        : plan === "founding"
          ? "signature"
          : "standard";
    const cardTierName =
      tier === "elite"
        ? "Elite Black Card"
        : tier === "signature"
          ? "Signature Black Card"
          : "Standard Black Card";
    const publicVerificationId = card?.publicVerificationId
      ? String(card.publicVerificationId)
      : null;
    const verificationUrl = publicVerificationId
      ? getVerificationUrl(publicVerificationId)
      : null;
    const digitalStatus = String(
      card?.status || card?.digitalStatus || "inactive",
    ).toLowerCase();
    const isResolvedActiveCard = [
      "PREMIUM_ACTIVE_CARD",
      "FOUNDING_ACTIVE_CARD",
      "ACTIVE_CARD_BUT_PLAN_UNKNOWN",
    ].includes(resolvedState);
    const effectiveCardStatus = isResolvedActiveCard
      ? "active"
      : String(
          card?.status ||
            card?.digitalStatus ||
            userDoc.blackCardStatus ||
            "inactive",
        ).toLowerCase();

    const resolvedBlackCard = {
      state: [
        "PREMIUM_ACTIVE_CARD",
        "FOUNDING_ACTIVE_CARD",
        "ACTIVE_CARD_BUT_PLAN_UNKNOWN",
      ].includes(resolvedState)
        ? "ACTIVE_CARD"
        : resolvedState === "SUSPENDED_CARD"
          ? "SUSPENDED_CARD"
          : resolvedState === "REVOKED_CARD"
            ? "REVOKED_CARD"
            : [
                  "PREMIUM_PENDING_REQUEST",
                  "FOUNDING_PENDING_REQUEST",
                  "FREE_PENDING_REQUEST",
                  "DUPLICATE_PENDING_REQUEST",
                ].includes(resolvedState)
              ? "PENDING_REQUEST"
              : ["PREMIUM_NO_REQUEST", "FOUNDING_NO_REQUEST"].includes(
                    resolvedState,
                  )
                ? "ELIGIBLE_NO_REQUEST"
                : resolvedState === "NOT_LOGGED_IN"
                  ? "NOT_LOGGED_IN"
                  : resolvedState === "FREE_NO_REQUEST"
                    ? "FREE_REQUIRES_UPGRADE"
                    : "UNKNOWN",
      planName,
      cardTierName,
      memberId: String(card?.memberId || ""),
      status: effectiveCardStatus,
      digitalStatus: isResolvedActiveCard ? "active" : digitalStatus,
      publicVerificationId,
      verificationUrl,
      primaryMessage: [
        "PREMIUM_ACTIVE_CARD",
        "FOUNDING_ACTIVE_CARD",
        "ACTIVE_CARD_BUT_PLAN_UNKNOWN",
      ].includes(resolvedState)
        ? `Your ${cardTierName} is active`
        : [
              "PREMIUM_PENDING_REQUEST",
              "FOUNDING_PENDING_REQUEST",
              "FREE_PENDING_REQUEST",
              "DUPLICATE_PENDING_REQUEST",
            ].includes(resolvedState)
          ? "Your Black Card request is pending review"
          : ["PREMIUM_NO_REQUEST", "FOUNDING_NO_REQUEST"].includes(
                resolvedState,
              )
            ? `Eligible for ${cardTierName}`
            : "Upgrade to Premium to request your Black Card",
      primaryActionLabel: [
        "PREMIUM_ACTIVE_CARD",
        "FOUNDING_ACTIVE_CARD",
        "ACTIVE_CARD_BUT_PLAN_UNKNOWN",
      ].includes(resolvedState)
        ? "View My Digital Black Card"
        : ["PREMIUM_NO_REQUEST", "FOUNDING_NO_REQUEST"].includes(resolvedState)
          ? "Request Black Card"
          : "View Pricing",
      primaryActionHref: [
        "PREMIUM_ACTIVE_CARD",
        "FOUNDING_ACTIVE_CARD",
        "ACTIVE_CARD_BUT_PLAN_UNKNOWN",
      ].includes(resolvedState)
        ? "/dashboard/black-card"
        : ["PREMIUM_NO_REQUEST", "FOUNDING_NO_REQUEST"].includes(resolvedState)
          ? "/black-card/join"
          : "/pricing",
      phoneGuidanceVisible: [
        "PREMIUM_ACTIVE_CARD",
        "FOUNDING_ACTIVE_CARD",
        "ACTIVE_CARD_BUT_PLAN_UNKNOWN",
      ].includes(resolvedState),
    };

    return res.status(200).json({
      ok: true,
      state: resolvedState,
      resolvedBlackCard,
      plan,
      planName,
      cardTier: tier,
      cardTierName,
      member: {
        fullName: userDoc.fullName || null,
        email: userDoc.email || payload.email,
        tier:
          typeof userDoc.blackCardTier === "string"
            ? userDoc.blackCardTier
            : null,
        status: effectiveCardStatus,
        memberSince: userDoc.blackCardMemberSince || null,
        planExpiresAt: userDoc.blackCardPlanExpiresAt || null,
        renewalState,
      },
      rewards: {
        balance:
          typeof userDoc.blackCardRewardsBalance === "number"
            ? userDoc.blackCardRewardsBalance
            : 0,
      },
      card: card
        ? {
            cardIdDisplay: String(card.cardIdDisplay || ""),
            memberId: String(card.memberId || ""),
            cardSerial: String(card.cardSerial || ""),
            cardType: String(card.cardType || "user"),
            digitalStatus: String(
              card.status || card.digitalStatus || "active",
            ),
            issueVersion: Number(card.issueVersion || 1),
            verificationCode: createHash("sha256")
              .update(
                `${String(card.cardIdDisplay || "")}:${String(userDoc.email || payload.email)}:${String(card.issueVersion || 1)}`,
              )
              .digest("hex")
              .slice(0, 12)
              .toUpperCase(),
            verificationUrl: card.publicVerificationId
              ? getVerificationUrl(String(card.publicVerificationId))
              : null,
            qrPayload: card.publicVerificationId
              ? getVerificationUrl(String(card.publicVerificationId))
              : null,
            walletPassState: "planned",
          }
        : null,
      request: pendingDigitalRequest
        ? {
            id: String(pendingDigitalRequest._id),
            status: String(pendingDigitalRequest.status || "pending"),
            createdAt: pendingDigitalRequest.createdAt || null,
            accountStatus: String(
              pendingDigitalRequest?.membershipStatusAtRequest?.accountStatus ||
                "unknown",
            ),
          }
        : null,
      activity: recentActivity.map((item) => ({
        id: String(item._id),
        type: String(item.eventType || "black_card_activity"),
        at: item.createdAt || null,
      })),
      redemptions: recentRedemptions.map((item) => ({
        id: String(item._id),
        rewardType: String(item.rewardType || "reward"),
        value: typeof item.value === "number" ? item.value : 0,
        status: String(item.status || "pending"),
        at: item.createdAt || null,
      })),
      ledger: ledger.map((item) => ({
        id: String(item._id),
        type: String(item.type || "entry"),
        points: Number(item.points || 0),
        actionType: String(item.actionType || ""),
        rewardType: item.rewardType ? String(item.rewardType) : null,
        balanceAfter: Number(item.balanceAfter || 0),
        at: item.createdAt || null,
      })),
    });
  } catch (error) {
    console.error("GET /api/black-card/member-summary error:", error);
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}
