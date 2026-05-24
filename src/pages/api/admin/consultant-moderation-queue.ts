import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { ADMIN_ERROR_CODES, adminFail } from "@/lib/adminApiContract";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!["GET", "PATCH"].includes(req.method || "")) {
    res.setHeader("Allow", ["GET", "PATCH"]);
    return adminFail(
      res,
      405,
      ADMIN_ERROR_CODES.METHOD_NOT_ALLOWED,
      "Method Not Allowed",
    );
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
        return adminFail(
          res,
          400,
          "INVALID_REQUEST_ID",
          "Valid requestId is required",
        );
      }
      if (!["resolved", "escalated", "rejected"].includes(disposition)) {
        return adminFail(
          res,
          400,
          "INVALID_DISPOSITION",
          "disposition must be resolved, escalated, or rejected",
        );
      }
      if (
        (disposition === "escalated" || disposition === "rejected") &&
        !note
      ) {
        return adminFail(
          res,
          400,
          "NOTE_REQUIRED",
          "note is required for escalated or rejected actions",
        );
      }

      const now = new Date();
      const adminActor = String(admin.email || admin.userId || "admin");
      const dispositionRequestUpdate =
        disposition === "resolved"
          ? { status: "submitted", moderationStatus: "clean" }
          : disposition === "escalated"
            ? { status: "under_admin_review", moderationStatus: "escalated" }
            : { status: "rejected", moderationStatus: "blocked" };

      const update = await db
        .collection("employer_consultant_contact_requests")
        .updateOne(
          { _id: new ObjectId(requestId) },
          {
            $set: {
              ...dispositionRequestUpdate,
              adminDisposition: disposition,
              adminDispositionNote: note,
              adminDispositionBy: adminActor,
              adminDispositionAt: now,
              updatedAt: now,
            },
          },
        );

      if (!update.matchedCount) {
        return adminFail(res, 404, "REQUEST_NOT_FOUND", "Request not found");
      }

      await db.collection("flow_events").insertOne({
        eventType: "consultant_contact_request_moderated",
        pageRoute: "/api/admin/consultant-moderation-queue",
        section: "consultant_moderation",
        source: "admin_moderation_queue",
        source_variant: disposition,
        requestId,
        note,
        actedBy: adminActor,
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

    const requestIds = Array.from(
      new Set(
        items
          .map((x: any) => String(x.requestId || "").trim())
          .filter((x: string) => ObjectId.isValid(x)),
      ),
    ).map((id) => new ObjectId(id));

    const requestDocs = requestIds.length
      ? await db
          .collection("employer_consultant_contact_requests")
          .find(
            { _id: { $in: requestIds } },
            {
              projection: {
                message: 1,
                status: 1,
                moderationStatus: 1,
                adminDisposition: 1,
                adminDispositionNote: 1,
                adminDispositionBy: 1,
                adminDispositionAt: 1,
              },
            },
          )
          .toArray()
      : [];

    const requestMap = new Map<string, any>();
    for (const doc of requestDocs) requestMap.set(String(doc._id), doc);

    return res.status(200).json({
      ok: true,
      items: items.map((x: any) => {
        const requestId = x.requestId ? String(x.requestId) : null;
        const request = requestId ? requestMap.get(requestId) : null;

        return {
          id: String(x._id),
          requestId,
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
          requestMessage:
            request && typeof request.message === "string"
              ? request.message
              : "",
          requestStatus:
            request && typeof request.status === "string"
              ? request.status
              : null,
          requestModerationStatus:
            request && typeof request.moderationStatus === "string"
              ? request.moderationStatus
              : null,
          adminDisposition:
            request && typeof request.adminDisposition === "string"
              ? request.adminDisposition
              : null,
          adminDispositionNote:
            request && typeof request.adminDispositionNote === "string"
              ? request.adminDispositionNote
              : "",
          adminDispositionBy:
            request && typeof request.adminDispositionBy === "string"
              ? request.adminDispositionBy
              : null,
          adminDispositionAt: request?.adminDispositionAt || null,
        };
      }),
      meta: {
        reviewedBy: String(admin.email || admin.userId || "admin"),
      },
    });
  } catch (error) {
    console.error("[api/admin/consultant-moderation-queue]", error);
    return adminFail(
      res,
      500,
      ADMIN_ERROR_CODES.INTERNAL_ERROR,
      "Failed to load moderation queue",
    );
  }
}
