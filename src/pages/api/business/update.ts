// File: pages/api/business/update.ts
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret } from "@/lib/env";

interface TokenPayload {
  email: string;
  accountType: string;
  isAdmin?: boolean;
}

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalUrl(value: unknown) {
  const trimmed = asTrimmedString(value);
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function normalizeArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => asTrimmedString(entry))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [] as string[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  /* -------------------------------------------------------------- */
  /*  1. Allow only PATCH                                           */
  /* -------------------------------------------------------------- */
  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  /* -------------------------------------------------------------- */
  /*  2. Authenticate with session_token                            */
  /* -------------------------------------------------------------- */
  const raw = req.cookies["session_token"];
  if (!raw) {
    return res.status(401).json({ error: "Unauthorized: no token" });
  }

  let payload: TokenPayload;
  try {
    payload = jwt.verify(
      raw,
      getJwtSecret(), // must match /api/auth/login
    ) as TokenPayload;
  } catch {
    return res.status(401).json({ error: "Unauthorized: bad token" });
  }

  if (payload.accountType !== "business") {
    return res.status(403).json({ error: "Forbidden: wrong role" });
  }

  /* -------------------------------------------------------------- */
  /*  3. Validate request body                                      */
  /* -------------------------------------------------------------- */
  const {
    businessName,
    businessAddress,
    address,
    businessPhone,
    phone,
    description,
    email: newEmail,
    website,
    category,
    categories,
    city,
    state,
    facebook,
    twitter,
  } = req.body as {
    businessName?: string;
    businessAddress?: string;
    address?: string;
    businessPhone?: string;
    phone?: string;
    description?: string;
    email?: string;
    website?: string;
    category?: string;
    categories?: string[] | string;
    city?: string;
    state?: string;
    facebook?: string;
    twitter?: string;
  };

  const normalizedBusinessName = asTrimmedString(businessName);
  const normalizedAddress = asTrimmedString(businessAddress || address);
  const normalizedPhone = asTrimmedString(businessPhone || phone);
  const normalizedDescription = asTrimmedString(description);
  const normalizedEmail = asTrimmedString(newEmail).toLowerCase();
  const normalizedWebsite = normalizeOptionalUrl(website);
  const normalizedCategory = asTrimmedString(category);
  const normalizedCategories = normalizeArray(categories);
  const normalizedCity = asTrimmedString(city);
  const normalizedState = asTrimmedString(state).toUpperCase();
  const normalizedFacebook = normalizeOptionalUrl(facebook);
  const normalizedTwitter = normalizeOptionalUrl(twitter);

  if (
    !normalizedBusinessName &&
    !normalizedAddress &&
    !normalizedPhone &&
    !normalizedDescription &&
    !normalizedEmail &&
    !normalizedWebsite &&
    !normalizedCategory &&
    !normalizedCategories.length &&
    !normalizedCity &&
    !normalizedState &&
    !normalizedFacebook &&
    !normalizedTwitter
  ) {
    return res.status(400).json({ error: "No fields to update" });
  }

  /* -------------------------------------------------------------- */
  /*  4. Perform the update                                         */
  /* -------------------------------------------------------------- */
  try {
    const db = (await clientPromise).db("bwes-cluster");

    const update: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (normalizedBusinessName) {
      update.businessName = normalizedBusinessName;
      update.business_name = normalizedBusinessName;
      update.title = normalizedBusinessName;
    }

    if (normalizedAddress) {
      update.businessAddress = normalizedAddress;
      update.address = normalizedAddress;
    }

    if (normalizedPhone) {
      update.businessPhone = normalizedPhone;
      update.phone = normalizedPhone;
    }

    if (normalizedDescription) {
      update.description = normalizedDescription;
    }

    if (normalizedEmail) {
      update.email = normalizedEmail;
    }

    if (normalizedWebsite) {
      update.website = normalizedWebsite;
    }

    if (normalizedCategory) {
      update.category = normalizedCategory;
      update.display_categories = normalizedCategory;
      if (!normalizedCategories.length) {
        update.categories = [normalizedCategory];
      }
    }

    if (normalizedCategories.length) {
      update.categories = normalizedCategories;
      if (!normalizedCategory) {
        update.display_categories = normalizedCategories.join(", ");
      }
    }

    if (normalizedCity) {
      update.city = normalizedCity;
    }

    if (normalizedState) {
      update.state = normalizedState;
    }

    if (normalizedFacebook || normalizedTwitter) {
      update.social = {
        ...(normalizedFacebook ? { facebook: normalizedFacebook } : {}),
        ...(normalizedTwitter ? { twitter: normalizedTwitter } : {}),
      };
    }

    const result = await db.collection("businesses").updateOne(
      { email: payload.email },
      {
        $set: update,
      },
    );

    if (!result.matchedCount) {
      return res.status(404).json({ error: "Business not found" });
    }

    return res.status(200).json({ message: "Business updated successfully" });
  } catch (err) {
    console.error("Business update error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
