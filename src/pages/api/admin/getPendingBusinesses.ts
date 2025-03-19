import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "../../../lib/mongodb";

interface Business {
  _id: string; // You may later convert this to ObjectId if needed
  businessName: string;
  email: string;
  address: string;
  // add other fields as needed
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Business[] | { error: string }>
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const businesses = await db
      .collection("businesses")
      .find({ approved: false })
      .toArray();

    // Cast to unknown first, then to Business[]
    return res.status(200).json(businesses as unknown as Business[]);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error fetching pending businesses:", error.message);
    } else {
      console.error("Error fetching pending businesses:", error);
    }
    return res
      .status(500)
      .json({ error: "Error fetching pending businesses" });
  }
}

