import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getUserFromRequest } from "@/lib/auth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    const sessionUserId = String((user as any).id || (user as any).userId || "");
    if (!sessionUserId) return res.status(401).json({ error: "Unauthorized" });
    if (user.accountType === "employer") {
      return res
        .status(403)
        .json({ error: "Employers cannot access consultant inbox." });
    }

    if (req.method !== "GET") {
      res.setHeader("Allow", ["GET"]);
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const profile = await db
      .collection("consultant_profiles")
      .findOne({ userId: sessionUserId });

    const consultantIds = [String(sessionUserId)];
    if (profile?._id) consultantIds.push(String(profile._id));

    const requests = await db
      .collection("employer_consultant_contact_requests")
      .find({ consultantId: { $in: consultantIds } })
      .sort({ createdAt: -1 })
      .limit(200)
      .toArray();

    return res.status(200).json({
      ok: true,
      consultantIds,
      items: requests.map((r: any) => ({
        id: String(r._id),
        consultantId: r.consultantId,
        employerEmail: r.employerEmail || "",
        requestType: r.requestType,
        message: r.message,
        moderationStatus: r.moderationStatus || "clean",
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("[api/consultants/contact-requests]", error);
    return res.status(500).json({ error: "Failed to load consultant inbox" });
  }
}
