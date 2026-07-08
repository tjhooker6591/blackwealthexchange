import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  FOUNDING_MEMBERSHIP_NAME,
  FOUNDING_MEMBERSHIP_PILOT_LIMIT,
  FOUNDING_MEMBERSHIP_PRICE_CENTS,
  getClaimablePublicBusinesses,
  countActiveFoundingMemberships,
} from "@/lib/founding-membership";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const [businesses, activeCount] = await Promise.all([
      getClaimablePublicBusinesses(db, 40),
      countActiveFoundingMemberships(db),
    ]);

    const remainingSlots = Math.max(
      0,
      FOUNDING_MEMBERSHIP_PILOT_LIMIT - activeCount,
    );

    return res.status(200).json({
      ok: true,
      offer: {
        name: FOUNDING_MEMBERSHIP_NAME,
        amountCents: FOUNDING_MEMBERSHIP_PRICE_CENTS,
        currency: "usd",
        billing: "monthly",
        pilotLimit: FOUNDING_MEMBERSHIP_PILOT_LIMIT,
        activeCount,
        remainingSlots,
      },
      businesses,
    });
  } catch (error) {
    console.error("[founding-membership/options]", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
