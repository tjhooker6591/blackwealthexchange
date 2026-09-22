// scripts/reconcile-course-entitlements.mjs
//
// P0 course fulfillment fix (2026-09-07). Read-only recurrence-prevention
// check: fails (exit code 1) if any payments collection record shows a
// paid course purchase (type "course", status "paid") with no matching
// course entitlement (enrollments record granted/active, or courseId
// present in users.purchasedCourses). This is exactly the condition that
// let the owner's and a real customer's paid financial-literacy-premium
// purchases go undelivered -- "PAID BUT NOT ENTITLED must never silently
// persist again."
//
// Usage: node --env-file=.env.local scripts/reconcile-course-entitlements.mjs
// Exits 0 if clean, 1 if any paid-but-unfulfilled course purchase is found.

import dotenv from "dotenv";
import { MongoClient, ObjectId } from "mongodb";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });

function redactEmail(email) {
  const s = String(email || "");
  if (!s) return "(none)";
  return s.slice(0, 3) + "***";
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI is not set.");
    process.exit(2);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("bwes-cluster");

  const paidCoursePayments = await db
    .collection("payments")
    .find({
      status: "paid",
      $or: [{ type: "course" }, { "metadata.type": "course" }],
    })
    .project({
      stripeSessionId: 1,
      userId: 1,
      email: 1,
      itemId: 1,
      metadata: 1,
      createdAt: 1,
      paidAt: 1,
    })
    .toArray();

  const problems = [];

  for (const p of paidCoursePayments) {
    const courseId =
      String(p?.metadata?.courseId || "").trim() ||
      String(p?.itemId || "").trim();
    const userId = String(p.userId || "").trim();

    if (!userId || !courseId) {
      problems.push({
        stripeSessionId: p.stripeSessionId,
        email: redactEmail(p.email),
        reason: "paid_course_payment_missing_user_or_course_id",
      });
      continue;
    }

    const enrollment = await db.collection("enrollments").findOne({
      userId,
      courseId,
      entitlementStatus: { $in: ["granted", "active"] },
    });

    if (enrollment) continue;

    const user = ObjectId.isValid(userId)
      ? await db
          .collection("users")
          .findOne(
            { _id: new ObjectId(userId) },
            { projection: { purchasedCourses: 1 } },
          )
          .catch(() => null)
      : null;

    const purchased = Array.isArray(user?.purchasedCourses)
      ? user.purchasedCourses.map(String)
      : [];

    if (purchased.includes(courseId)) continue;

    problems.push({
      stripeSessionId: p.stripeSessionId,
      email: redactEmail(p.email),
      userId,
      courseId,
      paidAt: p.paidAt || p.createdAt || null,
      reason: "paid_but_no_entitlement",
    });
  }

  await client.close();

  if (problems.length === 0) {
    console.log(
      `reconcile-course-entitlements: ok (${paidCoursePayments.length} paid course payments checked, 0 unfulfilled)`,
    );
    process.exit(0);
  }

  console.error(
    `reconcile-course-entitlements: FAIL -- ${problems.length} paid course payment(s) with no course entitlement:`,
  );
  for (const p of problems) {
    console.error(JSON.stringify(p));
  }
  process.exit(1);
}

main().catch((err) => {
  console.error("reconcile-course-entitlements: error", err);
  process.exit(2);
});
