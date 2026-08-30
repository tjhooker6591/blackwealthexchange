import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  buildObjectIdOrStringFilter,
  listVerifiedBusinessOwnerships,
  parseSessionIdentity,
} from "@/lib/directoryOwnership";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const session = parseSessionIdentity(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const ownerships = await listVerifiedBusinessOwnerships(db, session.userId);

    const results = [];
    for (const ownership of ownerships) {
      const doc = await db.collection("businesses").findOne(
        buildObjectIdOrStringFilter("_id", ownership.entityId) || {
          _id: ownership.entityId as any,
        },
        {
          projection: {
            _id: 1,
            alias: 1,
            slug: 1,
            businessName: 1,
            business_name: 1,
            name: 1,
            shortSummary: 1,
            summary: 1,
            description: 1,
            email: 1,
            publicEmail: 1,
            phone: 1,
            businessPhone: 1,
            website: 1,
            address: 1,
            streetAddress: 1,
            businessAddress: 1,
            addressLine1: 1,
            addressLine2: 1,
            suite: 1,
            unit: 1,
            city: 1,
            state: 1,
            zip: 1,
            postalCode: 1,
            zipCode: 1,
            serviceArea: 1,
            category: 1,
            primaryCategory: 1,
            categories: 1,
            secondaryCategories: 1,
            image: 1,
            coverImage: 1,
            logo: 1,
            images: 1,
            galleryImages: 1,
          },
        },
      );

      if (!doc) continue;
      const profile = mapDirectoryProfileFromDoc(doc);
      results.push({
        id: String(doc._id),
        alias:
          String((doc as any).alias || (doc as any).slug || "").trim() || null,
        displayName: profile.displayName || "Business",
        shortSummary: profile.shortSummary || "",
        primaryCategory: profile.primaryCategory || "",
        city: profile.city || "",
        state: profile.state || "",
        editHref: `/edit-business?businessId=${encodeURIComponent(String(doc._id))}`,
        profileHref: `/business/profile?businessId=${encodeURIComponent(String(doc._id))}`,
        publicHref:
          (doc as any).alias || (doc as any).slug
            ? `/business/${encodeURIComponent(String((doc as any).alias || (doc as any).slug))}`
            : null,
      });
    }

    return res.status(200).json({ businesses: results });
  } catch (error) {
    console.error("[managed-businesses]", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
