import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { buffer } from "micro";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb"; // ✅ Fixed import

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  const rawBody = await buffer(req);
  const signature = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature as string,
      webhookSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return res.status(400).send(`Webhook Error: ${err}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const businessId = session.metadata?.businessId;
    const tier = session.metadata?.tier;
    const duration = parseInt(session.metadata?.duration || "7");

    if (!businessId || !tier || !duration) {
      console.warn("Missing metadata in Stripe session");
      return res.status(400).end("Missing metadata");
    }

    try {
      const client = await clientPromise;
      const db = client.db();
      const businesses = db.collection("businesses");

      const result = await businesses.updateOne(
        { _id: new ObjectId(businessId) }, // ✅ Fixed here
        {
          $set: {
            sponsored: true,
            tier,
            paymentStatus: "paid",
            sponsoredUntil: new Date(Date.now() + duration * 86400000),
          },
        },
      );

      console.log(
        "Business updated after Stripe payment:",
        result.modifiedCount,
      );
    } catch (error) {
      console.error("Failed to update business:", error);
      return res.status(500).end("MongoDB update failed");
    }
  }

  res.status(200).end("Webhook received");
}
