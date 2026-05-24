import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

const approvedFilter = {
  $or: [
    { status: "approved" },
    { status: "verified" },
    { status: "active" },
    { status: { $exists: false } },
    { status: "" },
    { status: null },
  ],
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const businessesFilter = {
      $and: [
        approvedFilter,
        {
          $or: [
            { isComplete: true },
            { completenessScore: { $gte: 70 } },
            { qualityScore: { $gte: 70 } },
          ],
        },
      ],
    };

    const [businesses, organizations, opportunities, products] =
      await Promise.all([
        db.collection("businesses").countDocuments(businessesFilter),
        db.collection("organizations").countDocuments(approvedFilter),
        db.collection("jobs").countDocuments({ status: "approved" }),
        db.collection("products").countDocuments({}),
      ]);

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120",
    );
    return res.status(200).json({
      businesses,
      organizations,
      opportunities,
      products,
    });
  } catch (error) {
    console.error("inventory stats failed", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
