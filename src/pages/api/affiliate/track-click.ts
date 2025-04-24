import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { affiliateId } = JSON.parse(req.body);

    if (!affiliateId) {
      return res.status(400).json({ message: 'Affiliate ID required' });
    }

    const client = await clientPromise;
    const db = client.db('bwes-cluster');

    // Log the click
    await db.collection('affiliateClicks').insertOne({
      affiliateId,
      clickedAt: new Date()
    });

    // Increment click count in affiliate profile
    await db.collection('affiliates').updateOne(
      { affiliateId },
      { $inc: { clicks: 1 } }
    );

    return res.status(200).json({ message: 'Click tracked.' });

  } catch (err) {
    console.error('Track Click Error:', err);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
