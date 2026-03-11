import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import { ObjectId } from "mongodb";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, getJwtSecret()) as any;
    const userId = String(payload?.userId || "");
    const email = String(payload?.email || "").toLowerCase();

    const {
      artistName,
      creatorName,
      genre,
      bio,
      website,
      agreed,
      creatorGoal,
    } = req.body || {};

    if (!agreed) {
      return res
        .status(400)
        .json({ error: "You must agree to the creator terms." });
    }

    if (!artistName || String(artistName).trim().length < 2) {
      return res.status(400).json({ error: "Artist name is required." });
    }
    if (!bio || String(bio).trim().length < 10) {
      return res.status(400).json({ error: "Bio must be at least 10 chars." });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    let seller = await db.collection("sellers").findOne({
      $or: [{ userId }, { email }],
    });

    if (!seller) {
      const u = await db.collection("users").findOne({
        $or: [
          ...(ObjectId.isValid(userId) ? [{ _id: new ObjectId(userId) }] : []),
          { email },
        ],
      });

      if (!u?.password) {
        return res.status(400).json({
          error:
            "No seller profile exists and user password hash was unavailable for upgrade.",
        });
      }

      const now = new Date();
      const insert = await db.collection("sellers").insertOne({
        userId,
        ownerName: String(creatorName || artistName || "").trim(),
        email,
        password: u.password,
        accountType: "seller",
        storeName: String(artistName).trim(),
        storeDescription: String(bio).trim(),
        website: String(website || "").trim(),
        category: "music",
        phone: "",
        address: "",
        createdAt: now,
        joinedAt: now,
        status: "active",
        productsListed: 0,
        totalSales: 0,
        isPremium: false,
        isVerified: false,
      });
      seller = await db
        .collection("sellers")
        .findOne({ _id: insert.insertedId });
    }

    await db.collection("sellers").updateOne(
      { _id: seller!._id },
      {
        $set: {
          creatorSubtype: "music",
          creatorOnboardingStatus: "onboarded",
          creatorReady: false,
          creatorProfile: {
            artistName: String(artistName || "").trim(),
            creatorName: String(creatorName || "").trim(),
            genre: String(genre || "").trim(),
            bio: String(bio || "").trim(),
            website: String(website || "").trim(),
            creatorGoal: String(creatorGoal || "").trim(),
            updatedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      },
    );

    await db.collection("users").updateOne(
      { email },
      {
        $set: {
          creatorSubtype: "music",
          creatorOnboardingStatus: "onboarded",
          creatorProfile: {
            artistName: String(artistName || "").trim(),
            genre: String(genre || "").trim(),
            updatedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      },
    );

    const refreshed = await db.collection("sellers").findOne({
      $or: [{ userId }, { email }],
    });

    return res.status(200).json({ success: true, seller: refreshed });
  } catch (e) {
    console.error("creator-onboarding failed", e);
    return res.status(500).json({ error: "Internal server error" });
  }
}
