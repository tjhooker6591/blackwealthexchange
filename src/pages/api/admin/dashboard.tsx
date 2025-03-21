// src/pages/api/admin/dashboard.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

// Define the shape of a business returned by your API
interface Business {
  _id: string;
  businessName: string;
  email: string;
  address: string;
  // Add additional fields if needed
}

// Define the shape of the MongoDB document
interface MongoBusiness {
  _id: { toString(): string };
  businessName?: string;
  email?: string;
  address?: string;
  // Other optional fields that may exist in the document
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Business[] | { error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(); // Uses the default database specified in your connection URI

    // Fetch all businesses from the "businesses" collection and cast them as MongoBusiness[]
    const businesses = (await db
      .collection("businesses")
      .find({})
      .toArray()) as MongoBusiness[];

    // Map MongoDB documents to the expected Business type
    const formattedBusinesses: Business[] = businesses.map(
      (business: MongoBusiness) => ({
        _id: business._id.toString(), // Convert ObjectId to string
        businessName: business.businessName || "",
        email: business.email || "",
        address: business.address || "",
      }),
    );

    res.status(200).json(formattedBusinesses);
  } catch (error) {
    console.error("Error fetching businesses:", error);
    res.status(500).json({ error: "Error fetching businesses" });
  }
}