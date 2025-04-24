import type { NextApiRequest, NextApiResponse } from 'next';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { userId, courseId } = JSON.parse(req.body);

    // Validate input
    if (!userId || !courseId) {
      return res.status(400).json({ message: 'User ID and Course ID are required.' });
    }

    const client = await clientPromise;
    const db = client.db('bwes-cluster');

    // Check if user completed the course
    const enrollment = await db.collection('enrollments').findOne({ userId, courseId });
    if (!enrollment || !enrollment.completed) {
      return res.status(400).json({ message: 'Course not completed. Certificate cannot be generated.' });
    }

    // Check if certificate already exists
    const existingCertificate = await db.collection('certificates').findOne({ userId, courseId });
    if (existingCertificate) {
      return res.status(200).json({ 
        message: 'Certificate already generated.', 
        certificateUrl: existingCertificate.certificateUrl 
      });
    }

    // Generate certificate URL (placeholder logic)
    const certificateId = `${userId}_${courseId}_${Date.now()}`;
    const certificateUrl = `https://blackwealthexchange.com/certificates/${certificateId}.pdf`;

    // Save certificate record
    await db.collection('certificates').insertOne({
      userId,
      courseId,
      certificateUrl,
      issuedAt: new Date()
    });

    return res.status(200).json({ 
      message: 'Certificate generated successfully.', 
      certificateUrl 
    });

  } catch (error) {
    console.error('Certificate Generation Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
