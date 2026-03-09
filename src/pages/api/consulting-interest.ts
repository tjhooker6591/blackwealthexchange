// src/pages/api/consulting-interest.ts

import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

type Data =
  | { success: true; message: string }
  | { success: false; error: string };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ success: false, error: "Method Not Allowed" });
  }

  try {
    const rawName = typeof req.body?.name === "string" ? req.body.name : "";
    const rawEmail = typeof req.body?.email === "string" ? req.body.email : "";

    const name = rawName.trim();
    const email = rawEmail.trim().toLowerCase();

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: "Name and email are required.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email address.",
      });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    // Optional duplicate protection:
    const existing = await db
      .collection("consulting_interest")
      .findOne({ email });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: "Your interest has already been recorded.",
      });
    }

    await db.collection("consulting_interest").insertOne({
      name,
      email,
      createdAt: new Date(),
      status: "new",
      source: "website",
    });

    return res.status(200).json({
      success: true,
      message: "Interest saved successfully.",
    });
  } catch (error) {
    console.error("consulting-interest error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to save interest.",
    });
  }
}
