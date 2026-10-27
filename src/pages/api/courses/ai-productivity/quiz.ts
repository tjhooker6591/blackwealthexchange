import type { NextApiRequest, NextApiResponse } from "next";
import { getLesson, gradeQuiz } from "@/lib/courses/aiProductivity";
import {
  getDb,
  getProgress,
  recordQuizAttempt,
  resolveAiCourseAccess,
} from "@/lib/courses/aiProductivity/server";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED" });
  }

  const body = (req.body && typeof req.body === "object" ? req.body : {}) as {
    lesson?: unknown;
    answers?: unknown;
  };
  const lesson = getLesson(String(body.lesson || ""));
  if (!lesson)
    return res.status(400).json({ ok: false, code: "UNKNOWN_LESSON" });

  try {
    const db = await getDb();
    const access = await resolveAiCourseAccess(req, db);
    if (!access.authenticated) {
      return res.status(401).json({ ok: false, code: "LOGIN_REQUIRED" });
    }
    if (!access.hasAccess || !access.userId) {
      return res.status(403).json({ ok: false, code: "NO_ACCESS" });
    }

    const graded = gradeQuiz(lesson, body.answers);
    await recordQuizAttempt(
      db,
      access.userId,
      lesson.number,
      graded.score,
      graded.passed,
    );
    const progress = await getProgress(db, access.userId);
    return res.status(200).json({ ok: true, ...graded, progress });
  } catch (err) {
    console.error("ai-productivity quiz error:", err);
    return res.status(500).json({ ok: false, code: "INTERNAL_ERROR" });
  }
}
