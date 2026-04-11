import type { NextApiRequest, NextApiResponse } from "next";
import { createHash } from "crypto";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const cardId = String(req.query.cardId || "").trim();
  const code = String(req.query.code || "").trim().toUpperCase();

  if (!cardId || !code) {
    return res.status(400).json({ ok: false, error: "cardId and code required" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const card = await db.collection("black_card_cards").findOne(
    { cardIdDisplay: cardId },
    { projection: { membershipId: 1, issueVersion: 1, cardIdDisplay: 1 } },
  );

  if (!card) return res.status(404).json({ ok: false, verified: false });

  const membershipQuery =
    typeof card.membershipId === "string" && ObjectId.isValid(card.membershipId)
      ? { _id: new ObjectId(card.membershipId) }
      : { _id: card.membershipId as any };

  const membership = await db.collection("black_card_memberships").findOne(
    membershipQuery,
    { projection: { email: 1, tier: 1, status: 1 } },
  );

  if (!membership) return res.status(404).json({ ok: false, verified: false });

  const expectedCode = createHash("sha256")
    .update(
      `${String(card.cardIdDisplay || "")}:${String(membership.email || "")}:${String(card.issueVersion || 1)}`,
    )
    .digest("hex")
    .slice(0, 12)
    .toUpperCase();

  const verified = expectedCode === code;

  return res.status(200).json({
    ok: true,
    verified,
    card: {
      cardIdDisplay: String(card.cardIdDisplay || ""),
      issueVersion: Number(card.issueVersion || 1),
      tier: String(membership.tier || ""),
      status: String(membership.status || "inactive"),
    },
  });
}
