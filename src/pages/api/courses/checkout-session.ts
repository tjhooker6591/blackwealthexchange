import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getAppUrl, getJwtSecret } from "@/lib/env";
import { requireStripeSecretKey } from "@/lib/stripeSecret";

type ErrorBody = { code: string; message: string };

type SuccessBody = { url: string | null; sessionId: string };

const stripe = new Stripe(requireStripeSecretKey(), {
  apiVersion: "2025-02-24.acacia",
});

const COURSE_PRICES: Record<string, { name: string; price: number }> = {
  "personal-finance-101": { name: "Personal Finance 101", price: 2900 },
  "investing-for-beginners": { name: "Investing for Beginners", price: 3900 },
  "generational-wealth": { name: "Building Generational Wealth", price: 4900 },
};

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
  res: NextApiResponse<SuccessBody | ErrorBody>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }

  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token) {
    return res
      .status(401)
      .json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  let sessionUser: { userId: string; email?: string };
  try {
    const SECRET = getJwtSecret();
    if (!SECRET) {
      return res.status(500).json({
        code: "AUTH_CONFIG_MISSING",
        message: "Authentication is temporarily unavailable",
      });
    }

    const decoded = jwt.verify(token, SECRET as string) as any;
    const userId = typeof decoded?.userId === "string" ? decoded.userId : "";

    if (!userId) {
      return res
        .status(401)
        .json({ code: "UNAUTHORIZED", message: "Unauthorized" });
    }

    sessionUser = {
      userId,
      email: typeof decoded?.email === "string" ? decoded.email : undefined,
    };
  } catch {
    return res
      .status(401)
      .json({ code: "UNAUTHORIZED", message: "Unauthorized" });
  }

  const body = safeJsonBody(req.body);
  const courseSlug =
    typeof body.courseSlug === "string" ? body.courseSlug.trim() : "";

  const course = COURSE_PRICES[courseSlug];
  if (!course) {
    return res
      .status(400)
      .json({ code: "INVALID_COURSE", message: "Invalid course" });
  }

  try {
    const appUrl = getAppUrl();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      ...(sessionUser.email ? { customer_email: sessionUser.email } : {}),
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: course.name,
            },
            unit_amount: course.price,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        userId: sessionUser.userId,
        type: "course",
        itemId: courseSlug,
        courseId: courseSlug,
        courseSlug,
      },
      success_url: `${appUrl}/course-dashboard?course=${courseSlug}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/course-enrollment?cancelled=1`,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Stripe error:", err);
    return res.status(500).json({
      code: "CHECKOUT_CREATE_FAILED",
      message: "Failed to create checkout session",
    });
  }
}
