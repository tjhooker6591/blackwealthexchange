// src/pages/api/advertising/submit.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { validateSponsorBusinessLink } from "@/lib/advertising/sponsorListings";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

  const name = String(body.name || "").trim();
  const email = String(body.email || "")
    .trim()
    .toLowerCase();
  const businessName = String(body.businessName || "").trim();
  const adText = String(body.adText || "").trim();
  const adImage = String(body.adImage || "").trim();
  const website = String(body.website || "").trim();
  const budget = String(body.budget || "").trim();
  const option = String(body.option || "").trim();
  const durationDays = Number(body.durationDays || 0);
  const placement = String(body.placement || "").trim();
  const placementType = String(body.placementType || placement || "").trim();
  const requestedStartDate = String(body.requestedStartDate || "").trim();
  const flexibleStart = Boolean(body.flexibleStart ?? true);
  const targetUrl = String(body.targetUrl || website || "").trim();
  const campaignTitle = String(body.campaignTitle || "").trim();
  const businessId = String(body.businessId || "").trim();

  if (
    !name ||
    !EMAIL_REGEX.test(email) ||
    !(businessName || (option === "featured-sponsor" && businessId)) ||
    !adText
  ) {
    return res.status(400).json({ error: "Missing required campaign details" });
  }

  if ((option === "featured-sponsor" || option === "banner-ad") && !adImage) {
    return res.status(400).json({
      error:
        "Ad creative is required for featured sponsor and banner campaigns",
    });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const collection = db.collection("advertising_requests");

    let linkedBusinessName = businessName;
    let linkedBusinessAlias = "";
    if (option === "featured-sponsor") {
      const validation = await validateSponsorBusinessLink(db, businessId);
      if (!validation.ok) {
        const status =
          validation.reason === "missing_business_id"
            ? 400
            : validation.reason === "business_not_found"
              ? 404
              : 409;
        return res.status(status).json({
          error:
            "Featured sponsorship requires a linked public BWE business listing",
          code: validation.reason,
        });
      }

      const businessDoc = validation.business as any;
      linkedBusinessName = String(
        businessDoc.business_name ||
          businessDoc.businessName ||
          businessDoc.name ||
          businessName,
      ).trim();
      linkedBusinessAlias = validation.alias;
    }

    const now = new Date();
    const newAd = {
      requestType: "standard_ad",
      status: "pending_review",
      paymentStatus: "unpaid",
      depositPaid: false,
      name,
      email,
      business: linkedBusinessName,
      businessId: businessId || null,
      businessAlias: linkedBusinessAlias || null,
      details: adText,
      selectedOptions: option ? [option] : [],
      budget: budget || null,
      adImage: adImage || null,
      website: website || null,
      targetUrl: targetUrl || null,
      option: option || null,
      placementType: placementType || null,
      campaignTitle: campaignTitle || null,
      durationDays:
        Number.isFinite(durationDays) && durationDays > 0
          ? Math.floor(durationDays)
          : null,
      placement: placement || null,
      requestedStartDate: requestedStartDate
        ? new Date(requestedStartDate)
        : null,
      flexibleStart,
      creativeAssets: adImage ? [adImage] : [],
      scheduling: {
        status: "pending_payment",
        assignedWeeks: [],
        rolledOver: false,
      },
      createdAt: now,
      updatedAt: now,
    };

    const result = await collection.insertOne(newAd);

    await db.collection("flow_events").insertOne({
      eventType: "advertising_submission_completed",
      pageRoute: "/api/advertising/submit",
      section: "advertising_submit_api",
      source: "advertising_submit_api",
      source_variant: "standard_submit",
      path: req.url || "/api/advertising/submit",
      adOption: option || null,
      ad_type: option || null,
      package_type: option || null,
      checkout_variant: "unified_advertising_checkout",
      placement: placement || null,
      durationDays:
        Number.isFinite(durationDays) && durationDays > 0
          ? Math.floor(durationDays)
          : null,
      campaignId: result.insertedId.toString(),
      accountType: "advertiser",
      isAuthenticated: null,
      createdAt: new Date(),
    });

    const nextStepsByOption: Record<string, string[]> = {
      "featured-sponsor": [
        "Your campaign is now in review.",
        "After approval and payment, it is assigned to homepage sponsor schedule weeks.",
        "When the assigned week starts, it appears in the homepage Featured Sponsors rail.",
      ],
      "directory-standard": [
        "Your directory campaign is now in review.",
        "After approval and payment, it moves to directory fulfillment.",
        "When activated, it appears as a paid directory listing for the selected duration.",
      ],
      "directory-featured": [
        "Your featured directory campaign is now in review.",
        "After approval and payment, it moves to featured directory fulfillment.",
        "When activated, it appears with featured/sponsored treatment for the selected duration.",
      ],
      "banner-ad": [
        "Your banner campaign is now in review.",
        "After approval and payment, requested placement inventory is confirmed.",
        "Your banner goes live only after scheduling is finalized for the selected window.",
      ],
      "custom-solution-deposit": [
        "Your custom campaign request is now in review.",
        "After deposit confirmation, deliverables and placement surfaces are finalized.",
        "Launch starts only after scope, timeline, and assets are approved.",
      ],
    };

    return res.status(201).json({
      success: true,
      message: "Ad request submitted",
      adId: result.insertedId.toString(),
      requestId: result.insertedId.toString(),
      lifecycle: "pending_review",
      nextSteps: nextStepsByOption[option] || [
        "Your campaign is now in review.",
        "After approval and payment, fulfillment scheduling is finalized.",
        "Campaign placement begins when the assigned schedule window starts.",
      ],
    });
  } catch (error) {
    console.error("Error saving ad request:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
