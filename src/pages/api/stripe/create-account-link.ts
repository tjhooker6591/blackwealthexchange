import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

function getOrigin(req: NextApiRequest) {
  const origin = req.headers.origin as string | undefined;
  if (origin) return origin;
  const host = req.headers.host;
  return host ? `http://${host}` : "http://localhost:3000";
}

function getSession(req: NextApiRequest) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;
  if (!token) return null;

  const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!SECRET) throw new Error("JWT_SECRET is not set");

  const decoded = jwt.verify(token, SECRET) as any;
  return { userId: decoded?.userId as string, email: decoded?.email as string };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const session = getSession(req);
    if (!session?.userId)
      return res.status(401).json({ error: "Unauthorized" });

    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const sellers = db.collection("sellers");

    const seller = await sellers.findOne({
      $or: [
        { userId: session.userId },
        ...(session.email ? [{ email: session.email }] : []),
      ],
    });

    if (!seller) return res.status(400).json({ error: "Seller not found" });

    let stripeAccountId = seller.stripeAccountId as string | undefined;

    // Create Stripe Express account if missing
    if (!stripeAccountId) {
      const acct = await stripe.accounts.create({
        type: "express",
        email: session.email || undefined,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      });

      stripeAccountId = acct.id;

      await sellers.updateOne(
        { _id: seller._id },
        { $set: { stripeAccountId, stripeConnectedAt: new Date() } },
      );
    }

    const origin = getOrigin(req);

    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      type: "account_onboarding",
      refresh_url: `${origin}/marketplace/dashboard?stripe=refresh`,
      return_url: `${origin}/marketplace/dashboard?stripe=return`,
    });

    return res.status(200).json({ url: link.url, stripeAccountId });
  } catch (err: any) {
    console.error("create-account-link error:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
