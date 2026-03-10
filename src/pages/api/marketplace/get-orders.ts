import { NextApiRequest, NextApiResponse } from "next";
import { parse } from "cookie";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";

function getSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Define JWT_SECRET or NEXTAUTH_SECRET in env vars");
  }
  return secret;
}

const SECRET = getSecret();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const authHeader = req.headers.authorization;
  let token: string | undefined;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookies = parse(req.headers.cookie || "");
    token = cookies.session_token || cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  let decoded: { userId: string; accountType: string };
  try {
    decoded = jwt.verify(token, SECRET) as {
      userId: string;
      accountType: string;
    };
  } catch {
    return res.status(401).json({ error: "Unauthorized: Invalid token" });
  }

  if (decoded.accountType !== "seller") {
    return res.status(403).json({ error: "Forbidden: Not a seller" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const orders = await db
      .collection("orders")
      .find({ sellerId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return res.status(200).json({ orders });
  } catch (error) {
    console.error("Failed to fetch orders:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
