import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const MAX_SLOTS = 10; // You can adjust this for however many featured slots you want!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { listingId } = req.body;
    if (!listingId) return res.status(400).json({ error: "No listingId provided" });

    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const now = new Date();

    // How many featured slots are currently filled?
    const slotsFilled = await db.collection("directory_listings").countDocuments({
      featuredSlot: { $ne: null },
      featuredEndDate: { $gt: now },
      status: "approved",
      paid: true,
    });

    let update: Record<string, any> = { status: "approved" };

    if (slotsFilled < MAX_SLOTS) {
      // Assign directly to a featured slot
      update = {
        ...update,
        featuredSlot: slotsFilled + 1,
        featuredStartDate: now,
        featuredEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        queuePosition: null,
      };
    } else {
      // Add to waitlist/queue
      const lastInQueue = await db.collection("directory_listings")
        .find({ featuredSlot: null, status: "approved", paid: true })
        .sort({ queuePosition: -1 })
        .limit(1)
        .toArray();
      const nextPosition = (lastInQueue[0]?.queuePosition || 0) + 1;
      update = { ...update, queuePosition: nextPosition };
    }

    await db.collection("directory_listings").updateOne(
      { _id: new ObjectId(listingId) },
      { $set: update }
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Error in approve-directory-listing:", err);
    res.status(500).json({ error: "Approval failed" });
  }
}
