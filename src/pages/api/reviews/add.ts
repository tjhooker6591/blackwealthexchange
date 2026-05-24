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
  message: string;
  review: {
    id: string;
    productId: string;
    rating: number;
    comment: string;
    userId?: string;
    email?: string;
    createdAt: string;
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorBody | SuccessBody>,
) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
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

    const body =
      typeof req.body === "string" && req.body.length > 0
        ? JSON.parse(req.body)
        : req.body || {};

    const productId =
      typeof body.productId === "string" ? body.productId.trim() : "";
    const rating = Number(body.rating);
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    if (!productId || !Number.isFinite(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        ok: false,
        code: "BAD_REQUEST",
        message: "productId and rating (1-5) are required",
      });
    }

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const doc = {
      productId,
      rating,
      comment,
      userId: payload.userId || null,
      email: payload.email?.toLowerCase() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("reviews").insertOne(doc);

    return res.status(200).json({
      ok: true,
      message: "Review added",
      review: {
        id: String(result.insertedId),
        productId,
        rating,
        comment,
        userId: payload.userId,
        email: payload.email,
        createdAt: doc.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("POST /api/reviews/add error", error);
    return res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Failed to add review",
    });
  }
}
