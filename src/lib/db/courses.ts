// src/lib/db/courses.ts
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
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

  const validUserObjectId = ObjectId.isValid(userId)
    ? new ObjectId(userId)
    : null;

  if (validUserObjectId) {
    await db.collection("users").updateOne(
      { _id: validUserObjectId },
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

  const userDoc = validUserObjectId
    ? await db
        .collection("users")
        .findOne({ _id: validUserObjectId }, { projection: { email: 1 } })
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
      const dashboardUrl = `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/course-dashboard`;

      const courseUrl = `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/premium-finance`;

      const supportUrl = `${
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
      }/support`;

      const recipientEmail = resolvedEmail;

      await (sendEmail as any)({
        to: recipientEmail,
        subject: `Course access is active: ${resolvedCourseName}`,
        text:
          `Your course access is now active.\n\nCourse: ${resolvedCourseName}\n` +
          `Open dashboard: ${dashboardUrl}\nOpen course: ${courseUrl}\nSupport: ${supportUrl}\n\n` +
          `Note: Your Stripe receipt may arrive separately.`,
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
