// pages/api/business/signup.js

import dbConnect from "../../lib/dbConnect"; // MongoDB connection utility

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { businessName, email, phone, address, description } = req.body;

  // Validate input data
  if (!businessName || !email || !phone || !address) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const client = await dbConnect();
    const database = client.db("bwes-cluster"); // Ensure this is your actual database name
    const businessesCollection = database.collection("businesses");

    // Check if the business already exists by email or business name
    const existingBusiness = await businessesCollection.findOne({
      $or: [{ email }, { businessName }],
    });
    if (existingBusiness) {
      return res.status(400).json({ error: "Business already exists" });
    }

    // Insert the new business into the database
    const result = await businessesCollection.insertOne({
      businessName,
      email,
      phone,
      address,
      description,
      isVerified: false, // Default verification status is false
      createdAt: new Date(),
    });

    res
      .status(201)
      .json({
        message: "Business created successfully",
        business: result.ops[0],
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creating business" });
  }
}
