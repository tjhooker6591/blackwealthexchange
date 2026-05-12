import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { ADMIN_ERROR_CODES, adminFail } from "@/lib/adminApiContract";

const VALID_STATUS = ["open", "in_review", "closed"] as const;

type EscalationStatus = (typeof VALID_STATUS)[number];

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
    const escalations = db.collection("consultant_moderation_escalations");

    if (req.method === "PATCH") {
      const escalationId = String(req.body?.escalationId || "").trim();
      const status = String(req.body?.status || "").trim() as EscalationStatus;
      const resolutionNote = String(req.body?.resolutionNote || "").trim();

      if (!escalationId || !ObjectId.isValid(escalationId)) {
        return adminFail(
          res,
          400,
          "INVALID_ESCALATION_ID",
          "Valid escalationId is required",
        );
      }
      if (!VALID_STATUS.includes(status)) {
        return adminFail(
          res,
          400,
          "INVALID_STATUS",
          "status must be open, in_review, or closed",
        );
      }
      if (status === "closed" && !resolutionNote) {
        return adminFail(
          res,
          400,
          "RESOLUTION_NOTE_REQUIRED",
          "resolutionNote is required when closing",
        );
      }

      const now = new Date();
      const actedBy = String(admin.email || admin.userId || "admin");
      const result = await escalations.findOneAndUpdate(
        { _id: new ObjectId(escalationId) },
        {
          $set: {
            status,
            resolutionNote: resolutionNote || null,
            updatedAt: now,
            actedBy,
            actedAt: now,
          },
        },
        { returnDocument: "after" },
      );

      if (!result) {
        return adminFail(
          res,
          404,
          "ESCALATION_NOT_FOUND",
          "Escalation not found",
        );
      }

      const requestId = result.requestId ? String(result.requestId) : null;
      let requestSync: {
        requestId: string;
        matched: boolean;
        disposition: string | null;
        note: string | null;
        by: string | null;
        at: Date | null;
      } | null = null;

      if (requestId && ObjectId.isValid(requestId)) {
        const mappedDisposition =
          status === "closed" ? "resolved" : "escalated";
        const requestObjectId = new ObjectId(requestId);
        const syncNote =
          resolutionNote || String(result.escalationNote || "").trim() || null;

        const syncUpdate = await db
          .collection("employer_consultant_contact_requests")
          .updateOne(
            { _id: requestObjectId },
            {
              $set: {
                adminDisposition: mappedDisposition,
                adminDispositionNote: syncNote,
                adminDispositionBy: actedBy,
                adminDispositionAt: now,
                updatedAt: now,
              },
            },
          );

        if (syncUpdate.matchedCount) {
          const synced = await db
            .collection("employer_consultant_contact_requests")
            .findOne(
              { _id: requestObjectId },
              {
                projection: {
                  adminDisposition: 1,
                  adminDispositionNote: 1,
                  adminDispositionBy: 1,
                  adminDispositionAt: 1,
                },
              },
            );

          requestSync = {
            requestId,
            matched: true,
            disposition:
              typeof synced?.adminDisposition === "string"
                ? synced.adminDisposition
                : null,
            note:
              typeof synced?.adminDispositionNote === "string"
                ? synced.adminDispositionNote
                : null,
            by:
              typeof synced?.adminDispositionBy === "string"
                ? synced.adminDispositionBy
                : null,
            at: synced?.adminDispositionAt
              ? new Date(synced.adminDispositionAt)
              : null,
          };
        } else {
          requestSync = {
            requestId,
            matched: false,
            disposition: null,
            note: null,
            by: null,
            at: null,
          };
        }
      }

      await db.collection("flow_events").insertOne({
        eventType: "consultant_moderation_escalation_updated",
        pageRoute: "/api/admin/consultant-escalations",
        section: "consultant_moderation",
        source: "admin_escalations",
        source_variant: status,
        escalationId,
        requestId,
        note: resolutionNote || null,
        actedBy,
        createdAt: now,
      });

      return res.status(200).json({
        ok: true,
        escalationId,
        status,
        requestId,
        requestSync,
      });
    }

    const statusFilter =
      typeof req.query.status === "string" ? req.query.status.trim() : "";

    const filter: Record<string, unknown> = {};
    if (VALID_STATUS.includes(statusFilter as EscalationStatus)) {
      filter.status = statusFilter;
    }

    const items = await escalations
      .find(filter)
      .sort({ updatedAt: -1, escalatedAt: -1, createdAt: -1 })
      .limit(300)
      .toArray();

    return res.status(200).json({
      ok: true,
      items: items.map((item: any) => ({
        id: String(item._id),
        requestId: item.requestId ? String(item.requestId) : null,
        status: String(item.status || "open"),
        escalationNote: String(item.escalationNote || ""),
        resolutionNote: String(item.resolutionNote || ""),
        escalatedBy: String(item.escalatedBy || ""),
        actedBy: String(item.actedBy || ""),
        escalatedAt: item.escalatedAt || item.createdAt || null,
        actedAt: item.actedAt || null,
        updatedAt: item.updatedAt || item.createdAt || null,
      })),
      meta: {
        reviewedBy: String(admin.email || admin.userId || "admin"),
      },
    });
  } catch (error) {
    console.error("[api/admin/consultant-escalations]", error);
    return adminFail(
      res,
      500,
      ADMIN_ERROR_CODES.INTERNAL_ERROR,
      "Failed to process escalations",
    );
  }
}
