// src/lib/social/instagramFeature.ts
//
// Posts an approved Business of the Day feature to Instagram, at most once.
// Used by the daily scheduled job and by the admin page's "Post now" button.

import type { Db } from "mongodb";
import {
  SOCIAL_FEATURES_COLLECTION,
  buildCaption,
  findListingById,
  getPublicCardUrl,
} from "@/lib/social/businessOfTheDay";
import {
  InstagramError,
  publishImageToInstagram,
} from "@/lib/social/instagram";

// Features approved longer ago than this are not posted automatically, so
// turning the schedule on never floods the account with old approvals.
export const AUTO_POST_MAX_AGE_DAYS = 7;
// A post that started but never finished (the function was cut off) is
// released for another try after this long.
const POSTING_LOCK_MS = 10 * 60 * 1000;

export async function postFeatureToInstagram(
  db: Db,
  businessId: string,
  postedBy: string,
): Promise<{ permalink: string; mediaId: string }> {
  const features = db.collection(SOCIAL_FEATURES_COLLECTION);
  const feature = await features.findOne({ businessId });
  if (!feature || feature.status !== "approved") {
    throw new InstagramError(
      "Approve the feature before posting it to Instagram.",
    );
  }
  if (feature.instagramMediaId) {
    throw new InstagramError(
      "This feature has already been posted to Instagram.",
    );
  }
  const listing = await findListingById(db, businessId);
  if (!listing) {
    throw new InstagramError("This listing is no longer public.");
  }

  // Claim the feature so the scheduled job and a button click can never
  // post the same one twice.
  const now = new Date();
  const claimed = await features.updateOne(
    {
      businessId,
      status: "approved",
      instagramMediaId: { $exists: false },
      $or: [
        { instagramPostingAt: { $exists: false } },
        {
          instagramPostingAt: {
            $lt: new Date(now.getTime() - POSTING_LOCK_MS),
          },
        },
      ],
    },
    { $set: { instagramPostingAt: now } },
  );
  if (!claimed.modifiedCount) {
    throw new InstagramError("This feature is already being posted.");
  }

  try {
    const caption =
      String(feature.caption || "").trim() || buildCaption(listing, 0);
    const post = await publishImageToInstagram(db, {
      imageUrl: getPublicCardUrl(listing.id),
      caption,
    });
    await features.updateOne(
      { businessId },
      {
        $set: {
          instagramMediaId: post.mediaId,
          instagramPermalink: post.permalink,
          instagramPostedAt: new Date(),
          instagramPostedBy: postedBy,
        },
        $unset: { instagramPostingAt: "", instagramLastError: "" },
      },
    );
    return { permalink: post.permalink, mediaId: post.mediaId };
  } catch (error: any) {
    await features.updateOne(
      { businessId },
      {
        $set: {
          instagramLastError: String(error?.message || error).slice(0, 300),
          instagramLastErrorAt: new Date(),
        },
        $unset: { instagramPostingAt: "" },
      },
    );
    throw error;
  }
}

// The approved feature the daily job should post next: the oldest recent
// approval that has not been posted yet.
export async function nextFeatureToAutoPost(db: Db) {
  const since = new Date(
    Date.now() - AUTO_POST_MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
  );
  return db
    .collection(SOCIAL_FEATURES_COLLECTION)
    .find({
      status: "approved",
      decidedAt: { $gte: since },
      instagramMediaId: { $exists: false },
    })
    .sort({ decidedAt: 1 })
    .limit(1)
    .next();
}
