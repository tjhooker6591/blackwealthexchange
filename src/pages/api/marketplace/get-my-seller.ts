import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, getJwtSecret()) as any;
    const userId = String(payload?.userId || "");
    const email = String(payload?.email || "").toLowerCase();
    if (!userId && !email)
      return res.status(401).json({ error: "Unauthorized" });

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const seller = await db.collection("sellers").findOne({
      $or: [{ userId }, { email }],
    });

    return res.status(200).json({ seller: seller || null });
  } catch (e) {
    console.error("get-my-seller failed", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
