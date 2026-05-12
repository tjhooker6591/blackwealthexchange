// src/lib/db/courses.ts
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getMongoDbName } from "@/lib/env";

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
      entitlementStatus: "granted",
      grantedAt: now,
      grantedBy: source,
      sourceStripeSessionId: stripeSessionId,
      sourcePaymentIntentId: paymentIntentId,
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

  return {
    enrollmentUpserted: Boolean(enrollmentResult.upsertedCount),
    enrollmentMatched: enrollmentResult.matchedCount,
  };
}
