import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

const INVALID_STATUSES = new Set([
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
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const publicVerificationId = String(req.query.publicId || "").trim();
  if (!publicVerificationId) {
    return res.status(400).json({ ok: false, error: "publicId required" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const card = await db.collection("black_card_cards").findOne(
    { publicVerificationId },
    {
      projection: {
        memberId: 1,
        cardType: 1,
        status: 1,
        digitalStatus: 1,
        updatedAt: 1,
      },
    },
  );

  if (!card) {
    return res.status(404).json({
      ok: true,
      valid: false,
      verdict: "Invalid/Revoked",
      cardType: null,
      status: "invalid",
      lastVerifiedAt: new Date().toISOString(),
    });
  }

  const status = String(
    card.status || card.digitalStatus || "inactive",
  ).toLowerCase();
  const valid = !INVALID_STATUSES.has(status);

  return res.status(200).json({
    ok: true,
    valid,
    verdict: valid ? "Valid Black Card Member" : "Invalid/Revoked",
    cardType: String(card.cardType || "user"),
    status,
    memberRef: card.memberId ? String(card.memberId).slice(-4) : null,
    lastUpdatedAt: card.updatedAt
      ? new Date(card.updatedAt).toISOString()
      : null,
    lastVerifiedAt: new Date().toISOString(),
  });
}
