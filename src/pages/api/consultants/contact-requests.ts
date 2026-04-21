import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { getUserFromRequest } from "@/lib/auth";
import type { ConsultantContactRequestStatus } from "@/lib/consultants/catalog";

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
        .json({ error: "Employers cannot access consultant inbox." });
    }

    if (!["GET", "PATCH"].includes(req.method || "")) {
      res.setHeader("Allow", ["GET", "PATCH"]);
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const profile = await db
      .collection("consultant_profiles")
      .findOne({ userId: sessionUserId });

    const consultantIds = [String(sessionUserId)];
    if (profile?._id) consultantIds.push(String(profile._id));

    const requestsCol = db.collection("employer_consultant_contact_requests");

    if (req.method === "PATCH") {
      const requestId = String(req.body?.requestId || "").trim();
      const action = String(req.body?.action || "")
        .trim()
        .toLowerCase();
      const note = String(req.body?.note || "").trim();

      if (!requestId || !ObjectId.isValid(requestId)) {
        return res.status(400).json({ error: "Valid requestId is required." });
      }

      const actionToStatus: Record<string, ConsultantContactRequestStatus> = {
        accept: "accepted",
        decline: "declined",
        request_more_info: "more_info_requested",
      };

      const nextStatus = actionToStatus[action];
      if (!nextStatus) {
        return res.status(400).json({
          error: "Invalid action. Use accept, decline, or request_more_info.",
        });
      }

      const current = await requestsCol.findOne({
        _id: new ObjectId(requestId),
      });
      if (!current) return res.status(404).json({ error: "Request not found" });
      if (!consultantIds.includes(String(current.consultantId || ""))) {
        return res.status(403).json({ error: "Not allowed for this request" });
      }

      const now = new Date();
      await requestsCol.updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            status: nextStatus,
            consultantResponseAction: action,
            consultantResponseNote: note,
            consultantRespondedAt: now,
            updatedAt: now,
          },
        },
      );

      const resultingPipelineStatus =
        nextStatus === "accepted"
          ? "under_review"
          : nextStatus === "declined"
            ? "saved"
            : "contacted";

      await db.collection("employer_consultant_pipeline").updateOne(
        {
          employerId: String(current.employerId || ""),
          consultantId: String(current.consultantId || ""),
        },
        {
          $set: {
            status: resultingPipelineStatus,
            updatedAt: now,
            lastConsultantResponseStatus: nextStatus,
            lastConsultantRespondedAt: now,
          },
          $setOnInsert: {
            createdAt: now,
            employerEmail: String(current.employerEmail || ""),
          },
        },
        { upsert: true },
      );

      await db.collection("flow_events").insertOne({
        eventType: "consultant_contact_request_responded",
        pageRoute: "/api/consultants/contact-requests",
        section: "consultant_inbox",
        source: "consultant_inbox_api",
        source_variant: action,
        consultantId: String(current.consultantId || ""),
        employerId: String(current.employerId || ""),
        requestId,
        resultingStatus: nextStatus,
        resultingPipelineStatus,
        createdAt: now,
      });

      return res.status(200).json({
        ok: true,
        requestId,
        status: nextStatus,
      });
    }

    const requests = await requestsCol
      .find({
        consultantId: { $in: consultantIds },
        $or: [
          { moderationStatus: { $ne: "blocked" } },
          { adminDisposition: "resolved" },
        ],
      })
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
        consultantResponseAction: r.consultantResponseAction || null,
        consultantResponseNote: r.consultantResponseNote || "",
        consultantRespondedAt: r.consultantRespondedAt || null,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("[api/consultants/contact-requests]", error);
    return res.status(500).json({ error: "Failed to load consultant inbox" });
  }
}
