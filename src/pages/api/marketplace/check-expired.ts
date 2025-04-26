import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db('bwes-cluster');
    const products = db.collection('products');

    const today = new Date();

    const result = await products.updateMany(
      { expiresAt: { $lte: today }, status: { $ne: 'expired' } },
      { $set: { status: 'expired' } }
    );

    return res.status(200).json({
      message: 'Expired products updated successfully.',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error checking expired products:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
