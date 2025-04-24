import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  const userId = req.query.userId?.toString();

  if (!userId) return res.status(400).json({ message: 'User ID is required' });

  try {
    const client = await clientPromise;
    const db = client.db('bwes-cluster');

    const affiliate = await db.collection('affiliates').findOne({ userId });

    if (!affiliate) {
      return res.status(404).json({ message: 'Affiliate profile not found.' });
    }

    return res.status(200).json({ referralLink: affiliate.referralLink });
  } catch (err) {
    console.error("Error fetching affiliate link:", err);
    return res.status(500).json({ message: 'Server error' });
  }
}
