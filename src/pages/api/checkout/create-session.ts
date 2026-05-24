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
    return res
      .status(405)
      .json({ code: "METHOD_NOT_ALLOWED", message: "Method not allowed" });
  }

  const body = safeJsonBody(req.body);
  const productId =
    typeof body.productId === "string" ? body.productId.trim() : "";

  req.body = {
    ...body,
    type: "product",
    itemId: productId || String(body.itemId || "").trim(),
    metadata: {
      ...(typeof body.metadata === "object" && body.metadata
        ? body.metadata
        : {}),
      source: "legacy_checkout_create_session",
    },
  };

  return stripeCheckoutHandler(req, res);
}
