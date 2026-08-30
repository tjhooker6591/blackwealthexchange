import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  buildObjectIdOrStringFilter,
  parseSessionIdentity,
  resolvePrimaryVerifiedBusinessOwnership,
  resolveVerifiedOwnership,
} from "@/lib/directoryOwnership";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = parseSessionIdentity(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized: no token" });
  }

  const requestedBusinessId = String(
    req.query.businessId || req.query.id || "",
  ).trim();

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const ownership = requestedBusinessId
      ? await resolveVerifiedOwnership(db, {
          entityType: "business",
          entityId: requestedBusinessId,
          userId: session.userId,
        })
      : await resolvePrimaryVerifiedBusinessOwnership(db, session.userId);

    if (!ownership) {
      return res
        .status(403)
        .json({ error: "Forbidden: ownership verification required" });
    }

    const business = await db.collection("businesses").findOne(
      buildObjectIdOrStringFilter("_id", ownership.entityId) || {
        _id: ownership.entityId as any,
      },
    );

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    return res.status(200).json({
      business: mapDirectoryProfileFromDoc(business),
    });
  } catch (error) {
    console.error("[api/business/profile]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
