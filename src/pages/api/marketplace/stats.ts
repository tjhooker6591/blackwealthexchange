// src/pages/api/marketplace/stats.ts
import { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1) Disable HTTP caching so client always fetches fresh data
  res.setHeader("Cache-Control", "no-store, max-age=0");

  // 2) Only allow GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 3) Parse the JWT from the session_token cookie
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.session_token || cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  // 4) Verify & decode
  let decoded: { userId: string; email: string; accountType: string };
  try {
    decoded = jwt.verify(token, JWT_SECRET) as typeof decoded;
  } catch (err) {
    console.error("JWT verify error in stats:", err);
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  // 5) Ensure this is a seller
  if (decoded.accountType !== "seller") {
    return res.status(403).json({ error: "Forbidden: Not a seller" });
  }
  const sellerId = decoded.userId;

  try {
    // 6) Reuse the singleton client
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    // 7) Count products
    const products = await db
      .collection("products")
      .countDocuments({ sellerId });

    // 8) Aggregate orders to get count & total revenue
    const [orderStats] = await db
      .collection("orders")
      .aggregate([
        { $match: { sellerId } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: "$totalPrice" },
          },
        },
      ])
      .toArray();

    const orders = orderStats?.count || 0;
    const revenue = orderStats?.revenue || 0;

    // 9) Return real data
    return res.status(200).json({ products, orders, revenue });
  } catch (err) {
    console.error("Stats error:", err);
    return res.status(500).json({ error: "Failed to fetch seller stats" });
  }
}

