import { ObjectId, type Db } from "mongodb";
import {
  BLACK_CARD_TIER_BY_ITEM_ID,
  type BlackCardTier,
} from "@/lib/black-card";
import {
  generateCardSerial,
  generateMemberId,
  generatePublicVerificationId,
  mapAccountTypeToCardType,
} from "@/lib/black-card-identity";

function pad(n: number, width = 6) {
  return String(n).padStart(width, "0");
}

function tierCode(tier: BlackCardTier) {
  if (tier === "standard") return "STD";
  if (tier === "signature") return "SIG";
  return "ELT";
}

async function allocateCardSequence(
  db: Db,
  tier: BlackCardTier,
  issuedAt: Date,
) {
  const year = issuedAt.getUTCFullYear();
  const scope = `black_card_id_${year}_${tier}`;
  const seq = await db.collection("black_card_sequences").findOneAndUpdate(
    { scope },
    {
      $inc: { nextValue: 1 },
      $setOnInsert: { scope, createdAt: issuedAt },
      $set: { updatedAt: issuedAt },
    },
    { upsert: true, returnDocument: "after" },
  );

  const value = Number(seq?.nextValue || 1);
  const canonical = `bwe-bc-${tierCode(tier).toLowerCase()}-${year}-${pad(value)}`;
  const checksum = Buffer.from(canonical)
    .toString("base64url")
    .slice(0, 2)
    .toUpperCase();
  const display = `BWE-BC-${tierCode(tier)}-${year}-${pad(value)}-${checksum}`;

  return { canonical, display, sequenceValue: value, scope };
}

export async function ensureBlackCardMembershipAndCard(params: {
  db: Db;
  userId?: string | null;
  email?: string | null;
  stripeSessionId: string;
  paymentIntentId?: string | null;
  itemId: string;
  paidAt: Date;
  planExpiresAt: Date;
}) {
  const {
    db,
    userId,
    email,
    stripeSessionId,
    paymentIntentId,
    itemId,
    paidAt,
    planExpiresAt,
  } = params;
  const tier = BLACK_CARD_TIER_BY_ITEM_ID[itemId];
  if (!tier) return { ok: false, reason: "NON_BLACK_CARD_ITEM" as const };

  const now = new Date();
  const membershipCollection = db.collection("black_card_memberships");

  const userAccountType = email
    ? await db
        .collection("users")
        .findOne({ email }, { projection: { accountType: 1 } })
    : null;
  const cardType = mapAccountTypeToCardType(
    String(userAccountType?.accountType || "user"),
  );

  const planForTier = tier === "signature" ? "founding" : tier === "standard" ? "premium" : "unknown";
  const priorUser = email
    ? await db.collection("users").findOne({ email }, { projection: { currentPlan: 1, blackCardTier: 1, blackCardStatus: 1 } })
    : null;

  const membership = await membershipCollection.findOneAndUpdate(
    { sourceStripeSessionId: stripeSessionId },
    {
      $setOnInsert: {
        userId: userId || null,
        email: email || null,
        productKey: "bwe_black_card",
        tier,
        status: "active",
        memberSince: paidAt,
        activatedAt: paidAt,
        upgradedAt: planForTier === "founding" ? paidAt : null,
        previousPlan: String((priorUser as any)?.currentPlan || "free"),
        previousBlackCardTier: String((priorUser as any)?.blackCardTier || "none"),
        currentPlan: planForTier,
        blackCardTier: tier,
        membershipStatus: "active",
        lastMembershipEventType: "membership_activated",
        planExpiresAt,
        sourceStripeSessionId: stripeSessionId,
        sourcePaymentIntentId: paymentIntentId || null,
        createdAt: now,
      },
      $set: {
        updatedAt: now,
        tier,
        currentPlan: planForTier,
        blackCardTier: tier,
        membershipStatus: "active",
        lastMembershipEventType:
          String((priorUser as any)?.blackCardTier || "") !== tier
            ? "membership_upgraded"
            : "membership_renewed",
        upgradedAt:
          String((priorUser as any)?.blackCardTier || "") !== tier && planForTier === "founding"
            ? paidAt
            : null,
        sourceStripeSessionId: stripeSessionId,
        sourcePaymentIntentId: paymentIntentId || null,
      },
      $push: {
        membershipEvents: {
          at: now,
          eventType:
            String((priorUser as any)?.blackCardTier || "") !== tier
              ? "membership_upgraded"
              : "membership_activated",
          previousPlan: String((priorUser as any)?.currentPlan || "free"),
          currentPlan: planForTier,
          previousBlackCardTier: String((priorUser as any)?.blackCardTier || "none"),
          blackCardTier: tier,
          stripeSessionId,
          paymentIntentId: paymentIntentId || null,
        },
      },
    },
    { upsert: true, returnDocument: "after" },
  );

  if (!membership?._id)
    return { ok: false, reason: "MEMBERSHIP_UPSERT_FAILED" as const };

  const cardCollection = db.collection("black_card_cards");
  let card = await cardCollection.findOne({
    membershipId: String(membership._id),
    issueVersion: 1,
  });
  if (!card) {
    const seq = await allocateCardSequence(db, tier, paidAt);
    const memberId = await generateMemberId(db, cardType);
    const cardSerial = await generateCardSerial(db);
    const publicVerificationId = generatePublicVerificationId();

    await cardCollection.insertOne({
      membershipId: String(membership._id),
      userId: userId || null,
      email: email || null,
      cardIdCanonical: seq.canonical,
      cardIdDisplay: seq.display,
      memberId,
      cardSerial,
      publicVerificationId,
      cardType,
      status: "active",
      tierAtIssue: tier,
      issueVersion: 1,
      digitalStatus: "active",
      issuedAt: paidAt,
      createdAt: now,
      updatedAt: now,
    });
    card = await cardCollection.findOne({
      membershipId: String(membership._id),
      issueVersion: 1,
    });
  } else {
    const patch: Record<string, unknown> = {};
    if (!card.memberId) patch.memberId = await generateMemberId(db, cardType);
    if (!card.cardSerial) patch.cardSerial = await generateCardSerial(db);
    if (!card.publicVerificationId)
      patch.publicVerificationId = generatePublicVerificationId();
    if (!card.cardType) patch.cardType = cardType;
    if (!card.status) patch.status = "active";
    if (Object.keys(patch).length > 0) {
      patch.updatedAt = now;
      await cardCollection.updateOne({ _id: card._id }, { $set: patch });
      card = await cardCollection.findOne({ _id: card._id });
    }
  }

  // users mirror (fast runtime)
  const mirrorPatch = {
    blackCardProductKey: "bwe_black_card",
    blackCardTier: tier,
    blackCardStatus: "active",
    blackCardMemberSince: paidAt,
    blackCardPlanExpiresAt: planExpiresAt,
    blackCardStripeSessionId: stripeSessionId,
    blackCardPaymentIntentId: paymentIntentId || null,
    blackCardRewardsBalance: 0,
    previousPlan: String((priorUser as any)?.currentPlan || "free"),
    currentPlan: planForTier,
    previousBlackCardTier: String((priorUser as any)?.blackCardTier || "none"),
    blackCardTier: tier,
    membershipStatus: "active",
    activatedAt: paidAt,
    upgradedAt:
      String((priorUser as any)?.blackCardTier || "") !== tier && planForTier === "founding"
        ? paidAt
        : null,
    lastPaymentSessionId: stripeSessionId,
    lastPaymentIntentId: paymentIntentId || null,
    lastMembershipEventType:
      String((priorUser as any)?.blackCardTier || "") !== tier
        ? "membership_upgraded"
        : "membership_activated",
    updatedAt: now,
  };

  if (userId && ObjectId.isValid(userId)) {
    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(userId) }, { $set: mirrorPatch });
  }
  if (email) {
    await db.collection("users").updateOne({ email }, { $set: mirrorPatch });
  }

  return {
    ok: true,
    tier,
    membershipId: String(membership._id),
    cardIdDisplay: card?.cardIdDisplay || null,
    memberId: card?.memberId || null,
    publicVerificationId: card?.publicVerificationId || null,
    sourceStripeSessionId: stripeSessionId,
    sourcePaymentIntentId: paymentIntentId || null,
  };
}
