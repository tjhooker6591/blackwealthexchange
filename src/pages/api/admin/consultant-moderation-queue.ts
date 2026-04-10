import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const reason =
      typeof req.query.reason === "string" ? req.query.reason.trim() : "";

    const filter: Record<string, unknown> = {
      eventType: {
        $in: [
          "consultant_contact_request_blocked",
          "consultant_contact_request_flagged",
        ],
      },
    };

    if (reason) filter.moderationReasons = reason;

    const items = await db.collection("flow_events").find(filter)
      .sort({ createdAt: -1 })
      .limit(300)
      .toArray();

    return res.status(200).json({
      ok: true,
      items: items.map((x: any) => ({
        id: String(x._id),
        eventType: String(x.eventType || ""),
        consultantId: String(x.consultantId || ""),
        employerId: String(x.employerId || ""),
        moderationReasons: Array.isArray(x.moderationReasons)
          ? x.moderationReasons
          : [],
        source: String(x.source || ""),
        sourceVariant: String(x.source_variant || ""),
        pageRoute: String(x.pageRoute || ""),
        createdAt: x.createdAt || null,
      })),
      meta: {
        reviewedBy: String(admin.email || admin.userId || "admin"),
      },
    });
  } catch (error) {
    console.error("[api/admin/consultant-moderation-queue]", error);
    return res.status(500).json({ error: "Failed to load moderation queue" });
  }
}
