import { NextApiRequest, NextApiResponse } from "next";
import { getCampaignById } from "@/lib/db/ads";
import stripeCheckoutHandler from "@/pages/api/stripe/checkout";

type ApiResponse = { ok?: boolean; code?: string; message?: string; sessionId?: string; url?: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", message: "Method not allowed" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const campaignId = typeof body.campaignId === "string" ? body.campaignId.trim() : "";
  if (!campaignId) {
    return res.status(400).json({ ok: false, code: "CAMPAIGN_ID_REQUIRED", message: "Missing campaignId" });
  }

  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    return res.status(404).json({ ok: false, code: "CAMPAIGN_NOT_FOUND", message: "Campaign not found" });
  }

  req.body = {
    type: "ad",
    itemId: String(campaign.option || campaign.itemId || "featured-sponsor"),
    durationDays: Number(campaign.durationDays || 30),
    businessId: String(campaign.businessId || ""),
    campaignId,
    metadata: { source: "legacy_ads_create_checkout_session" },
  };

  return stripeCheckoutHandler(req as NextApiRequest, res as unknown as NextApiResponse);
}
