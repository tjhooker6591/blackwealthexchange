import type { IncomingMessage } from "http";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId, type Db } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import { isAdminDecoded, type AdminDecoded } from "@/lib/adminAuth";
import { AI_COURSE_ID, aiProductivityCourse } from "./index";

export { CAPSTONE_FIELDS, CAPSTONE_MIN_CHARS, validateCapstone } from "./index";

const FOUNDING_PRODUCT_KEY = "founding_verified_business_growth_membership";

export const PROGRESS_COLLECTION = "ai_course_progress";
export const CAPSTONE_COLLECTION = "ai_course_capstones";

export type AccessReason =
  | "login_required"
  | "admin"
  | "founding_member"
  | "purchased"
  | "no_access";

export type AiCourseAccess = {
  authenticated: boolean;
  hasAccess: boolean;
  reason: AccessReason;
  userId: string | null;
  email: string | null;
  name: string | null;
};

type Session = AdminDecoded & { id?: string; name?: string };

function readSession(req: IncomingMessage): Session | null {
  const parsed = cookie.parse(req.headers.cookie || "");
  const token = parsed.session_token;
  if (!token) return null;
  try {
    return jwt.verify(token, getJwtSecret()) as Session;
  } catch {
    return null;
  }
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(getMongoDbName());
}

/**
 * Who may open the lessons: admins, businesses with an active Founding
 * membership ($49/mo, course included), and anyone who bought the course.
 * Checked on the server for every lesson page and API call.
 */
export async function resolveAiCourseAccess(
  req: IncomingMessage,
  db?: Db,
): Promise<AiCourseAccess> {
  const session = readSession(req);
  const sessionUserId = String(session?.userId || session?.id || "").trim();
  if (!session || (!sessionUserId && !session.email)) {
    return {
      authenticated: false,
      hasAccess: false,
      reason: "login_required",
      userId: null,
      email: null,
      name: null,
    };
  }

  const database = db || (await getDb());
  const user = await database
    .collection("users")
    .findOne(
      ObjectId.isValid(sessionUserId)
        ? { _id: new ObjectId(sessionUserId) }
        : { email: String(session.email).toLowerCase() },
      {
        projection: {
          _id: 1,
          email: 1,
          name: 1,
          fullName: 1,
          purchasedCourses: 1,
        },
      },
    );

  const userId = user ? String(user._id) : sessionUserId || null;
  const email =
    String(user?.email || session.email || "").toLowerCase() || null;
  const name =
    String(user?.fullName || user?.name || session.name || "").trim() || null;
  const base = { authenticated: true, userId, email, name };

  if (isAdminDecoded(session))
    return { ...base, hasAccess: true, reason: "admin" };
  if (!userId) return { ...base, hasAccess: false, reason: "no_access" };

  const founding = await database.collection("business_memberships").findOne(
    {
      productKey: FOUNDING_PRODUCT_KEY,
      membershipStatus: { $in: ["active", "past_due"] },
      // Same match as the membership status page: the owner's account, a
      // business account's own business, or the email on the membership.
      $or: [{ userId }, { businessId: userId }, ...(email ? [{ email }] : [])],
    },
    { projection: { _id: 1 } },
  );
  if (founding) return { ...base, hasAccess: true, reason: "founding_member" };

  const purchased =
    Array.isArray(user?.purchasedCourses) &&
    user.purchasedCourses.map(String).includes(AI_COURSE_ID);
  const enrollment = purchased
    ? true
    : await database.collection("enrollments").findOne(
        {
          userId,
          courseId: AI_COURSE_ID,
          entitlementStatus: { $in: ["granted", "active"] },
          accessStatus: { $in: ["active", null] },
        },
        { projection: { _id: 1 } },
      );
  if (enrollment) return { ...base, hasAccess: true, reason: "purchased" };

  return { ...base, hasAccess: false, reason: "no_access" };
}

export type LessonProgress = {
  lessonNumber: number;
  bestScore: number;
  attempts: number;
  passedAt: string | null;
};

export type CourseProgress = {
  lessons: LessonProgress[];
  passedCount: number;
  /** First lesson not yet passed (the last lesson once all are passed). */
  nextLessonNumber: number;
  capstoneSubmittedAt: string | null;
  completedAt: string | null;
};

export async function getProgress(
  db: Db,
  userId: string,
): Promise<CourseProgress> {
  const rows = await db
    .collection(PROGRESS_COLLECTION)
    .find({ userId, courseId: AI_COURSE_ID })
    .toArray();
  const byNumber = new Map(rows.map((r) => [Number(r.lessonNumber), r]));
  const lessons = aiProductivityCourse.lessons.map((l) => {
    const r = byNumber.get(l.number);
    return {
      lessonNumber: l.number,
      bestScore: Number(r?.bestScore || 0),
      attempts: Number(r?.attempts || 0),
      passedAt: r?.passedAt ? new Date(r.passedAt).toISOString() : null,
    };
  });

  // Every lesson is open to anyone with access; this only says where to resume.
  const nextLessonNumber =
    lessons.find((l) => !l.passedAt)?.lessonNumber ?? lessons.length;

  const capstone = await db
    .collection(CAPSTONE_COLLECTION)
    .findOne(
      { userId, courseId: AI_COURSE_ID },
      { projection: { submittedAt: 1 } },
    );
  const passedCount = lessons.filter((l) => l.passedAt).length;
  const capstoneSubmittedAt = capstone?.submittedAt
    ? new Date(capstone.submittedAt).toISOString()
    : null;
  // Complete once every check is passed and the plan is in, whichever came last.
  const completedAt =
    passedCount === lessons.length && capstoneSubmittedAt
      ? [capstoneSubmittedAt, ...lessons.map((l) => l.passedAt as string)]
          .sort()
          .at(-1)!
      : null;

  return {
    lessons,
    passedCount,
    nextLessonNumber,
    capstoneSubmittedAt,
    completedAt,
  };
}

export async function recordQuizAttempt(
  db: Db,
  userId: string,
  lessonNumber: number,
  score: number,
  passed: boolean,
) {
  const now = new Date();
  await db.collection(PROGRESS_COLLECTION).updateOne(
    { userId, courseId: AI_COURSE_ID, lessonNumber },
    {
      $setOnInsert: {
        userId,
        courseId: AI_COURSE_ID,
        lessonNumber,
        createdAt: now,
      },
      $max: { bestScore: score },
      $inc: { attempts: 1 },
      $set: { lastAttemptAt: now, updatedAt: now },
    },
    { upsert: true },
  );
  if (passed) {
    // `passedAt: null` matches a missing field too, so the first pass sticks.
    await db
      .collection(PROGRESS_COLLECTION)
      .updateOne(
        { userId, courseId: AI_COURSE_ID, lessonNumber, passedAt: null },
        { $set: { passedAt: now } },
      );
  }
}

export async function saveCapstone(
  db: Db,
  userId: string,
  email: string | null,
  answers: Record<string, string>,
) {
  const now = new Date();
  await db.collection(CAPSTONE_COLLECTION).updateOne(
    { userId, courseId: AI_COURSE_ID },
    {
      $setOnInsert: {
        userId,
        courseId: AI_COURSE_ID,
        submittedAt: now,
        reviewStatus: "submitted",
      },
      $set: { email, answers, updatedAt: now },
    },
    { upsert: true },
  );
}
