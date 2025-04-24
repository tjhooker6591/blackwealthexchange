import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { senderId, receiverId, message } = JSON.parse(req.body);

    // Validate input
    if (!senderId || !receiverId || !message) {
      return res.status(400).json({ message: 'Sender ID, Receiver ID, and Message are required.' });
    }

    if (message.trim().length === 0) {
      return res.status(400).json({ message: 'Message cannot be empty.' });
    }

    const client = await clientPromise;
    const db = client.db('bwes-cluster');

    // Insert message into messages collection
    await db.collection('messages').insertOne({
      senderId,
      receiverId,
      message,
      isRead: false,
      sentAt: new Date()
    });

    return res.status(200).json({ message: 'Message sent successfully.' });

  } catch (error) {
    console.error('Send Message Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
