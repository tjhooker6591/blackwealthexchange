import type { NextApiRequest, NextApiResponse } from "next";
import stripeCheckoutHandler from "@/pages/api/stripe/checkout";

function safeJsonBody(body: unknown): Record<string, any> {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  if (typeof body === "object") return body as Record<string, any>;
  return {};
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }

  const body = safeJsonBody(req.body);

  req.body = {
    ...body,
    type: "advertising",
    itemId: String(
      body.itemId || body.option || body.adType || "advertising",
    ).trim(),
    metadata: {
      ...(typeof body.metadata === "object" && body.metadata
        ? body.metadata
        : {}),
      source: "advertising_checkout_passthrough",
      option: body.option || body.adType || null,
      placement: body.placement || null,
      duration: body.duration || body.durationDays || null,
      campaignId: body.campaignId || null,
    },
  };

  return stripeCheckoutHandler(req, res);
}
