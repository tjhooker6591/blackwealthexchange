import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";

type VerifyResponse = {
  ok: boolean;
  paid?: boolean;
  userId?: string;
  courseId?: string;
  enrollmentCreated?: boolean;
  reason?: string;
};

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeSecret || "sk_missing", {
  apiVersion: "2025-02-24.acacia" as any,
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerifyResponse>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, reason: "method_not_allowed" });
  }

  if (!stripeSecret) {
    return res.status(500).json({ ok: false, reason: "stripe_not_configured" });
  }

  const sessionId =
    typeof req.query.session_id === "string" ? req.query.session_id.trim() : "";

  if (!sessionId) {
    return res.status(400).json({ ok: false, reason: "missing_session_id" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      String((session as any).payment_status || "").toLowerCase() === "paid";

    const metadata = (session.metadata || {}) as Record<string, string>;
    const metaType = String(metadata.type || "").toLowerCase();
    const userId = String(metadata.userId || "").trim();
    const courseId = String(metadata.courseId || metadata.itemId || "").trim();

    if (!paid) {
      return res
        .status(200)
        .json({ ok: true, paid: false, reason: "not_paid" });
    }

    if (metaType !== "course") {
      return res.status(200).json({
        ok: true,
        paid: true,
        reason: "not_course_checkout",
      });
    }

    if (!userId || !courseId) {
      return res.status(200).json({
        ok: true,
        paid: true,
        reason: "missing_course_metadata",
      });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    let enrollmentCreated = false;

    if (ObjectId.isValid(userId)) {
      await db.collection("users").updateOne(
        { _id: new ObjectId(userId) },
        {
          $addToSet: { purchasedCourses: courseId },
          $set: { updatedAt: new Date() },
        },
      );
    }

    const enrollmentResult = await db.collection("enrollments").updateOne(
      { userId, courseId },
      {
        $setOnInsert: {
          userId,
          courseId,
          enrolledAt: new Date(),
          progress: 0,
          completed: false,
          source: "stripe_verify_session",
          stripeSessionId: sessionId,
        },
        $set: {
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    );

    enrollmentCreated = Boolean(enrollmentResult.upsertedCount);

    return res.status(200).json({
      ok: true,
      paid: true,
      userId,
      courseId,
      enrollmentCreated,
    });
  } catch (error) {
    console.error("verify-session error:", error);
    return res.status(500).json({ ok: false, reason: "verify_failed" });
  }
}
