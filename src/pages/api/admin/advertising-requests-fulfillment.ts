import type { NextApiRequest, NextApiResponse } from "next";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { adminFail, ADMIN_ERROR_CODES } from "@/lib/adminApiContract";
import { reserveFeaturedSponsorWeeks } from "@/lib/advertising/sponsorSchedule";

type Body = {
  requestId?: string;
  paidAt?: string;
  durationDays?: number;
  placement?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return adminFail(
      res,
      405,
      ADMIN_ERROR_CODES.METHOD_NOT_ALLOWED,
      "Method Not Allowed",
    );
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  const body: Body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

  const requestId = String(body.requestId || "").trim();
  if (!ObjectId.isValid(requestId)) {
    return adminFail(res, 400, "INVALID_REQUEST_ID", "Invalid requestId");
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const now = new Date();
    const paidAt = body.paidAt ? new Date(body.paidAt) : now;

    const requests = db.collection("advertising_requests");
    const reqDoc = await requests.findOne({ _id: new ObjectId(requestId) });
    if (!reqDoc) {
      return adminFail(res, 404, "REQUEST_NOT_FOUND", "Request not found");
    }

    const option = String(reqDoc.option || "").trim();
    const durationDays =
      Number.isFinite(Number(body.durationDays)) &&
      Number(body.durationDays) > 0
        ? Math.floor(Number(body.durationDays))
        : Number.isFinite(Number(reqDoc.durationDays)) &&
            Number(reqDoc.durationDays) > 0
          ? Math.floor(Number(reqDoc.durationDays))
          : 30;

    const placement =
      String(body.placement || reqDoc.placement || "").trim() ||
      "homepage-featured-sponsor";

    await requests.updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          paymentStatus: "paid",
          depositPaid: true,
          paidAt,
          status: "approved",
          reviewStatus: "approved",
          updatedAt: now,
        },
      },
    );

    await db.collection("ad_purchases").updateOne(
      { campaignId: requestId },
      {
        $setOnInsert: { createdAt: now },
        $set: {
          campaignId: requestId,
          stripeSessionId: null,
          paymentIntentId: null,
          status: "paid",
          paid: true,
          paidAt,
          type: "ad",
          purchaseType: "ad",
          itemId: option || "featured-sponsor",
          durationDays,
          placement,
          fulfillmentStatus: "paid_campaign_linked",
          updatedAt: now,
        },
      },
      { upsert: true },
    );

    let assignedWeeks: string[] = [];
    if (option === "featured-sponsor") {
      const rows = await reserveFeaturedSponsorWeeks(db as any, {
        campaignId: requestId,
        durationDays,
        requestedStartDate: reqDoc?.requestedStartDate
          ? new Date(reqDoc.requestedStartDate).toISOString()
          : null,
        businessName: String(reqDoc.business || "Featured Sponsor"),
        website: String(reqDoc.website || ""),
        targetUrl: String(reqDoc.targetUrl || reqDoc.website || ""),
        creativeUrl: String(reqDoc.adImage || ""),
        tagline: String(reqDoc.details || ""),
        placement,
        option,
        flexibleStart: Boolean(reqDoc.flexibleStart ?? true),
      });

      assignedWeeks = rows.map((r) => r.weekStart.toISOString().slice(0, 10));

      await requests.updateOne(
        { _id: new ObjectId(requestId) },
        {
          $set: {
            scheduling: {
              status: "scheduled",
              assignedWeeks,
              rolledOver: rows.some((r) => r.queueStatus === "rolled_over"),
              queueStatus: rows[0]?.queueStatus || "assigned",
              placement,
              durationDays,
            },
            updatedAt: new Date(),
          },
        },
      );
    }

    return res.status(200).json({
      ok: true,
      requestId,
      paymentStatus: "paid",
      depositPaid: true,
      scheduled: option === "featured-sponsor",
      assignedWeeks,
    });
  } catch (error) {
    console.error("[/api/admin/advertising-requests-fulfillment]", error);
    return adminFail(
      res,
      500,
      ADMIN_ERROR_CODES.INTERNAL_ERROR,
      "Failed to fulfill advertising request",
    );
  }
}
