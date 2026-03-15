// src/pages/api/advertising/custom-request.ts

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

type ResponseData =
  | { success: true; requestId: string; message: string }
  | { success: false; error: string };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ALLOWED_CUSTOM_OPTIONS = [
  "homepage-feature",
  "homepage-highlight-section",
  "newsletter-feature",
  "custom-landing-page",
  "event-webinar-promotion",
  "product-launch-campaign",
  "long-term-brand-partnership",
  "other",
] as const;

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const userIdRaw = cleanString(req.body?.userId);
    const name = cleanString(req.body?.name);
    const business = cleanString(req.body?.business);
    const email = cleanString(req.body?.email).toLowerCase();
    const details = cleanString(req.body?.details);
    const budget = cleanString(req.body?.budget);
    const timeline = cleanString(req.body?.timeline);
    const selectedOptions = cleanStringArray(req.body?.selectedOptions);

    const validOptions = selectedOptions.filter((option) =>
      ALLOWED_CUSTOM_OPTIONS.includes(
        option as (typeof ALLOWED_CUSTOM_OPTIONS)[number],
      ),
    );

    if (name.length < 2) {
      return res
        .status(400)
        .json({ success: false, error: "Please enter your name." });
    }

    if (business.length < 2) {
      return res
        .status(400)
        .json({ success: false, error: "Please enter your business name." });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res
        .status(400)
        .json({ success: false, error: "Please enter a valid email address." });
    }

    if (validOptions.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please select at least one custom advertising option.",
      });
    }

    if (details.length < 20) {
      return res.status(400).json({
        success: false,
        error: "Please provide more campaign details.",
      });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const now = new Date();

    const result = await db.collection("advertising_requests").insertOne({
      requestType: "custom_ad",
      adType: "custom",
      option: "custom-solution-deposit",
      durationDays: 30,
      placement: "custom-solution",
      status: "pending_review",
      paymentStatus: "unpaid",
      depositRequiredCents: 10000,
      depositPaid: false,

      userId: userIdRaw && userIdRaw !== "guest" ? userIdRaw : null,

      name,
      business,
      email,
      details,
      selectedOptions: validOptions,
      budget: budget || null,
      timeline: timeline || null,

      createdAt: now,
      updatedAt: now,
    });

    await db.collection("flow_events").insertOne({
      eventType: "advertising_submission_completed",
      pageRoute: "/api/advertising/custom-request",
      section: "advertising_custom_request_api",
      source: "advertising_custom_request_api",
      source_variant: "custom_request",
      path: req.url || "/api/advertising/custom-request",
      adOption: "custom-solution",
      ad_type: "custom-solution",
      package_type: "custom",
      checkout_variant: "unified_advertising_checkout",
      campaignId: result.insertedId.toString(),
      selectedOptions: validOptions,
      accountType: "advertiser",
      isAuthenticated: userIdRaw && userIdRaw !== "guest",
      createdAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      requestId: result.insertedId.toString(),
      message: "Custom advertising request saved successfully.",
    });
  } catch (error) {
    console.error("custom-request error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to save custom advertising request.",
    });
  }
}
