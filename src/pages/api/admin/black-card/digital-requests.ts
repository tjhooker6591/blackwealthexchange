import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { ensureBlackCardMembershipAndCard } from "@/lib/black-card-membership";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  if (req.method === "GET") {
    const items = await db
      .collection("black_card_digital_requests")
      .find({})
      .sort({ updatedAt: -1 })
      .limit(200)
      .toArray();
    return res.status(200).json({ ok: true, items });
  }

  if (req.method === "PATCH") {
    const requestId = String(req.body?.requestId || "").trim();
    const action = String(req.body?.action || "").trim();
    if (!ObjectId.isValid(requestId))
      return res.status(400).json({ ok: false, error: "Invalid requestId" });

    const reqDoc: any = await db
      .collection("black_card_digital_requests")
      .findOne({ _id: new ObjectId(requestId) });
    if (!reqDoc)
      return res.status(404).json({ ok: false, error: "Request not found" });

    if (action === "approve") {
      if (reqDoc.status !== "pending") {
        return res.status(409).json({
          ok: false,
          error: `Invalid transition from ${reqDoc.status} to approved`,
        });
      }

      const accountStatus = String(
        reqDoc?.membershipStatusAtRequest?.accountStatus || "unknown",
      );
      if (
        !(
          accountStatus === "premium" ||
          accountStatus === "founding" ||
          accountStatus === "unknown"
        )
      ) {
        return res.status(409).json({
          ok: false,
          error: "Free/basic requests require upgrade before approval",
        });
      }

      const existing = await db.collection("black_card_cards").findOne({
        $or: [{ userId: reqDoc.userId }, { email: reqDoc.email }],
        status: "active",
      });
      if (existing)
        return res
          .status(409)
          .json({ ok: false, error: "User already has an active Black Card" });

      const now = new Date();
      const paidAt = now;
      const planExpiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      const itemId =
        accountStatus === "founding"
          ? "black-card-signature"
          : "black-card-standard";

      const issued = await ensureBlackCardMembershipAndCard({
        db,
        userId: reqDoc.userId,
        email: reqDoc.email,
        stripeSessionId: `admin-approval-${requestId}`,
        paymentIntentId: null,
        itemId,
        paidAt,
        planExpiresAt,
      });

      if (!issued.ok) {
        return res
          .status(500)
          .json({ ok: false, error: "Failed to issue digital card" });
      }

      await db.collection("black_card_digital_requests").updateOne(
        { _id: reqDoc._id },
        {
          $set: {
            status: "approved",
            approvedAt: now,
            approvedBy: admin.email || admin.userId || "admin",
            membershipId: issued.membershipId,
            memberId: issued.memberId,
            publicVerificationId: issued.publicVerificationId,
            updatedAt: now,
          },
        },
      );

      await db.collection("black_card_audit_events").insertOne({
        eventType: "digital_card_approved_and_issued",
        requestId,
        actorAdmin: admin.email || admin.userId || "admin",
        userId: reqDoc.userId,
        email: reqDoc.email,
        membershipId: issued.membershipId,
        memberId: issued.memberId,
        publicVerificationId: issued.publicVerificationId,
        createdAt: now,
      });

      return res.status(200).json({ ok: true, status: "approved", issued });
    }

    if (action === "reject") {
      if (reqDoc.status !== "pending") {
        return res.status(409).json({
          ok: false,
          error: `Invalid transition from ${reqDoc.status} to rejected`,
        });
      }
      const now = new Date();
      await db
        .collection("black_card_digital_requests")
        .updateOne(
          { _id: reqDoc._id },
          { $set: { status: "rejected", updatedAt: now, rejectedAt: now } },
        );
      await db.collection("black_card_audit_events").insertOne({
        eventType: "digital_card_rejected",
        requestId,
        actorAdmin: admin.email || admin.userId || "admin",
        createdAt: now,
      });
      return res.status(200).json({ ok: true, status: "rejected" });
    }

    return res.status(400).json({ ok: false, error: "Unsupported action" });
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ ok: false, error: "Method Not Allowed" });
}
