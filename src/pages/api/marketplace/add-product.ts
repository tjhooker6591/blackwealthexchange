import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, Fields, Files } from 'formidable';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { parse } from 'cookie';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Disable Next.js body parsing to handle file uploads
export const config = { api: { bodyParser: false } };

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), '/public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Helper to extract a single string value from form fields
const safeField = (field: string | string[] | undefined): string => {
  if (typeof field === 'string') return field;
  if (Array.isArray(field) && typeof field[0] === 'string') return field[0];
  return '';
};

interface AuthUser {
  userId: string;
  accountType: string;
  email: string;
}

// Decode and verify your session_token JWT
async function getAuthUser(req: NextApiRequest): Promise<AuthUser | null> {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies.session_token;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      accountType: string;
      email: string;
    };
    return {
      userId: payload.userId,
      accountType: payload.accountType,
      email: payload.email,
    };
  } catch (err) {
    console.error('JWT verify error:', err);
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // 1) Only allow POST
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2) Authenticate & authorize
  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Login required.' });
  }
  if (user.accountType !== 'seller') {
    return res.status(403).json({ error: 'Forbidden: Seller access required.' });
  }

  // 3) Ensure seller profile exists (match on _id)
  const client = await clientPromise;
  const db = client.db('bwes-cluster');
  let sellerRecord;
  try {
    sellerRecord = await db
      .collection('sellers')
      .findOne({ _id: new ObjectId(user.userId) });
  } catch (e) {
    console.error('Invalid seller ID format:', e);
    return res.status(400).json({ error: 'Bad Request: Invalid seller ID.' });
  }
  if (!sellerRecord) {
    return res.status(403).json({ error: 'Forbidden: No seller profile found.' });
  }
  const sellerId = sellerRecord._id.toString();

  // 4) Parse multipart form (file + fields)
  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    multiples: false,
  });
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  await new Promise<void>((resolve) => {
    form.parse(req, async (err: any, fields: Fields, files: Files) => {
      if (err) {
        console.error('Form parse error:', err);
        res.status(500).json({ error: 'Error parsing form data.' });
        return resolve();
      }

      // 5) Extract & validate
      const name = safeField(fields.name as any);
      const description = safeField(fields.description as any);
      const priceStr = safeField(fields.price as any);
      const category = safeField(fields.category as any);
      const imageFile = Array.isArray(files.image)
        ? files.image[0]
        : (files.image as any);

      if (!name || !priceStr || !category || !imageFile) {
        res.status(400).json({ error: 'Missing required fields.' });
        return resolve();
      }

      try {
        // 6) Save image
        const filename = `${uuidv4()}-${imageFile.originalFilename}`;
        const destPath = path.join(uploadDir, filename);
        fs.renameSync(imageFile.filepath, destPath);
        const imageUrl = `/uploads/${filename}`;

        // 7) Build product doc
        const now = new Date();
        const product = {
          sellerId,
          name,
          description,
          price: parseFloat(priceStr),
          category,
          imageUrl,
          status: 'pending',        // for admin review
          isPublished: false,
          isFeatured: false,
          stockQuantity: 10,
          salesCount: 0,
          views: 0,
          tags: [] as string[],
          variants: [] as any[],
          sku: '',
          createdAt: now,
          updatedAt: now,
          expiresAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        };

        // 8) Insert & respond
        const result = await db.collection('products').insertOne(product);
        res.status(201).json({
          product: { _id: result.insertedId, ...product },
        });
      } catch (dbErr) {
        console.error('Database error:', dbErr);
        res.status(500).json({ error: 'Failed to save product.' });
      } finally {
        resolve();
      }
    });
  });
}

