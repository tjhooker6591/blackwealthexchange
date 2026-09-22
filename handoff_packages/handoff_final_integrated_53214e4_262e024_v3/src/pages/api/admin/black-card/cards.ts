import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

const ALLOWED_STATUS = new Set([
  "active",
  "inactive",
  "suspended",
  "expired",
  "revoked",
  "replaced",
]);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (req.method === "GET") {
    const q = String(req.query.q || "").trim();
    const cardStatus = String(req.query.cardStatus || "").trim();
    const requestStatus = String(req.query.requestStatus || "").trim();

    const cardFilter: Record<string, unknown> = {};
    if (cardStatus) cardFilter.status = cardStatus;
    if (q) {
      cardFilter.$or = [
        { userId: q },
        { memberId: { $regex: new RegExp(q, "i") } },
        { cardSerial: { $regex: new RegExp(q, "i") } },
        { email: { $regex: new RegExp(q, "i") } },
      ];
    }

    const cards = await db
      .collection("black_card_cards")
      .find(cardFilter)
      .sort({ updatedAt: -1 })
      .limit(200)
      .toArray();

    const memberIds = cards
      .map((c: any) => String(c.memberId || ""))
      .filter(Boolean);
    const requestFilter: Record<string, unknown> = memberIds.length
      ? { memberId: { $in: memberIds } }
      : { _id: { $exists: false } };
    if (requestStatus) requestFilter.status = requestStatus;

    const requests = await db
      .collection("black_card_physical_requests")
      .find(requestFilter)
      .sort({ updatedAt: -1 })
      .toArray();

    const byMember = new Map<string, any>();
    for (const r of requests) {
      const m = String(r.memberId || "");
      if (m && !byMember.has(m)) byMember.set(m, r);
    }

    const membershipsWithEmailEvents = await db
      .collection("black_card_memberships")
      .find(
        { membershipEmailEvents: { $exists: true, $ne: [] } },
        {
          projection: {
            email: 1,
            userId: 1,
            currentPlan: 1,
            blackCardTier: 1,
            membershipEmailEvents: { $slice: -20 },
          },
        },
      )
      .sort({ updatedAt: -1 })
      .limit(200)
      .toArray();

    const membershipEmailEvents = membershipsWithEmailEvents
      .flatMap((m: any) =>
        (Array.isArray(m.membershipEmailEvents)
          ? m.membershipEmailEvents
          : []
        ).map((e: any) => ({
          email: m.email || null,
          userId: m.userId || null,
          plan: e.plan || m.currentPlan || null,
          cardTier: e.cardTier || m.blackCardTier || null,
          type: e.type || null,
          recipient: e.recipient || m.email || null,
          sent: Boolean(e.sent),
          error: e.error || null,
          stripeSessionId: e.stripeSessionId || null,
          paymentIntentId: e.paymentIntentId || null,
          at: e.at || null,
        })),
      )
      .sort((a: any, b: any) => +new Date(b.at || 0) - +new Date(a.at || 0))
      .slice(0, 100);

    const lifecycleFilter = String(req.query.lifecycleFilter || "").trim();
    const lifecycleQuery: any = {};
    if (lifecycleFilter === "pending_review")
      lifecycleQuery.membershipReviewStatus = "pending_review";
    if (lifecycleFilter === "needs_attention")
      lifecycleQuery.membershipReviewStatus = "needs_attention";
    if (lifecycleFilter === "confirmed")
      lifecycleQuery.membershipReviewStatus = {
        $in: ["approved", "corrected", "auto_activated"],
      };
    if (lifecycleFilter === "failed_email")
      lifecycleQuery["membershipEmailEvents.sent"] = false;

    const lifecycleItems = await db
      .collection("black_card_memberships")
      .find(lifecycleQuery, {
        projection: {
          email: 1,
          userId: 1,
          previousPlan: 1,
          currentPlan: 1,
          previousBlackCardTier: 1,
          blackCardTier: 1,
          membershipStatus: 1,
          lastPaymentSessionId: 1,
          lastPaymentIntentId: 1,
          sourceStripeSessionId: 1,
          sourcePaymentIntentId: 1,
          lastMembershipEventType: 1,
          membershipReviewStatus: 1,
          membershipReviewNotes: { $slice: -5 },
          reviewedBy: 1,
          reviewedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          membershipEvents: { $slice: -10 },
          membershipEmailEvents: { $slice: -5 },
        },
      })
      .sort({ updatedAt: -1 })
      .limit(300)
      .toArray();

    return res.status(200).json({
      ok: true,
      items: cards.map((c: any) => ({
        cardId: String(c._id),
        userId: c.userId || null,
        email: c.email || null,
        memberId: c.memberId || null,
        cardSerial: c.cardSerial || null,
        cardType: c.cardType || "user",
        cardStatus: c.status || c.digitalStatus || "inactive",
        publicVerificationId: c.publicVerificationId || null,
        physicalRequestStatus:
          byMember.get(String(c.memberId || ""))?.status || null,
        createdAt: c.createdAt || null,
        updatedAt: c.updatedAt || c.createdAt || null,
      })),
      lifecycleItems,
      membershipEmailEvents,
      meta: { requestedBy: admin.email || admin.userId || "admin" },
    });
  }

  if (req.method === "PATCH") {
    const action = String(req.body?.action || "").trim();

    if (action === "review_membership") {
      const membershipId = String(req.body?.membershipId || "").trim();
      const reviewStatus = String(req.body?.reviewStatus || "").trim();
      const note = String(req.body?.note || "").trim();
      const allowed = new Set([
        "auto_activated",
        "pending_review",
        "approved",
        "rejected",
        "needs_attention",
        "corrected",
      ]);
      if (!ObjectId.isValid(membershipId) || !allowed.has(reviewStatus)) {
        return res
          .status(400)
          .json({ ok: false, error: "Invalid membership review input" });
      }
      const now = new Date();
      await db
        .collection("black_card_memberships")
        .updateOne({ _id: new ObjectId(membershipId) }, {
          $set: {
            membershipReviewStatus: reviewStatus,
            reviewedBy: admin.email || admin.userId || "admin",
            reviewedAt: now,
            updatedAt: now,
          },
          ...(note
            ? {
                $push: {
                  membershipReviewNotes: {
                    at: now,
                    by: admin.email || admin.userId || "admin",
                    note,
                    status: reviewStatus,
                  },
                },
              }
            : {}),
        } as any);
      return res.status(200).json({ ok: true });
    }

    const cardId = String(req.body?.cardId || "").trim();

    if (!ObjectId.isValid(cardId)) {
      return res.status(400).json({ ok: false, error: "Invalid cardId" });
    }

    const card = await db
      .collection("black_card_cards")
      .findOne({ _id: new ObjectId(cardId) });

    if (!card)
      return res.status(404).json({ ok: false, error: "Card not found" });

    const now = new Date();

    if (action === "activate" || action === "suspend" || action === "revoke") {
      const nextStatus =
        action === "activate"
          ? "active"
          : action === "suspend"
            ? "suspended"
            : "revoked";
      await db.collection("black_card_cards").updateOne(
        { _id: card._id },
        {
          $set: {
            status: nextStatus,
            digitalStatus: nextStatus,
            updatedAt: now,
          },
        },
      );

      await db.collection("black_card_audit_events").insertOne({
        eventType: `card_${action}`,
        cardId,
        memberId: card.memberId || null,
        actorAdmin: admin.email || admin.userId || "admin",
        createdAt: now,
      });

      return res.status(200).json({ ok: true, cardStatus: nextStatus });
    }

    if (action === "replace") {
      const nextStatus = "replaced";
      await db.collection("black_card_cards").updateOne(
        { _id: card._id },
        {
          $set: {
            status: nextStatus,
            digitalStatus: nextStatus,
            updatedAt: now,
          },
        },
      );

      await db.collection("black_card_audit_events").insertOne({
        eventType: "card_replace_marked",
        cardId,
        memberId: card.memberId || null,
        actorAdmin: admin.email || admin.userId || "admin",
        createdAt: now,
      });

      return res.status(200).json({ ok: true, cardStatus: nextStatus });
    }

    if (action === "set_status") {
      const status = String(req.body?.status || "")
        .trim()
        .toLowerCase();
      if (!ALLOWED_STATUS.has(status)) {
        return res.status(400).json({ ok: false, error: "Invalid status" });
      }
      await db
        .collection("black_card_cards")
        .updateOne(
          { _id: card._id },
          { $set: { status, digitalStatus: status, updatedAt: now } },
        );
      return res.status(200).json({ ok: true, cardStatus: status });
    }

    return res.status(400).json({ ok: false, error: "Unsupported action" });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
