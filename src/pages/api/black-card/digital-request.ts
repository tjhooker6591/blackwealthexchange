import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getBlackCardSession } from "@/lib/black-card-member";

type PlanStatus = "free" | "premium" | "founding" | "unknown";

function normalizePlan(user: any): PlanStatus {
  const plan = String(user?.currentPlan || "").toLowerCase();
  if (plan === "premium") return "premium";
  if (plan === "founding") return "founding";
  if (plan === "free") return "free";
  return "unknown";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const session = getBlackCardSession(req);
  if (!session)
    return res.status(401).json({ ok: false, error: "Unauthorized" });

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const now = new Date();

  const userDoc = await db
    .collection("users")
    .findOne(
      ObjectId.isValid(session.userId)
        ? { _id: new ObjectId(session.userId) }
        : { email: session.email },
      {
        projection: {
          _id: 1,
          email: 1,
          fullName: 1,
          currentPlan: 1,
          premiumStatus: 1,
          accountType: 1,
        },
      },
    );

  const email = String(userDoc?.email || session.email || "").toLowerCase();

  const existingActiveCard = await db.collection("black_card_cards").findOne({
    $or: [{ userId: session.userId }, { email }],
    status: "active",
  });
  if (existingActiveCard) {
    return res
      .status(409)
      .json({ ok: false, error: "User already has an active Black Card" });
  }

  const pendingRequest = await db
    .collection("black_card_digital_requests")
    .findOne({
      $or: [{ userId: session.userId }, { email }],
      status: "pending",
    });
  if (pendingRequest) {
    return res
      .status(409)
      .json({ ok: false, error: "A Black Card request is already pending" });
  }

  const accountStatus = normalizePlan(userDoc);
  const requiresUpgrade = accountStatus === "free";

  const requestDoc = {
    requestType: "digital_black_card",
    userId: session.userId,
    email,
    fullName: String(userDoc?.fullName || "").trim() || null,
    accountType: String(userDoc?.accountType || "user"),
    membershipStatusAtRequest: {
      currentPlan: String(userDoc?.currentPlan || "unknown"),
      premiumStatus: String(userDoc?.premiumStatus || "unknown"),
      accountStatus,
      requiresUpgrade,
    },
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };

  const inserted = await db
    .collection("black_card_digital_requests")
    .insertOne(requestDoc);
  await db.collection("black_card_audit_events").insertOne({
    eventType: "digital_card_requested",
    requestId: String(inserted.insertedId),
    actorUserId: session.userId,
    actorEmail: email,
    status: "pending",
    createdAt: now,
  });

  return res.status(201).json({
    ok: true,
    requestId: String(inserted.insertedId),
    status: "pending",
    accountStatus,
    requiresUpgrade,
  });
}
