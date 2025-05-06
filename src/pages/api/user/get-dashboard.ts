// File: pages/api/user/get-dashboard.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";
import { getServerSession } from "next-auth/next";
import authOptions from "../auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Use NextAuth to get the session
  const session = (await getServerSession(req, res, authOptions)) as import("next-auth").Session | null;
  if (!session || !session.user || !session.user.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const db = (await clientPromise).db("bwes-cluster");
    const userEmail = session.user.email;

    // Try to find the business by email
    const business = await db
      .collection("businesses")
      .findOne({ email: userEmail });
    if (!business) {
      return res.status(404).json({ error: "No business found" });
    }

    return res.status(200).json({ business });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
