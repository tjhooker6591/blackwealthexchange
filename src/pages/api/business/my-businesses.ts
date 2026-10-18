// src/pages/api/business/my-businesses.ts
//
// Every business the signed-in account can manage, for the Business
// Workspace switcher and the member dashboard's "Your businesses" panel:
//   - verified (claimed) ownerships, whatever the account type, and
//   - for a business account, its own business record.
// The workspace's data APIs re-check ownership themselves; this list only
// drives navigation.

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  buildObjectIdOrStringFilter,
  listVerifiedBusinessOwnerships,
  parseSessionIdentity,
} from "@/lib/directoryOwnership";

export type MyBusiness = { id: string; name: string; claimed: boolean };

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

    const ownerships = await listVerifiedBusinessOwnerships(db, session.userId);
    const ids = ownerships.map((o) => o.entityId);
    const claimedIds = new Set(ids);
    if (session.accountType === "business" && !claimedIds.has(session.userId)) {
      ids.unshift(session.userId);
    }

    const filters = ids
      .map((id) => buildObjectIdOrStringFilter("_id", id))
      .filter(Boolean) as any[];
    const docs = filters.length
      ? await db
          .collection("businesses")
          .find(
            { $or: filters },
            { projection: { business_name: 1, businessName: 1, title: 1 } },
          )
          .toArray()
      : [];

    const businesses: MyBusiness[] = ids
      .map((id) => {
        const doc: any = docs.find((d) => String(d._id) === id);
        if (!doc) return null;
        return {
          id,
          name:
            doc.business_name || doc.businessName || doc.title || "Business",
          claimed: claimedIds.has(id),
        };
      })
      .filter((b): b is MyBusiness => Boolean(b));

    return res.status(200).json({ ok: true, businesses });
  } catch (err) {
    console.error("[api/business/my-businesses] error:", err);
    return res.status(500).json({ ok: false, error: "Internal server error" });
  }
}
