// pages/api/business/signup.js

import dbConnect from &quot;../../lib/dbConnect&quot;; // MongoDB connection utility

export default async function handler(req, res) {
  if (req.method !== &quot;POST&quot;) {
    return res.status(405).json({ error: &quot;Method Not Allowed&quot; });
  }

  const { businessName, email, phone, address, description } = req.body;

  // Validate input data
  if (!businessName || !email || !phone || !address) {
    return res.status(400).json({ error: &quot;All fields are required&quot; });
  }

  try {
    const client = await dbConnect();
    const database = client.db(&quot;bwes-cluster&quot;); // Ensure this is your actual database name
    const businessesCollection = database.collection(&quot;businesses&quot;);

    // Check if the business already exists by email or business name
    const existingBusiness = await businessesCollection.findOne({
      $or: [{ email }, { businessName }],
    });
    if (existingBusiness) {
      return res.status(400).json({ error: &quot;Business already exists&quot; });
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

    res.status(201).json({ message: &quot;Business created successfully&quot;, business: result.ops[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: &quot;Error creating business&quot; });
  }
}
