import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getBlackCardSession } from "@/lib/black-card-member";

const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

type RateState = { count: number; resetAt: number };

function getRateBucket(userId: string): RateState {
  const g = globalThis as any;
  if (!g.__blackCardPhysicalReqRate) g.__blackCardPhysicalReqRate = {};
  const store = g.__blackCardPhysicalReqRate as Record<string, RateState>;

  const now = Date.now();
  const current = store[userId];
  if (!current || now > current.resetAt) {
    const next = { count: 0, resetAt: now + RATE_WINDOW_MS };
    store[userId] = next;
    return next;
  }
  return current;
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

  const rate = getRateBucket(session.userId);
  if (rate.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      ok: false,
      error: "Too many requests. Please try again later.",
      retryAfterSeconds: Math.max(
        1,
        Math.floor((rate.resetAt - Date.now()) / 1000),
      ),
    });
  }

  const nameToPrint = String(req.body?.nameToPrint || "").trim();
  const mailingAddress = req.body?.mailingAddress || {};

  if (!nameToPrint) {
    return res
      .status(400)
      .json({ ok: false, error: "nameToPrint is required" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const card = await db.collection("black_card_cards").findOne(
    { userId: session.userId },
    {
      sort: { createdAt: -1 },
      projection: { _id: 1, memberId: 1, cardType: 1, status: 1 },
    },
  );

  if (!card) {
    return res.status(404).json({ ok: false, error: "No card identity found" });
  }

  if (String(card.status || "inactive") !== "active") {
    return res.status(400).json({
      ok: false,
      error: "Physical card requests require active card status",
    });
  }

  const now = new Date();
  const requestDoc = {
    userId: session.userId,
    cardIdentityId: String(card._id),
    memberId: String(card.memberId || ""),
    cardType: String(card.cardType || "user"),
    nameToPrint,
    mailingAddress: {
      line1: String(mailingAddress?.line1 || "").trim(),
      line2: String(mailingAddress?.line2 || "").trim(),
      city: String(mailingAddress?.city || "").trim(),
      state: String(mailingAddress?.state || "").trim(),
      postalCode: String(mailingAddress?.postalCode || "").trim(),
      country: String(mailingAddress?.country || "").trim(),
    },
    status: "requested",
    fee: {
      feeCents: 0,
      currency: "USD",
      feeStatus: "not_required",
    },
    createdAt: now,
    updatedAt: now,
  };

  const result = await db
    .collection("black_card_physical_requests")
    .insertOne(requestDoc);

  await db.collection("black_card_audit_events").insertOne({
    eventType: "physical_card_requested",
    actorUserId: session.userId,
    actorEmail: session.email,
    requestId: String(result.insertedId),
    memberId: requestDoc.memberId,
    createdAt: now,
  });

  rate.count += 1;

  return res.status(201).json({
    ok: true,
    requestId: String(result.insertedId),
    status: "requested",
  });
}
