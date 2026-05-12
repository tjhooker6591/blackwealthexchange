// src/pages/api/admin/approve-directory-listing.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getMongoDbName } from "@/lib/env";
import { canApproveDirectoryListing } from "@/lib/stateTransitions";
import { getAdminDecodedFromRequest, isAdminDecoded } from "@/lib/adminAuth";
import { ADMIN_ERROR_CODES, adminFail } from "@/lib/adminApiContract";

type ApproveBody = {
  listingId?: string; // directory_listings _id OR payments _id (fallback rows)
  stripeSessionId?: string; // optional direct identifier
  source?: "directory" | "payments_fallback" | "auto";
  forceApproveUnpaid?: boolean; // admin override for testing only
};

const DEFAULT_MAX_SLOTS = 10;

function s(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function n(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim()) {
    const parsed = Number(v);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getMaxSlots() {
  const envVal = Number(process.env.DIRECTORY_FEATURED_MAX_SLOTS || "");
  if (Number.isFinite(envVal) && envVal > 0) return Math.floor(envVal);
  return DEFAULT_MAX_SLOTS;
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function pickFirstOpenSlot(used: number[], max: number): number | null {
  const set = new Set(
    used
      .filter((x) => Number.isFinite(x))
      .map((x) => Math.floor(x))
      .filter((x) => x >= 1 && x <= max),
  );

  for (let i = 1; i <= max; i++) {
    if (!set.has(i)) return i;
  }
  return null;
}

function inferTierFromItemId(
  itemId: string | null,
): "standard" | "featured" | null {
  if (itemId === "directory-standard") return "standard";
  if (itemId === "directory-featured") return "featured";
  return null;
}

function pickPaymentItemId(p: any): string | null {
  return (
    s(p?.itemId) ||
    s(p?.metadata?.itemId) ||
    s(p?.option) ||
    s(p?.metadata?.option)
  );
}

function isDirectoryItem(itemId: string | null) {
  return itemId === "directory-standard" || itemId === "directory-featured";
}

function isPlaceholderBusinessId(v: string | null) {
  return !!v && v.startsWith("UNLINKED:");
}

function getLinkedBusinessId(doc: any): string | null {
  const businessIdReal = s(doc?.businessIdReal);
  if (businessIdReal) return businessIdReal;

  const businessId = s(doc?.businessId);
  if (!businessId) return null;
  if (isPlaceholderBusinessId(businessId)) return null;

  return businessId;
}

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

  const admin = getAdminDecodedFromRequest(req);
  if (!admin) {
    return adminFail(res, 401, ADMIN_ERROR_CODES.UNAUTHORIZED, "Unauthorized");
  }
  if (!isAdminDecoded(admin)) {
    return adminFail(res, 403, ADMIN_ERROR_CODES.FORBIDDEN, "Forbidden");
  }

  try {
    const body: ApproveBody =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const listingId = s(body.listingId);
    const stripeSessionIdInput = s(body.stripeSessionId);
    const source = (s(body.source) || "auto") as ApproveBody["source"];
    const forceApproveUnpaid = Boolean(body.forceApproveUnpaid);

    if (!listingId && !stripeSessionIdInput) {
      return adminFail(
        res,
        400,
        ADMIN_ERROR_CODES.MISSING_IDENTIFIER,
        "listingId or stripeSessionId is required",
      );
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const directoryCol = db.collection("directory_listings");
    const paymentsCol = db.collection("payments");

    const now = new Date();
    const maxSlots = getMaxSlots();

    let listing: any = null;
    let listingObjectId: ObjectId | null = null;

    // ---------------------------------------------------------
    // 1) Try to find an existing directory listing first
    // ---------------------------------------------------------
    if (source === "directory" || source === "auto") {
      if (listingId && ObjectId.isValid(listingId)) {
        listingObjectId = new ObjectId(listingId);
        listing = await directoryCol.findOne({ _id: listingObjectId });
      }

      if (!listing && stripeSessionIdInput) {
        listing = await directoryCol.findOne({
          stripeSessionId: stripeSessionIdInput,
        });
        if (listing?._id) listingObjectId = listing._id;
      }
    }

    // ---------------------------------------------------------
    // 2) If not found, derive/create from payments fallback
    // ---------------------------------------------------------
    if (!listing && (source === "payments_fallback" || source === "auto")) {
      let payment: any = null;

      if (listingId && ObjectId.isValid(listingId)) {
        payment = await paymentsCol.findOne({ _id: new ObjectId(listingId) });
      }

      if (!payment && stripeSessionIdInput) {
        payment = await paymentsCol.findOne({
          stripeSessionId: stripeSessionIdInput,
        });
      }

      if (!payment) {
        return adminFail(
          res,
          404,
          ADMIN_ERROR_CODES.LISTING_OR_PAYMENT_NOT_FOUND,
          "Listing/payment record not found",
        );
      }

      const itemId = pickPaymentItemId(payment);
      if (!isDirectoryItem(itemId)) {
        return adminFail(
          res,
          400,
          ADMIN_ERROR_CODES.NOT_DIRECTORY_PURCHASE,
          "Record is not a directory listing purchase",
        );
      }

      const paymentStatus = s(payment?.status) || "unknown";
      const approvalGate = canApproveDirectoryListing({
        paymentStatus,
        forceApproveUnpaid,
      });
      if (!approvalGate.ok) {
        return adminFail(
          res,
          409,
          ADMIN_ERROR_CODES.UNPAID_LISTING,
          "Cannot approve an unpaid listing",
        );
      }

      const tier = inferTierFromItemId(itemId);
      const durationDays =
        n(payment?.durationDays) ?? n(payment?.metadata?.durationDays) ?? 30;

      const paymentStripeSessionId = s(payment?.stripeSessionId);
      if (!paymentStripeSessionId) {
        return adminFail(
          res,
          400,
          ADMIN_ERROR_CODES.MISSING_STRIPE_SESSION_ID,
          "Payment missing stripeSessionId",
        );
      }

      const linkedBusinessId =
        s(payment?.businessId) || s(payment?.metadata?.businessId);

      const listingStatus = linkedBusinessId ? "pending_approval" : "unlinked";
      const paidAt =
        paymentStatus === "paid"
          ? payment?.paidAt instanceof Date
            ? payment.paidAt
            : now
          : null;

      const expiresAt =
        paymentStatus === "paid" && paidAt
          ? addDays(paidAt, Math.max(1, Math.floor(Number(durationDays))))
          : null;

      const baseDoc = {
        stripeSessionId: paymentStripeSessionId,
        paymentIntentId: s(payment?.paymentIntentId),

        email: s(payment?.email),
        userId: s(payment?.userId) || s(payment?.metadata?.userId),

        // keep both forms for the new admin model
        businessId: linkedBusinessId || `UNLINKED:${paymentStripeSessionId}`,
        businessIdReal: linkedBusinessId || null,
        businessIdIsPlaceholder: !linkedBusinessId,

        tier,
        itemId,
        durationDays: Math.max(1, Math.floor(Number(durationDays))),
        amountCents:
          typeof payment?.amountCents === "number" ? payment.amountCents : null,

        // separate workflow/payment truth
        status: listingStatus,
        listingStatus,
        paymentStatus: paymentStatus === "paid" ? "paid" : "pending",
        approvalStatus: listingStatus === "unlinked" ? "pending" : "pending",

        needsAttention: !linkedBusinessId,

        paid: paymentStatus === "paid",
        paidAt,
        expiresAt,

        featuredSlot: null,
        featuredStartDate: null,
        featuredEndDate: null,
        queuePosition: null,

        metadata: {
          sourcePaymentId: payment?._id?.toString?.() || null,
          placement: s(payment?.placement) || s(payment?.metadata?.placement),
          campaignId:
            s(payment?.campaignId) || s(payment?.metadata?.campaignId),
          itemId,
        },

        createdAt: payment?.createdAt instanceof Date ? payment.createdAt : now,
        updatedAt: now,
      };

      await directoryCol.updateOne(
        { stripeSessionId: paymentStripeSessionId },
        {
          $setOnInsert: {
            createdAt: baseDoc.createdAt,
          },
          $set: baseDoc,
        },
        { upsert: true },
      );

      listing = await directoryCol.findOne({
        stripeSessionId: paymentStripeSessionId,
      });
      listingObjectId = listing?._id || null;
    }

    if (!listing || !listingObjectId) {
      return adminFail(
        res,
        404,
        ADMIN_ERROR_CODES.DIRECTORY_LISTING_NOT_FOUND,
        "Directory listing not found",
      );
    }

    const tier = (s(listing?.tier) || "standard") as "standard" | "featured";
    const durationDays = Math.max(
      1,
      Math.floor(Number(n(listing?.durationDays) ?? 30)),
    );

    const alreadyPaid =
      Boolean(listing?.paid === true) ||
      Boolean(listing?.paidAt) ||
      s(listing?.paymentStatus) === "paid";

    const listingApprovalGate = canApproveDirectoryListing({
      paymentStatus: alreadyPaid
        ? "paid"
        : s(listing?.paymentStatus) || "unknown",
      forceApproveUnpaid,
    });

    if (!listingApprovalGate.ok) {
      return adminFail(
        res,
        409,
        ADMIN_ERROR_CODES.LISTING_NOT_PAID,
        "Listing is not paid",
      );
    }

    const linkedBusinessId = getLinkedBusinessId(listing);

    // TRUST RULE: unlinked listings must be linked before approval
    if (!linkedBusinessId) {
      await directoryCol.updateOne(
        { _id: listingObjectId },
        {
          $set: {
            status: "unlinked",
            listingStatus: "unlinked",
            paymentStatus: alreadyPaid ? "paid" : "pending",
            needsAttention: true,
            updatedAt: now,
          },
        },
      );

      return adminFail(
        res,
        409,
        ADMIN_ERROR_CODES.LISTING_UNLINKED,
        "Listing is not linked to a business",
      );
    }

    // If featured, assign slot or queue
    if (tier === "featured") {
      const activeSlotDocs = await directoryCol
        .find(
          {
            _id: { $ne: listingObjectId },
            tier: "featured",
            status: "active",
            featuredSlot: { $type: "number" },
            $or: [
              { featuredEndDate: { $gt: now } },
              { expiresAt: { $gt: now } },
            ],
          },
          { projection: { featuredSlot: 1 } },
        )
        .toArray();

      const usedSlots = activeSlotDocs
        .map((x: any) => Number(x?.featuredSlot))
        .filter((x) => Number.isFinite(x));

      const openSlot = pickFirstOpenSlot(usedSlots, maxSlots);

      const expiresAt =
        listing?.expiresAt instanceof Date
          ? listing.expiresAt
          : addDays(now, durationDays);

      let update: Record<string, any>;
      let resultStatus: "active" | "approved";
      let queuePosition: number | null = null;
      let featuredSlot: number | null = null;

      if (openSlot) {
        featuredSlot = openSlot;
        resultStatus = "active";

        update = {
          status: "active",
          listingStatus: "active",
          paymentStatus: "paid",
          approvalStatus: "approved",
          approvedAt: now,
          approvedBy: admin.email || admin.userId || "admin",

          paid: true,
          paidAt: listing.paidAt || now,

          needsAttention: false,

          businessId: linkedBusinessId,
          businessIdReal: linkedBusinessId,
          businessIdIsPlaceholder: false,

          featuredSlot,
          featuredStartDate: now,
          featuredEndDate: expiresAt,
          queuePosition: null,
          expiresAt,
          updatedAt: now,
        };
      } else {
        const queueDocs = await directoryCol
          .find(
            {
              _id: { $ne: listingObjectId },
              tier: "featured",
              queuePosition: { $type: "number" },
              $or: [{ status: "approved" }, { listingStatus: "approved" }],
            },
            { projection: { queuePosition: 1 } },
          )
          .sort({ queuePosition: -1 })
          .limit(1)
          .toArray();

        const lastQueue = Number(queueDocs[0]?.queuePosition || 0);
        queuePosition = Number.isFinite(lastQueue) ? lastQueue + 1 : 1;
        resultStatus = "approved";

        update = {
          status: "approved",
          listingStatus: "approved",
          paymentStatus: "paid",
          approvalStatus: "approved",
          approvedAt: now,
          approvedBy: admin.email || admin.userId || "admin",

          paid: true,
          paidAt: listing.paidAt || now,

          needsAttention: false,

          businessId: linkedBusinessId,
          businessIdReal: linkedBusinessId,
          businessIdIsPlaceholder: false,

          featuredSlot: null,
          featuredStartDate: null,
          featuredEndDate: null,
          queuePosition,
          expiresAt,
          updatedAt: now,
        };
      }

      await directoryCol.updateOne({ _id: listingObjectId }, { $set: update });

      return res.status(200).json({
        ok: true,
        listingId: listingObjectId.toString(),
        tier: "featured",
        status: resultStatus,
        listingStatus: resultStatus,
        paymentStatus: "paid",
        featuredSlot,
        queuePosition,
        maxSlots,
      });
    }

    // Standard listing: approve and activate immediately
    const standardExpiresAt =
      listing?.expiresAt instanceof Date
        ? listing.expiresAt
        : addDays(now, durationDays);

    await directoryCol.updateOne(
      { _id: listingObjectId },
      {
        $set: {
          status: "active",
          listingStatus: "active",
          paymentStatus: "paid",
          approvalStatus: "approved",
          approvedAt: now,
          approvedBy: admin.email || admin.userId || "admin",

          paid: true,
          paidAt: listing.paidAt || now,

          needsAttention: false,

          businessId: linkedBusinessId,
          businessIdReal: linkedBusinessId,
          businessIdIsPlaceholder: false,

          featuredSlot: null,
          featuredStartDate: null,
          featuredEndDate: null,
          queuePosition: null,
          expiresAt: standardExpiresAt,
          updatedAt: now,
        },
      },
    );

    return res.status(200).json({
      ok: true,
      listingId: listingObjectId.toString(),
      tier: "standard",
      status: "active",
      listingStatus: "active",
      paymentStatus: "paid",
      featuredSlot: null,
      queuePosition: null,
      maxSlots,
    });
  } catch (err: any) {
    console.error("[/api/admin/approve-directory-listing] error:", err);
    return adminFail(
      res,
      500,
      ADMIN_ERROR_CODES.INTERNAL_ERROR,
      "Internal Server Error",
    );
  }
}
