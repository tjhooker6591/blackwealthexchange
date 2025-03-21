// src/pages/api/sellers/register.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { saveSellerToDatabase, Seller } from "@/services/sellerService";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    try {
      const { name, email, businessName, website, phone } = req.body;

      // Basic validation: Check if required fields are provided
      if (!name || !email || !businessName) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Save the seller to the database using our service
      const seller: Seller = await saveSellerToDatabase({
        name,
        email,
        businessName,
        website,
        phone,
      });

      return res.status(201).json({
        message: "Seller registered successfully",
        seller,
      });
    } catch (error) {
      console.error("Error registering seller:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
}
