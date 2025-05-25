import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
// import { ObjectId } from "mongodb"; // Reserved for future use if needed
import { sendBusinessAlert } from "@/lib/sendEmail";

// const MAX_SLOTS = 10; // Reserved for future use if needed
const SLOT_DURATION_DAYS = 30;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST" && req.method !== "GET") return res.status(405).end();

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const now = new Date();

    // Find all expired slots
    const expiredSlots = await db.collection("directory_listings").find({
      featuredSlot: { $ne: null },
      featuredEndDate: { $lt: now },
      status: "approved",
      paid: true,
    }).toArray();

    let changes = [];
    for (const expired of expiredSlots) {
      // Remove business from slot, mark as expired
      await db.collection("directory_listings").updateOne(
        { _id: expired._id },
        {
          $set: {
            status: "expired",
            featuredSlot: null,
            featuredStartDate: null,
            featuredEndDate: null,
          },
          $unset: { queuePosition: "" }
        }
      );

      // Send expiration email
      if (expired.businessEmail) {
        await sendBusinessAlert(
          expired.businessEmail,
          "Your Featured Directory Slot Has Ended",
          `<p>Hi ${expired.businessName || "Business Owner"},<br><br>
          Your featured slot on Black Wealth Exchange has ended.<br>
          Thank you for participating! To get featured again, please renew or join the waitlist.<br><br>
          — Black Wealth Exchange Team</p>`
        );
      }

      // Promote next in queue to open slot (if any)
      const nextBusiness = await db.collection("directory_listings").findOne({
        featuredSlot: null,
        status: "approved",
        paid: true,
      }, { sort: { queuePosition: 1 } });

      if (nextBusiness) {
        await db.collection("directory_listings").updateOne(
          { _id: nextBusiness._id },
          {
            $set: {
              featuredSlot: expired.featuredSlot,
              featuredStartDate: now,
              featuredEndDate: new Date(now.getTime() + SLOT_DURATION_DAYS * 24 * 60 * 60 * 1000),
              queuePosition: null,
            }
          }
        );

        // Send promotion email
        if (nextBusiness.businessEmail) {
          await sendBusinessAlert(
            nextBusiness.businessEmail,
            "Congratulations! Your Business is Now Featured",
            `<p>Hi ${nextBusiness.businessName || "Business Owner"},<br><br>
            Your business has been promoted to a featured slot in the Black Wealth Exchange directory!<br>
            Your slot is now active for ${SLOT_DURATION_DAYS} days.<br><br>
            Thank you for supporting our community.<br>
            — Black Wealth Exchange Team</p>`
          );
        }

        changes.push({
          slot: expired.featuredSlot,
          expired: expired.businessName || expired._id,
          promoted: nextBusiness.businessName || nextBusiness._id,
        });
      } else {
        changes.push({
          slot: expired.featuredSlot,
          expired: expired.businessName || expired._id,
          promoted: null,
        });
      }
    }

    res.status(200).json({
      success: true,
      processed: expiredSlots.length,
      changes,
      ranAt: new Date(),
    });
  } catch (err) {
    console.error("Auto-promotion CRON error:", err);
    res.status(500).json({ error: "Directory CRON failed" });
  }
}
