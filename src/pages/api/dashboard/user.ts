import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";

type ErrorBody = {
  ok: false;
  code: "UNAUTHORIZED" | "METHOD_NOT_ALLOWED" | "INTERNAL_ERROR";
  message: string;
};

type SuccessBody = {
  ok: true;
  data: {
    user: {
      email: string;
      accountType: string;
      userId?: string;
    };
    dashboard: {
      fullName: string;
      applications: number;
      savedJobs: number;
      recentApplications: any[];
      recentSavedJobs: any[];
      profileCompletion: number;
    };
  };
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ErrorBody | SuccessBody>,
) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
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

    const secret = getJwtSecret();
    const payload = jwt.verify(token, secret) as {
      email?: string;
      accountType?: string;
      userId?: string;
    };

    if (!payload?.email) {
      return res.status(401).json({
        ok: false,
        code: "UNAUTHORIZED",
        message: "Login required",
      });
    }

    const accountType = String(payload.accountType || "user");
    if (accountType !== "user") {
      return res.status(401).json({
        ok: false,
        code: "UNAUTHORIZED",
        message: "Login required",
      });
    }

    const email = String(payload.email).trim().toLowerCase();

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const userDoc = await db
      .collection("users")
      .findOne({ email }, { projection: { fullName: 1 } });

    // Canonical saved-job source of truth is the standalone savedJobs
    // collection, keyed by { userId, jobId }. Prefer the userId already on
    // the session token; fall back to resolving it from the user record for
    // older sessions issued before userId was included in the JWT payload.
    const canonicalUserId =
      typeof payload.userId === "string" && ObjectId.isValid(payload.userId)
        ? payload.userId
        : String(userDoc?._id || "");

    const [applications, savedJobs] = await Promise.all([
      db.collection("applicants").countDocuments({ email }),
      ObjectId.isValid(canonicalUserId)
        ? db
            .collection("savedJobs")
            .countDocuments({ userId: new ObjectId(canonicalUserId) })
        : Promise.resolve(0),
    ]);

    return res.status(200).json({
      ok: true,
      data: {
        user: {
          email,
          accountType,
          userId: payload.userId,
        },
        dashboard: {
          fullName: String(userDoc?.fullName || ""),
          applications,
          savedJobs,
          recentApplications: [],
          recentSavedJobs: [],
          profileCompletion: 0,
        },
      },
    });
  } catch (error) {
    console.error("[/api/dashboard/user]", error);
    return res.status(500).json({
      ok: false,
      code: "INTERNAL_ERROR",
      message: "Failed to load user dashboard",
    });
  }
}
