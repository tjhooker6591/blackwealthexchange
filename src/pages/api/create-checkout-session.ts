import { NextApiRequest, NextApiResponse } from "next";
import stripeCheckoutHandler from "@/pages/api/stripe/checkout";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { adType, businessId, duration = 7 } = req.body || {};

  req.body = {
    type: "ad",
    itemId: typeof adType === "string" ? adType : "",
    durationDays: Number(duration) || 7,
    businessId: typeof businessId === "string" ? businessId : "",
    metadata: {
      source: "legacy_create_checkout_session",
    },
  };

  return stripeCheckoutHandler(req, res);
}
