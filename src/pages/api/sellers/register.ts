// pages/api/sellers/register.ts
import { NextApiRequest, NextApiResponse } from 'next';

// Simulated database import or service call
import { saveSellerToDatabase } from '@/services/sellerService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    try {
      const { name, email, businessName, website, phone } = req.body;

      // Basic Validation
      if (!name || !email || !businessName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Save to database (mock or actual service)
      const seller = await saveSellerToDatabase({
        name,
        email,
        businessName,
        website,
        phone,
      });

      return res.status(201).json({
        message: 'Seller registered successfully',
        seller,
      });
    } catch (error) {
      console.error('Error registering seller:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
}