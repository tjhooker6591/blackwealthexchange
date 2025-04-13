// pages/api/business/update.ts
import { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { email } = req.cookies;
  const { businessName, businessAddress, businessPhone, description } =
    req.body;

  if (!email) {
    return res
      .status(401)
      .json({ error: "Unauthorized: No email found in cookies" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const result = await db.collection("businesses").updateOne(
      { email },
      {
        $set: {
          businessName,
          businessAddress,
          businessPhone,
          description,
          updatedAt: new Date(),
        },
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: "Business not found or unchanged" });
    }

    return res.status(200).json({ message: "Business updated successfully." });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
