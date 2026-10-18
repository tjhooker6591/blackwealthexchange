// src/pages/api/business/profile-viewers.ts
//
// "Who viewed your business" for the signed-in owner.
//   - Claimed listing (verified ownership): counts + named viewers.
//   - Unclaimed listing (the business account itself): counts only, plus
//     the link to claim. Names stay locked until the listing is claimed.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  buildObjectIdOrStringFilter,
  listVerifiedBusinessOwnerships,
  parseSessionIdentity,
  resolveVerifiedOwnership,
} from "@/lib/directoryOwnership";
import { getProfileViewSummary } from "@/lib/profileViews";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  res.setHeader("Cache-Control", "private, no-store");

  const session = parseSessionIdentity(req);
  if (!session) {
    return res.status(401).json({ ok: false, error: "Sign in required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const requested = String(req.query.businessId || "").trim();

    let businessId = "";
    let claimed = false;

    if (requested) {
      const ownership = await resolveVerifiedOwnership(db, {
        entityType: "business",
        entityId: requested,
        userId: session.userId,
      });
      if (ownership) {
        businessId = ownership.entityId;
        claimed = true;
      } else if (requested === session.userId) {
        businessId = requested;
      } else {
        return res.status(403).json({ ok: false, error: "Not your business" });
      }
    } else {
      const ownerships = await listVerifiedBusinessOwnerships(
        db,
        session.userId,
      );
      if (ownerships[0]) {
        businessId = ownerships[0].entityId;
        claimed = true;
      } else if (session.accountType === "business") {
        businessId = session.userId;
      }
    }

    if (!businessId) {
      return res.status(404).json({ ok: false, error: "No business found" });
    }

    const business = await db.collection("businesses").findOne(
      buildObjectIdOrStringFilter("_id", businessId) || {
        _id: businessId as any,
      },
      { projection: { business_name: 1, businessName: 1, title: 1 } },
    );
    if (!business) {
      return res.status(404).json({ ok: false, error: "No business found" });
    }

    const summary = await getProfileViewSummary(db, String(business._id), {
      includeViewers: claimed,
    });

    return res.status(200).json({
      ok: true,
      businessId: String(business._id),
      businessName:
        (business as any).business_name ||
        (business as any).businessName ||
        (business as any).title ||
        "Your business",
      claimed,
      claimUrl: claimed
        ? null
        : `/founding-membership?businessId=${encodeURIComponent(String(business._id))}`,
      summary,
    });
  } catch (err) {
    console.error("[api/business/profile-viewers] error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
