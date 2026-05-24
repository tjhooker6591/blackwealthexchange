import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getUserFromRequest } from "@/lib/auth";
import {
  consultantProfileCompleteness,
  validateConsultantProfileInput,
} from "@/lib/consultants/profile";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const sessionUserId = String(
      (user as any).id || (user as any).userId || "",
    );
    if (!sessionUserId) return res.status(401).json({ error: "Unauthorized" });
    if (user.accountType === "employer") {
      return res
        .status(403)
        .json({ error: "Employers cannot author consultant profiles." });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const col = db.collection("consultant_profiles");

    if (req.method === "GET") {
      const profile = await col.findOne({ userId: sessionUserId });
      return res.status(200).json({
        ok: true,
        profile: profile
          ? {
              ...profile,
              _id: String(profile._id),
            }
          : null,
      });
    }

    if (req.method === "PATCH") {
      const parsed = validateConsultantProfileInput(req.body || {});
      if (!parsed.ok) {
        return res.status(400).json({
          error: "Profile validation failed",
          validationErrors: parsed.errors,
        });
      }

      const now = new Date();
      const completenessScore = consultantProfileCompleteness(parsed.value);

      await col.updateOne(
        { userId: sessionUserId },
        {
          $set: {
            userId: sessionUserId,
            email: user.email,
            accountType: user.accountType,
            sourceCollection: "consultant_profiles",
            sourceId: sessionUserId,
            name: req.body?.name || user.email.split("@")[0],
            ...parsed.value,
            completenessScore,
            status: "active",
            updatedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
          },
        },
        { upsert: true },
      );

      const updated = await col.findOne({ userId: sessionUserId });
      return res.status(200).json({
        ok: true,
        profile: updated
          ? {
              ...updated,
              _id: String(updated._id),
            }
          : null,
      });
    }

    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error("[api/consultants/profile]", error);
    return res
      .status(500)
      .json({ error: "Failed to process consultant profile" });
  }
}
