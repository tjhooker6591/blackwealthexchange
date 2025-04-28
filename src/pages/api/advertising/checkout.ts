import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { option, duration, userId } = req.body;

  if (!option || !duration || !userId) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const pricingTable: Record<string, number> = {
    "14": 2500,
    "30": 4500,
    "60": 8000,
  };

  const amount = pricingTable[duration];
  if (!amount) {
    return res.status(400).json({ error: "Invalid campaign duration." });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Featured Sponsor Ad - ${duration} Days`,
              description: `Advertising Package: ${option}`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/advertise/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/advertise/cancel`,
      metadata: {
        userId,
        adType: option,
        duration,
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe session creation failed:", err.message);
    return res
      .status(500)
      .json({ error: "Failed to create checkout session." });
  }
}
