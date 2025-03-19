import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../../lib/mongodb";

interface Business {
  _id: string; // You may change this to ObjectId if you import it from mongodb
  businessName: string;
  email: string;
  address: string;
  approved: boolean;
  // Add any additional fields as needed.
}

type Data =
  | { businesses: Business[] }
  | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("your_database_name"); // Replace with your DB name
    const businesses: Business[] = await db
      .collection<Business>("businesses")
      .find({ approved: false })
      .toArray();

    return res.status(200).json({ businesses });
  } catch (error: unknown) {
    console.error("Error fetching businesses:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

