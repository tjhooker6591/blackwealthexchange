import type { NextApiRequest, NextApiResponse } from "next";
import {
  getDb,
  getProgress,
  resolveAiCourseAccess,
  saveCapstone,
  validateCapstone,
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

  try {
    const db = await getDb();
    const access = await resolveAiCourseAccess(req, db);
    if (!access.authenticated) {
      return res.status(401).json({ ok: false, code: "LOGIN_REQUIRED" });
    }
    if (!access.hasAccess || !access.userId) {
      return res.status(403).json({ ok: false, code: "NO_ACCESS" });
    }

    const { answers, missing } = validateCapstone(req.body);
    if (missing.length) {
      return res.status(400).json({ ok: false, code: "INCOMPLETE", missing });
    }

    await saveCapstone(db, access.userId, access.email, answers);
    const progress = await getProgress(db, access.userId);
    return res.status(200).json({ ok: true, progress });
  } catch (err) {
    console.error("ai-productivity capstone error:", err);
    return res.status(500).json({ ok: false, code: "INTERNAL_ERROR" });
  }
}
