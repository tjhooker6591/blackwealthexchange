import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  getCurrentFeature,
  getFeaturedDateForBusiness,
  getPreviewFeature,
} from "@/lib/social/businessOfTheDay";

// Public, read-only. With no query it returns the current Business of the
// Day for the homepage; with ?businessId= or ?slug= it returns when that
// business was featured, for the badge on its listing page.
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const businessId =
      typeof req.query.businessId === "string" ? req.query.businessId : "";
    const slug = typeof req.query.slug === "string" ? req.query.slug : "";

    // ?preview=1 shows how a feature would look without approving one. It
    // is ignored on the deployed site.
    const preview =
      process.env.NODE_ENV !== "production" && req.query.preview === "1";
    if (preview) {
      res.setHeader("Cache-Control", "no-store");
      if (businessId || slug) {
        return res
          .status(200)
          .json({ ok: true, featuredAt: new Date().toISOString() });
      }
      const city = typeof req.query.city === "string" ? req.query.city : "";
      return res
        .status(200)
        .json({ ok: true, feature: await getPreviewFeature(db, city) });
    }

    res.setHeader("Cache-Control", "public, s-maxage=60, max-age=0");

    if (businessId || slug) {
      const featuredAt = await getFeaturedDateForBusiness(db, {
        businessId,
        slug,
      });
      return res.status(200).json({ ok: true, featuredAt });
    }

    return res
      .status(200)
      .json({ ok: true, feature: await getCurrentFeature(db) });
  } catch (error) {
    console.error("[business-of-the-day]", error);
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}
