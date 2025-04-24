import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { userId } = req.query;

    // Validate userId
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ message: 'User ID is required.' });
    }

    const client = await clientPromise;
    const db = client.db('bwes-cluster');

    // Fetch notifications for the user, sorted by newest first
    const notifications = await db.collection('notifications')
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)  // Limit to latest 50 notifications
      .toArray();

    return res.status(200).json({ notifications });

  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
