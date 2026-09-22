import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { FOUNDING_MEMBERSHIP_PRODUCT_KEY } from "@/lib/founding-membership";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const [memberships, claims, reviews, fulfillment] = await Promise.all([
      db
        .collection("business_memberships")
        .find({ productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(100)
        .toArray(),
      db
        .collection("business_claims")
        .find({ productKey: FOUNDING_MEMBERSHIP_PRODUCT_KEY })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(100)
        .toArray(),
      db
        .collection("ownership_reviews")
        .find({
          sourceMembershipId: {
            $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:`,
          },
        })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(100)
        .toArray(),
      db
        .collection("membership_fulfillment")
        .find({
          membershipId: { $regex: `^${FOUNDING_MEMBERSHIP_PRODUCT_KEY}:` },
        })
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(100)
        .toArray(),
    ]);

    return res.status(200).json({
      ok: true,
      memberships,
      claims,
      reviews,
      fulfillment,
    });
  } catch (error) {
    console.error("[admin/founding-memberships]", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
