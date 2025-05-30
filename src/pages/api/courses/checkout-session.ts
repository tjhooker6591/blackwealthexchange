import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import cookie from "cookie";
import jwt from "jsonwebtoken";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2025-02-24.acacia", // Match your main stripe logic!
});

const COURSE_PRICES: Record<string, { name: string; price: number }> = {
  "personal-finance-101": { name: "Personal Finance 101", price: 4900 }, // $49.00 in cents
  "investing-for-beginners": { name: "Investing for Beginners", price: 7900 },
  "generational-wealth": { name: "Building Generational Wealth", price: 9900 },
  // Add more courses as needed
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  // Authenticate user using JWT session token from cookie
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  let sessionUser: { userId: string; email?: string };

  if (token) {
    try {
      const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
      if (!SECRET) throw new Error("Missing JWT secret");
      const decoded = jwt.verify(token, SECRET as string);
      sessionUser = {
        userId: (decoded as any).userId,
        email: (decoded as any).email || undefined, // If stored in token
      };
    } catch (_err) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  } else {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Parse course info from body
  const { courseSlug } = req.body;
  const course = COURSE_PRICES[courseSlug];
  if (!course) return res.status(400).json({ error: "Invalid course" });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      ...(sessionUser.email && { customer_email: sessionUser.email }), // Use email if available
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
        courseSlug,
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/course-dashboard?course=${courseSlug}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/course-enrollment?cancelled=1`,
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Stripe session creation failed" });
  }
}
