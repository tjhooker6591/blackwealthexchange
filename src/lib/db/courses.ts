// src/lib/db/courses.ts
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import Stripe from "stripe";
import { getMongoDbName } from "@/lib/env";
import { sendEmail } from "@/lib/sendEmail";

type GrantSource = "stripe_webhook" | "verify_session" | "admin_repair";

export async function grantCourseAccess(
  userId: string,
  courseId: string,
  options?: {
    stripeSessionId?: string | null;
    paymentIntentId?: string | null;
    source?: GrantSource;
    repairedBy?: string | null;
    reason?: string | null;
    paymentStatus?: string | null;
    purchasedAt?: Date | null;
    email?: string | null;
    courseName?: string | null;
    sendAccessEmail?: boolean;
  },
) {
  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const now = new Date();

  if (ObjectId.isValid(userId)) {
    await db.collection("users").updateOne(
      { _id: new ObjectId(userId) },
      {
        $addToSet: { purchasedCourses: courseId },
        $set: { updatedAt: now },
      },
    );
  }

  const source = options?.source || "stripe_webhook";
  const stripeSessionId = options?.stripeSessionId || null;
  const paymentIntentId = options?.paymentIntentId || null;
  const purchasedAt = options?.purchasedAt || now;
  const paymentStatus = String(options?.paymentStatus || "paid");

  const userDoc = ObjectId.isValid(userId)
    ? await db
        .collection("users")
        .findOne({ _id: new ObjectId(userId) }, { projection: { email: 1 } })
    : null;
  const resolvedEmail =
    String(options?.email || userDoc?.email || "")
      .trim()
      .toLowerCase() || null;
  const resolvedCourseName = String(options?.courseName || courseId)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

  const enrollmentUpdate: any = {
    $setOnInsert: {
      userId,
      courseId,
      enrolledAt: now,
      progress: 0,
      completed: false,
    },
    $set: {
      updatedAt: now,
      email: resolvedEmail,
      courseName: resolvedCourseName,
      entitlementStatus: "granted",
      accessStatus: "active",
      paymentStatus,
      entitlementType: "course",
      source: "stripe_checkout",
      grantedAt: now,
      grantedBy: source,
      sourceStripeSessionId: stripeSessionId,
      sourcePaymentIntentId: paymentIntentId,
      purchasedAt,
    },
  };

  if (source === "admin_repair") {
    enrollmentUpdate.$push = {
      repairHistory: {
        repairedAt: now,
        repairedBy: options?.repairedBy || null,
        reason: options?.reason || "admin_repair",
        stripeSessionId,
        paymentIntentId,
      },
    };
  }

  const enrollmentResult = await db
    .collection("enrollments")
    .updateOne({ userId, courseId }, enrollmentUpdate, { upsert: true });

  const emailEvent: any = {
    type: "course_access_email",
    courseId,
    courseName: resolvedCourseName,
    recipient: resolvedEmail,
    sent: false,
    error: null,
    stripeSessionId,
    paymentIntentId,
    at: new Date(),
  };

  if (options?.sendAccessEmail !== false && resolvedEmail) {
    try {
      const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/course-dashboard`;
      const courseUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/premium-finance`;
      const supportUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/support`;
      const text =
        `Your course access is now active.\n\nCourse: ${resolvedCourseName}\n` +
        `Open dashboard: ${dashboardUrl}\nOpen course: ${courseUrl}\nSupport: ${supportUrl}\n\n` +
        `Note: Your Stripe receipt may arrive separately.`;

      await sendEmail({
        to: resolvedEmail,
        subject: `Course access is active: ${resolvedCourseName}`,
        text,
        html: text.replace(/\n/g, "<br />"),
      });
      emailEvent.sent = true;
    } catch (err: any) {
      emailEvent.error = String(
        err?.message || err || "email send failed",
      ).slice(0, 300);
    }
  } else if (!resolvedEmail) {
    emailEvent.error = "missing recipient email";
  }

  await db.collection("enrollments").updateOne(
    { userId, courseId },
    {
      $push: { courseEmailEvents: emailEvent },
      $set: {
        courseEmailStatus: emailEvent.sent ? "sent" : "failed",
        updatedAt: new Date(),
      },
    },
  );

  return {
    enrollmentUpserted: Boolean(enrollmentResult.upsertedCount),
    enrollmentMatched: enrollmentResult.matchedCount,
    emailSent: Boolean(emailEvent.sent),
    emailError: emailEvent.error || null,
  };
}

export type VerifyCourseSessionResult = {
  ok: boolean;
  paid: boolean;
  userId?: string;
  courseId?: string;
  enrollmentCreated?: boolean;
  reason?: string;
};

/**
 * P0 course fulfillment fix (2026-09-07): the client-side
 * /api/courses/verify-session endpoint and the course-dashboard SSR gate
 * both need to independently re-check a Stripe session and grant access as
 * a fallback when the webhook hasn't processed it yet (or never will).
 * Shared here so both call sites use exactly one implementation instead of
 * two copies that could drift.
 */
export async function verifyAndGrantCourseSession(
  sessionId: string,
): Promise<VerifyCourseSessionResult> {
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    return { ok: false, paid: false, reason: "stripe_not_configured" };
  }
  if (!sessionId) {
    return { ok: false, paid: false, reason: "missing_session_id" };
  }

  try {
    const stripe = new Stripe(stripeSecret, {
      apiVersion: "2025-02-24.acacia" as any,
    });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const paid =
      String((session as any).payment_status || "").toLowerCase() === "paid";

    const metadata = (session.metadata || {}) as Record<string, string>;
    const metaType = String(metadata.type || "").toLowerCase();
    const userId = String(metadata.userId || "").trim();
    const courseId = String(metadata.courseId || metadata.itemId || "").trim();

    if (!paid) {
      return { ok: true, paid: false, reason: "not_paid" };
    }
    if (metaType !== "course") {
      return { ok: true, paid: true, reason: "not_course_checkout" };
    }
    if (!userId || !courseId) {
      return { ok: true, paid: true, reason: "missing_course_metadata" };
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : null;

    const grant = await grantCourseAccess(userId, courseId, {
      stripeSessionId: sessionId,
      paymentIntentId,
      source: "verify_session",
      paymentStatus: "paid",
      purchasedAt: new Date(),
      email: metadata.email || null,
      courseName: metadata.courseName || courseId,
      sendAccessEmail: true,
    });

    const now = new Date();
    await db.collection("payments").updateOne(
      { stripeSessionId: sessionId },
      {
        $set: {
          status: "paid",
          paid: true,
          paymentStatus: "paid",
          fulfillmentStatus: "fulfilled",
          entitlementStatus: "granted",
          lastReconciledAt: now,
          updatedAt: now,
        },
      },
    );

    return {
      ok: true,
      paid: true,
      userId,
      courseId,
      enrollmentCreated: grant.enrollmentUpserted,
    };
  } catch (error) {
    console.error("verifyAndGrantCourseSession error:", error);
    return { ok: false, paid: false, reason: "verify_failed" };
  }
}
