import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-02-24.acacia',
  });

export default async function webhookHandler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const sig = req.headers['stripe-signature'] as string;
  const buf = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return res.status(400).send('Webhook Error');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    const { userId, itemId, type, amount } = metadata;

    try {
      const client = await clientPromise;
      const db = client.db();

      await db.collection('orders').insertOne({
        userId,
        itemId,
        type,
        amount: parseFloat(amount),
        stripeSessionId: session.id,
        status: 'paid',
        createdAt: new Date(),
      });

      if (type === 'course') {
        await db.collection('users').updateOne(
          { _id: new ObjectId(userId) },
          { $set: { isPremium: true } }
        );
      }
    } catch (err) {
      console.error('Failed to write order to DB', err);
      return res.status(500).send('Internal Error');
    }
  }

  res.status(200).json({ received: true });
}
