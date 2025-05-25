import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";

const MAX_SLOTS = 10; // You can make this dynamic

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const now = new Date();

    // 1. Get all currently featured listings (not expired)
    const featured = await db.collection("directory_listings").find({
      featuredSlot: { $ne: null },
      featuredEndDate: { $gt: now },
      status: "approved",
      paid: true,
    })
    .sort({ featuredSlot: 1 })
    .toArray();

    // 2. Get the waitlist
    const waitlist = await db.collection("directory_listings").find({
      featuredSlot: null,
      status: "approved",
      paid: true,
    })
    .sort({ queuePosition: 1, createdAt: 1 })
    .toArray();

    // 3. Calculate slots available
    const slotsFilled = featured.length;
    const slotsAvailable = MAX_SLOTS - slotsFilled;

    // 4. See who is up next
    const nextUp = waitlist[0] || null;

    // 5. List upcoming expirations
    const expiringSoon = featured.filter(f =>
      f.featuredEndDate && f.featuredEndDate.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000
    ); // expiring in the next 7 days

    res.status(200).json({
      slotsFilled,
      slotsAvailable,
      maxSlots: MAX_SLOTS,
      featured,
      waitlist,
      nextUp,
      expiringSoon,
    });
  } catch (err) {
    console.error("[directory-slots] error:", err);
    res.status(500).json({ error: "Failed to load slot info" });
  }
}
