// pages/api/admin/getPendingBusinesses.ts

import clientPromise from "../../../lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const businessesCollection = db.collection("businesses");

    const pendingBusinesses = await businessesCollection
      .find({ isVerified: false })
      .toArray();

    res.status(200).json(pendingBusinesses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching pending businesses" });
  }
}
