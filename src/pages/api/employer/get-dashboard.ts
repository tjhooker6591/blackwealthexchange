import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email } = req.query;

  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required and must be a string" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const employer = await db.collection("businesses").findOne({ email });

    if (!employer) {
      return res.status(404).json({ error: "Employer not found" });
    }

    const businessName = employer.businessName || "Business";
    const listings = employer.listings?.length || 0;
    const applicants = employer.applicants?.length || 0;
    const messages = employer.messages?.length || 0;

    return res.status(200).json({ businessName, listings, applicants, messages });
  } catch (error) {
    console.error("Employer dashboard fetch error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
