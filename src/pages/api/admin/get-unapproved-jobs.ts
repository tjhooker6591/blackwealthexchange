// src/pages/api/admin/get-pending-jobs.ts
import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import cookie from "cookie";
import jwt from "jsonwebtoken";

type Decoded = {
  userId?: string;
  email?: string;
  accountType?: string;
  role?: string;
  isAdmin?: boolean;
  roles?: string[];
};

function isAdmin(decoded: Decoded) {
  if (decoded?.isAdmin) return true;
  if (decoded?.accountType === "admin") return true;
  if (decoded?.role === "admin") return true;
  if (Array.isArray(decoded?.roles) && decoded.roles.includes("admin"))
    return true;

  const allow = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (allow.length && decoded?.email) {
    return allow.includes(decoded.email.toLowerCase());
  }

  return false;
}

async function requireAdmin(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<Decoded | null> {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies.session_token;

  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    const SECRET = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!SECRET) throw new Error("JWT secret missing");

    const decoded = jwt.verify(token, SECRET) as Decoded;

    if (process.env.NODE_ENV === "production" && !isAdmin(decoded)) {
      res.status(403).json({ error: "Forbidden" });
      return null;
    }

    return decoded;
  } catch {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const db = client.db("bwes-cluster");

    const jobs = await db
      .collection("jobs")
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .project({
        title: 1,
        company: 1,
        employerName: 1,
        employerEmail: 1,
        location: 1,
        jobType: 1,
        salary: 1,
        createdAt: 1,
        status: 1,
      })
      .toArray();

    return res.status(200).json({
      ok: true,
      jobs: jobs.map((job: any) => ({
        _id: job._id.toString(),
        title: job.title || "",
        company: job.company || job.employerName || "",
        employerEmail: job.employerEmail || "",
        location: job.location || "",
        jobType: job.jobType || "",
        salary: job.salary ?? null,
        status: job.status || "pending",
        createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : null,
      })),
    });
  } catch (error) {
    console.error("[/api/admin/get-pending-jobs] Error:", error);
    return res.status(500).json({ error: "Failed to fetch jobs" });
  }
}
