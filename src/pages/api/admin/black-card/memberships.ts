import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const client = await clientPromise;
  const db = client.db(getMongoDbName());

  const memberships = await db
    .collection("black_card_memberships")
    .find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const cards = await db
    .collection("black_card_cards")
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const byMembership = new Map(cards.map((c: any) => [String(c.membershipId), c]));

  return res.status(200).json({
    ok: true,
    items: memberships.map((m: any) => {
      const card = byMembership.get(String(m._id));
      return {
        membershipId: String(m._id),
        userId: m.userId ? String(m.userId) : null,
        email: m.email || null,
        tier: m.tier || null,
        status: m.status || null,
        productKey: m.productKey || null,
        sourceStripeSessionId: m.sourceStripeSessionId || null,
        sourcePaymentIntentId: m.sourcePaymentIntentId || null,
        cardIdDisplay: card?.cardIdDisplay || null,
        digitalStatus: card?.digitalStatus || null,
        issueVersion: card?.issueVersion || null,
        createdAt: m.createdAt || null,
      };
    }),
    meta: { requestedBy: admin.email || admin.userId || "admin" },
  });
}
