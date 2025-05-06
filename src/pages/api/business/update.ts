// File: pages/api/business/update.ts
import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";

interface TokenPayload {
  email: string;
  accountType: string;
  isAdmin?: boolean;
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
      process.env.JWT_SECRET as string, // must match /api/auth/login
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
    businessPhone,
    description,
    email: newEmail, // optional – allow email change
  } = req.body as {
    businessName?: string;
    businessAddress?: string;
    businessPhone?: string;
    description?: string;
    email?: string;
  };

  if (
    !businessName &&
    !businessAddress &&
    !businessPhone &&
    !description &&
    !newEmail
  ) {
    return res.status(400).json({ error: "No fields to update" });
  }

  /* -------------------------------------------------------------- */
  /*  4. Perform the update                                         */
  /* -------------------------------------------------------------- */
  try {
    const db = (await clientPromise).db("bwes-cluster");

    const result = await db.collection("businesses").updateOne(
      { email: payload.email }, // locate by token email
      {
        $set: {
          ...(businessName && { businessName }),
          ...(businessAddress && { businessAddress }),
          ...(businessPhone && { businessPhone }),
          ...(description && { description }),
          ...(newEmail && { email: newEmail }), // allow email change
          updatedAt: new Date(),
        },
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
