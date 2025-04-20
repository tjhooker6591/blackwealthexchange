// src/pages/api/marketplace/stats.ts
import { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";

// Helper to load the JWT secret from environment
function getSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("🛑 Define JWT_SECRET or NEXTAUTH_SECRET in your environment variables");
  }
  return secret;
}
const SECRET = getSecret();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Disable HTTP caching so client always fetches fresh data
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // Only allow GET
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Extract JWT from Authorization header (Bearer) or cookies
  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookies = parse(req.headers.cookie || "");
    token = cookies.session_token || cookies.token;
  }
  if (!token) {
    console.error("Stats: No token provided");
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  // Verify & decode
  let decoded: { userId: string; email: string; accountType: string };
  try {
    const verified = jwt.verify(token, SECRET);
    decoded = verified as { userId: string; email: string; accountType: string };
  } catch (err) {
    console.error("Stats: JWT verify error:", err);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  // Ensure this is a seller
  if (decoded.accountType !== "seller") {
    return res.status(403).json({ error: "Forbidden: Not a seller" });
  }
  const sellerId = decoded.userId;

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // Count products belonging to this seller
    const products = await db.collection("products").countDocuments({ sellerId });

    // Aggregate orders to get count & total revenue
    const [orderStats] = await db
      .collection("orders")
      .aggregate([
        { $match: { sellerId } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: "$totalPrice" }
          }
        }
      ])
      .toArray();

    const orders = orderStats?.count ?? 0;
    const revenue = orderStats?.revenue ?? 0;

    // Return stats
    return res.status(200).json({ products, orders, revenue });
  } catch (err) {
    console.error("Stats: Database error:", err);
    return res.status(500).json({ error: "Failed to fetch seller stats" });
  }
}
