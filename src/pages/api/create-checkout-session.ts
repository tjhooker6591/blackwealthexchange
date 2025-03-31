import { NextApiRequest, NextApiResponse } from "next";
// import Stripe from "stripe";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
//   apiVersion: "2023-10-16",
// });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const { adType, email } = req.body;

    const priceMap: Record<string, number> = {
      "Featured Sponsor": 5000,
      "Business Directory": 3000,
      "Banner Ads": 4000,
      "Custom Solutions": 10000,
    };

    if (!priceMap[adType]) {
      return res.status(400).json({ error: "Invalid ad type selected." });
    }

    // TEMPORARY: Stripe disabled
    return res.status(200).json({
      message: "Stripe is temporarily disabled. Payment session not created.",
      adType,
      email,
      simulatedAmount: `$${(priceMap[adType] / 100).toFixed(2)}`,
    });

    // Uncomment below when Stripe is available again:
    /*
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        line_items: [
          {
            price_data: {
              currency: "usd",
              unit_amount: priceMap[adType],
              product_data: {
                name: adType,
                description: `Advertising Package: ${adType}`,
              },
            },
            quantity: 1,
          },
        ],
        customer_email: email,
        success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/advertise-form`,
      });

      return res.status(200).json({ url: session.url });
    } catch (err) {
      console.error("Stripe session error:", err);
      console.error("Payload received:", { adType, email });
      return res.status(500).json({ error: "Something went wrong creating the checkout session." });
    }
    */
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
