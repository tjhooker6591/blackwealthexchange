import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { parse } from "cookie";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-key";

// Set your admin email here too, to act as a fallback
const ADMIN_EMAIL = "youradmin@email.com"; // 🔁 Replace with your actual admin email

interface DecodedToken {
  accountType: string;
  isAdmin?: boolean;
  email: string;
  userId: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const raw = req.headers.cookie || "";
    const cookies = parse(raw);
    const token = cookies.session_token;

    if (!token) {
      return res.status(401).json({ error: "Unauthorized: No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as DecodedToken;

    // 🔍 Optional log for debugging — remove in production
    console.log("🛡️ Decoded Token:", decoded);

    // ✅ Final admin check
    const isAdmin = decoded.isAdmin === true || decoded.email === ADMIN_EMAIL;
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "Forbidden: Admin access required" });
    }

    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const jobs = await db
      .collection("jobs")
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({ jobs });
  } catch (error) {
    console.error("❌ Error fetching unapproved jobs:", error);
    return res.status(500).json({ error: "Failed to fetch jobs" });
  }
}
