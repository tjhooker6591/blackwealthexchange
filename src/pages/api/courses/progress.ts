import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

type ErrorBody = {
  ok: false;
  code:
    | "METHOD_NOT_ALLOWED"
    | "UNAUTHORIZED"
    | "BAD_REQUEST"
    | "INTERNAL_ERROR";
  message: string;
};

type SuccessBody = {
  ok: true;
  data: {
    userId?: string;
    email?: string;
    courseId: string;
    progress: number;
    completed: boolean;
    enrolledAt?: string | null;
    updatedAt?: string | null;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorBody | SuccessBody>,
) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      ok: false,
      code: "METHOD_NOT_ALLOWED",
      message: "Method not allowed",
    });
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;

    if (!token) {
      return res.status(401).json({
        ok: false,
        code: "UNAUTHORIZED",
        message: "Login required",
      });
    }

    const payload = jwt.verify(token, getJwtSecret()) as {
      userId?: string;
      email?: string;
    };

    if (!payload?.userId && !payload?.email) {
      return res.status(401).json({
        ok: false,
        code: "UNAUTHORIZED",
        message: "Login required",
      });
    }

    const courseId =
      typeof req.query.courseId === "string" ? req.query.courseId.trim() : "";

    if (!courseId) {
      return res.status(400).json({
        ok: false,
        code: "BAD_REQUEST",
        message: "courseId is required",
      });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const enrollment = await db.collection("enrollments").findOne({
      courseId,
      $or: [
        ...(payload.userId ? [{ userId: payload.userId }] : []),
        ...(payload.email ? [{ email: payload.email.toLowerCase() }] : []),
      ],
    });

    return res.status(200).json({
      ok: true,
      data: {
        userId: payload.userId,
        email: payload.email,
        courseId,
        progress: Number(enrollment?.progress ?? 0),
        completed: Boolean(enrollment?.completed ?? false),
        enrolledAt: enrollment?.enrolledAt
          ? new Date(enrollment.enrolledAt).toISOString()
          : null,
        updatedAt: enrollment?.updatedAt
          ? new Date(enrollment.updatedAt).toISOString()
          : null,
      },
    });
  } catch (error) {
    console.error("GET /api/courses/progress error", error);
    return res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Failed to load course progress",
    });
  }
}
