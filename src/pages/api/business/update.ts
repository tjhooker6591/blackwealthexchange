import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  buildObjectIdOrStringFilter,
  parseSessionIdentity,
  resolveVerifiedOwnership,
} from "@/lib/directoryOwnership";
import {
  buildDirectoryProfileUpdate,
  normalizeDirectoryProfileInput,
} from "@/lib/directoryProfileContract";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = parseSessionIdentity(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized: no token" });
  }

  const businessId = String(req.body?.businessId || "").trim();
  if (!businessId) {
    return res.status(400).json({ error: "Business identifier is required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const ownership = await resolveVerifiedOwnership(db, {
      entityType: "business",
      entityId: businessId,
      userId: session.userId,
    });

    if (!ownership) {
      return res
        .status(403)
        .json({ error: "Forbidden: ownership verification required" });
    }

    const update = buildDirectoryProfileUpdate(
      normalizeDirectoryProfileInput(req.body || {}),
    );
    const hasSet = Boolean(
      update.$set && Object.keys(update.$set as Record<string, unknown>).length,
    );
    const hasUnset = Boolean(
      update.$unset &&
      Object.keys(update.$unset as Record<string, unknown>).length,
    );
    if (!hasSet && !hasUnset) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const result = await db.collection("businesses").updateOne(
      buildObjectIdOrStringFilter("_id", ownership.entityId) || {
        _id: ownership.entityId as any,
      },
      update as any,
    );

    if (!result.matchedCount) {
      return res.status(404).json({ error: "Business not found" });
    }

    return res.status(200).json({
      message: "Business updated successfully",
      updatedFieldCount:
        Object.keys((update.$set as Record<string, unknown>) || {}).length +
        Object.keys((update.$unset as Record<string, unknown>) || {}).length,
    });
  } catch (err) {
    console.error("[api/business/update]", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
