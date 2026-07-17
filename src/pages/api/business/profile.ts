// pages/api/business/profile.ts
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret } from "@/lib/env";

type TokenPayload = {
  email?: string;
  accountType?: string;
};

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((item) => asString(item))
      .filter(Boolean);
  }
  const single = asString(value);
  return single ? [single] : [];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const raw = req.cookies["session_token"];
  if (!raw) {
    return res.status(401).json({ error: "Unauthorized: no token" });
  }

  let payload: TokenPayload;
  try {
    payload = jwt.verify(raw, getJwtSecret()) as TokenPayload;
  } catch {
    return res.status(401).json({ error: "Unauthorized: bad token" });
  }

  if (payload.accountType !== "business") {
    return res.status(403).json({ error: "Forbidden: wrong role" });
  }

  const email = asString(payload.email).toLowerCase();
  if (!email) {
    return res.status(401).json({ error: "Unauthorized: missing email" });
  }

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");
    const business = await db.collection("businesses").findOne({ email });

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const social =
      business?.social && typeof business.social === "object"
        ? business.social
        : {};

    return res.status(200).json({
      business: {
        businessName:
          asString(business.businessName) || asString(business.business_name),
        email: asString(business.email),
        businessAddress:
          asString(business.businessAddress) || asString(business.address),
        address:
          asString(business.address) || asString(business.businessAddress),
        businessPhone:
          asString(business.businessPhone) || asString(business.phone),
        phone: asString(business.phone) || asString(business.businessPhone),
        description: asString(business.description),
        website: asString(business.website),
        category:
          asString(business.category) ||
          asString(business.display_categories) ||
          asString(Array.isArray(business.categories) ? business.categories[0] : business.categories),
        categories: asStringArray(business.categories),
        city: asString(business.city),
        state: asString(business.state),
        facebook: asString(social.facebook),
        twitter: asString(social.twitter),
        image: asString(business.image) || asString(business.logo),
        logo: asString(business.logo) || asString(business.image),
        images: asStringArray(business.images),
      },
    });
  } catch (error) {
    console.error("Profile fetch error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
