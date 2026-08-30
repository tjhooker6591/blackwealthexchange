import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "../../../lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

type SessionPayload = {
  userId?: string;
  id?: string;
  email?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};
    const requestedUserId =
      typeof body.userId === "string" ? body.userId.trim() : "";
    const courseId =
      typeof body.courseId === "string" ? body.courseId.trim() : "";

    const parsed = cookie.parse(req.headers.cookie || "");
    const token = parsed.session_token || req.cookies?.session_token;
    if (!token) {
      return res.status(401).json({ message: "Authentication required." });
    }

    const session = jwt.verify(token, getJwtSecret()) as SessionPayload;
    const sessionUserId = String(session.userId || session.id || "").trim();
    const sessionEmail = String(session.email || "")
      .trim()
      .toLowerCase();
    if (!sessionUserId && !sessionEmail) {
      return res.status(401).json({ message: "Authentication required." });
    }

    // Validate input
    if (!courseId) {
      return res.status(400).json({ message: "Course ID is required." });
    }

    if (requestedUserId && sessionUserId && requestedUserId !== sessionUserId) {
      return res.status(403).json({
        message: "Certificate generation is limited to the authenticated user.",
      });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const userDoc =
      ObjectId.isValid(sessionUserId) || sessionEmail
        ? await db
            .collection("users")
            .findOne(
              ObjectId.isValid(sessionUserId)
                ? { _id: new ObjectId(sessionUserId) }
                : { email: sessionEmail },
              { projection: { _id: 1, email: 1 } },
            )
        : null;
    const canonicalUserId = String(userDoc?._id || sessionUserId).trim();
    const canonicalEmail =
      String(userDoc?.email || sessionEmail)
        .trim()
        .toLowerCase() || null;

    if (!canonicalUserId) {
      return res.status(401).json({ message: "Authenticated user not found." });
    }

    const course = await db.collection("courses").findOne({
      $or: [{ _id: courseId }, { courseId }, { slug: courseId }],
    } as any);
    if (!course) {
      return res.status(404).json({ message: "Course not found." });
    }

    const enrollment = await db.collection("enrollments").findOne({
      courseId,
      userId: canonicalUserId,
    });
    if (!enrollment) {
      return res.status(403).json({
        message: "Course access not found for the authenticated user.",
      });
    }

    if (
      !["granted", "active"].includes(
        String(enrollment.entitlementStatus || ""),
      )
    ) {
      return res.status(403).json({
        message: "Course access is not in an eligible state for certificates.",
      });
    }

    // Check if user completed the course
    if (!enrollment.completed) {
      return res.status(400).json({
        message: "Course not completed. Certificate cannot be generated.",
      });
    }

    // Check if certificate already exists
    const existingCertificate = await db
      .collection("certificates")
      .findOne({ userId: canonicalUserId, courseId });
    if (existingCertificate) {
      return res.status(200).json({
        message: "Certificate already generated.",
        certificateUrl: existingCertificate.certificateUrl,
      });
    }

    // Generate certificate URL (placeholder logic)
    const certificateId = `${canonicalUserId}_${courseId}_${Date.now()}`;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const certificateUrl = `${siteUrl.replace(/\/$/, "")}/certificates/${certificateId}.pdf`;

    // Save certificate record
    await db.collection("certificates").insertOne({
      userId: canonicalUserId,
      email: canonicalEmail,
      courseId,
      certificateUrl,
      issuedAt: new Date(),
    });

    return res.status(200).json({
      message: "Certificate generated successfully.",
      certificateUrl,
    });
  } catch (error) {
    console.error("Certificate Generation Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
