import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!["GET", "PATCH"].includes(req.method || "")) {
    res.setHeader("Allow", ["GET", "PATCH"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    if (req.method === "PATCH") {
      const requestId = String(req.body?.requestId || "").trim();
      const disposition = String(req.body?.disposition || "").trim();
      const note = String(req.body?.note || "").trim();

      if (!requestId || !ObjectId.isValid(requestId)) {
        return res.status(400).json({ error: "Valid requestId is required" });
      }
      if (!["resolved", "escalated", "rejected"].includes(disposition)) {
        return res.status(400).json({
          error: "disposition must be resolved, escalated, or rejected",
        });
      }
      if ((disposition === "escalated" || disposition === "rejected") && !note) {
        return res
          .status(400)
          .json({ error: "note is required for escalated or rejected actions" });
      }

      const now = new Date();
      await db.collection("employer_consultant_contact_requests").updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            adminDisposition: disposition,
            adminDispositionNote: note,
            adminDispositionBy: String(admin.email || admin.userId || "admin"),
            adminDispositionAt: now,
            updatedAt: now,
          },
        },
      );

      await db.collection("flow_events").insertOne({
        eventType: "consultant_contact_request_moderated",
        pageRoute: "/api/admin/consultant-moderation-queue",
        section: "consultant_moderation",
        source: "admin_moderation_queue",
        source_variant: disposition,
        requestId,
        note,
        actedBy: String(admin.email || admin.userId || "admin"),
        createdAt: now,
      });

      let escalationId: string | null = null;
      if (disposition === "escalated") {
        const escalations = db.collection("consultant_moderation_escalations");
        const updateResult = await escalations.updateOne(
          { requestId },
          {
            $set: {
              requestId,
              status: "open",
              escalationNote: note,
              escalatedBy: String(admin.email || admin.userId || "admin"),
              escalatedAt: now,
              updatedAt: now,
            },
            $setOnInsert: {
              createdAt: now,
            },
          },
          { upsert: true },
        );

        if (updateResult.upsertedId) {
          escalationId = String(updateResult.upsertedId);
        } else {
          const existing = await escalations.findOne(
            { requestId },
            { projection: { _id: 1 } },
          );
          escalationId = existing?._id ? String(existing._id) : null;
        }
      }

      return res
        .status(200)
        .json({ ok: true, requestId, disposition, escalationId });
    }

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

    const items = await db
      .collection("flow_events")
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(300)
      .toArray();

    return res.status(200).json({
      ok: true,
      items: items.map((x: any) => ({
        id: String(x._id),
        requestId: x.requestId ? String(x.requestId) : null,
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
