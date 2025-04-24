import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { userId, jobId } = JSON.parse(req.body);

    // Validate input
    if (!userId || !jobId) {
      return res.status(400).json({ message: 'User ID and Job ID are required.' });
    }

    const client = await clientPromise;
    const db = client.db('bwes-cluster');

    // Check if job exists
    const job = await db.collection('jobs').findOne({ _id: jobId });
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Prevent duplicate saved jobs
    const alreadySaved = await db.collection('savedJobs').findOne({ userId, jobId });
    if (alreadySaved) {
      return res.status(200).json({ message: 'Job already saved.' });
    }

    // Save the job
    await db.collection('savedJobs').insertOne({
      userId,
      jobId,
      savedAt: new Date()
    });

    return res.status(200).json({ message: 'Job saved successfully.' });

  } catch (error) {
    console.error('Save Job Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
