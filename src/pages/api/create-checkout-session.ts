import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { adType, email, businessId, duration = 7 } = req.body;

    const priceMap: Record<string, { amount: number; tier: string }> = {
      "Featured Sponsor": { amount: 5000, tier: "top" },
      "Business Directory": { amount: 3000, tier: "standard" },
      "Banner Ads": { amount: 4000, tier: "standard" },
      "Custom Solutions": { amount: 10000, tier: "custom" },
    };

    const pricing = priceMap[adType];
    if (!pricing) {
      return res.status(400).json({ error: "Invalid ad type selected." });
    }

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: pricing.amount,
              product_data: {
                name: adType,
                description: `Advertising Package: ${adType}`,
              },
            },
            quantity: 1,
          },
        ],
        customer_email: email,
        metadata: {
          businessId,
          tier: pricing.tier,
          duration: duration.toString(),
          adType,
        },
        success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/advertise-form`,
      });

      return res.status(200).json({ url: session.url });
    } catch (err) {
      console.error("Stripe session error:", err);
      return res.status(500).json({ error: "Something went wrong creating the checkout session." });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
