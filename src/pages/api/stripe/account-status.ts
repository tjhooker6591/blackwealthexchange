import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import clientPromise from "@/lib/mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

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
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const session = getSession(req);
    if (!session?.userId)
      return res.status(401).json({ error: "Unauthorized" });

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Robust lookup: userId first, fallback to email
    const seller = await db.collection("sellers").findOne({
      $or: [
        { userId: session.userId },
        ...(session.email ? [{ email: session.email }] : []),
      ],
    });

    if (!seller) return res.status(404).json({ error: "Seller not found" });

    if (!seller.stripeAccountId) {
      return res.status(200).json({
        connected: false,
        stripeAccountId: null,
        detailsSubmitted: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        requirements: [],
      });
    }

    const account = await stripe.accounts.retrieve(
      String(seller.stripeAccountId),
    );

    return res.status(200).json({
      connected: true,
      stripeAccountId: account.id,
      detailsSubmitted: Boolean((account as any).details_submitted),
      chargesEnabled: Boolean((account as any).charges_enabled),
      payoutsEnabled: Boolean((account as any).payouts_enabled),
      requirements: (account as any).requirements?.currently_due || [],
    });
  } catch (err: any) {
    console.error("Error fetching Stripe account status:", err);
    return res.status(500).json({ error: err?.message || "Server error" });
  }
}
