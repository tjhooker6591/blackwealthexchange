// src/pages/api/business/owner-contact.ts
//
// Phase 5 -- BWE Inbox. Resolves the messageable owner userId for a
// business (if any verified owner exists) so the business profile page can
// offer a real "Message this business" link into /inbox. Does not expose
// email or any other contact detail -- only a userId to message.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { buildIdFilter, s } from "@/lib/network/shared";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const businessId = s(req.query.businessId as string);
  if (!businessId) {
    return res.status(400).json({ error: "businessId is required" });
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const business = await db
    .collection("businesses")
    .findOne(buildIdFilter("_id", businessId) as any, {
      projection: { claimedByUserId: 1, managedByUserId: 1 },
    });

  const ownerUserId =
    s((business as any)?.claimedByUserId) ||
    s((business as any)?.managedByUserId) ||
    null;

  return res.status(200).json({ ownerUserId });
}
