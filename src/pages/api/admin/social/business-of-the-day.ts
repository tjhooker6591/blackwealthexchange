import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { sendEmail } from "@/lib/sendEmail";
import {
  SOCIAL_FEATURES_COLLECTION,
  buildCaption,
  buildCard,
  buildOwnerEmail,
  findListingById,
  getListingUrl,
  listRecentFeatures,
  pickCandidate,
  recordDecision,
} from "@/lib/social/businessOfTheDay";
import { InstagramError, isInstagramConfigured } from "@/lib/social/instagram";
import { postFeatureToInstagram } from "@/lib/social/instagramFeature";

// Posting to Instagram waits for Instagram to process the image, which can
// take longer than the default 10 seconds.
export const config = { maxDuration: 60 };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!["GET", "POST"].includes(req.method || "")) {
    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    if (req.method === "GET") {
      const city = typeof req.query.city === "string" ? req.query.city : "";
      const [{ listing, remaining }, history, instagramConfigured] =
        await Promise.all([
          pickCandidate(db, { city }),
          listRecentFeatures(db),
          isInstagramConfigured(db),
        ]);
      return res.status(200).json({
        ok: true,
        remaining,
        history,
        instagramConfigured,
        candidate: listing
          ? {
              listing,
              listingUrl: getListingUrl(listing),
              caption: buildCaption(listing, history.length),
              card: buildCard(listing),
              ownerEmail: listing.email ? buildOwnerEmail(listing) : null,
            }
          : null,
      });
    }

    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const action = String(body.action || "");
    const listing = await findListingById(db, String(body.businessId || ""));
    if (!listing) {
      return res.status(404).json({ ok: false, error: "Business not found" });
    }
    const decidedBy = admin.email || admin.userId || "admin";

    if (action === "approve" || action === "skip") {
      await recordDecision(db, {
        listing,
        status: action === "approve" ? "approved" : "skipped",
        caption: String(body.caption || ""),
        decidedBy,
      });
      return res.status(200).json({ ok: true, action });
    }

    if (action === "send_owner_email") {
      const features = db.collection(SOCIAL_FEATURES_COLLECTION);
      const feature = await features.findOne({ businessId: listing.id });
      if (!feature || feature.status !== "approved") {
        return res.status(409).json({
          ok: false,
          error: "Approve the feature before emailing the owner.",
        });
      }
      if (feature.ownerEmailSentAt) {
        return res.status(409).json({
          ok: false,
          error: "The owner has already been emailed about this feature.",
        });
      }
      if (!listing.email) {
        return res.status(400).json({
          ok: false,
          error: "This listing has no email address on file.",
        });
      }
      const email = buildOwnerEmail(listing);
      await sendEmail(email);
      await features.updateOne(
        { businessId: listing.id },
        {
          $set: {
            ownerEmailSentAt: new Date(),
            ownerEmailTo: email.to,
            ownerEmailSentBy: decidedBy,
          },
        },
      );
      return res.status(200).json({ ok: true, action, to: email.to });
    }

    if (action === "publish_instagram") {
      const post = await postFeatureToInstagram(db, listing.id, decidedBy);
      return res
        .status(200)
        .json({ ok: true, action, permalink: post.permalink });
    }

    return res.status(400).json({ ok: false, error: "Unknown action" });
  } catch (error: any) {
    if (error instanceof InstagramError) {
      return res.status(502).json({ ok: false, error: error.message });
    }
    console.error("[admin/social/business-of-the-day]", error);
    return res
      .status(500)
      .json({ ok: false, error: error?.message || "Internal Server Error" });
  }
}
