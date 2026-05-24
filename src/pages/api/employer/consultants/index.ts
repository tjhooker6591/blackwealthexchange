import type { NextApiRequest, NextApiResponse } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import {
  normalizeConsultantProfile,
  type ConsultantRecord,
} from "@/lib/consultants/normalize";

function asText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function parseListQuery(v: string | string[] | undefined) {
  const raw = Array.isArray(v) ? v.join(",") : v || "";
  return raw
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
}

function requireEmployer(req: NextApiRequest) {
  const parsed = cookie.parse(req.headers.cookie || "");
  const token = parsed.session_token || req.cookies?.session_token;
  if (!token) return null;
  const payload = jwt.verify(token, getJwtSecret()) as {
    userId?: string;
    id?: string;
    email?: string;
    accountType?: string;
  };
  if (payload.accountType !== "employer") return null;
  return payload;
}

function matchesFilters(c: ConsultantRecord, query: NextApiRequest["query"]) {
  const search = asText(query.search).toLowerCase();
  const categories = parseListQuery(query.category);
  const skillFilters = parseListQuery(query.skills);
  const industryFilters = parseListQuery(query.industries);
  const engagementFilters = parseListQuery(query.engagementType);
  const availability = asText(query.availability).toLowerCase();
  const minExperience = Number(query.minExperience || 0);

  if (search) {
    const hay = [
      c.name,
      c.professionalTitle,
      c.summary,
      c.category,
      c.topSkills.join(" "),
      c.industriesServed.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    if (!hay.includes(search)) return false;
  }

  if (categories.length && !categories.includes(c.category.toLowerCase())) {
    return false;
  }

  if (
    skillFilters.length &&
    !skillFilters.every((skill) =>
      c.topSkills.some((x) => x.toLowerCase().includes(skill)),
    )
  ) {
    return false;
  }

  if (
    industryFilters.length &&
    !industryFilters.some((industry) =>
      c.industriesServed.some((x) => x.toLowerCase().includes(industry)),
    )
  ) {
    return false;
  }

  if (
    engagementFilters.length &&
    !engagementFilters.some((x) =>
      c.engagementType.toLowerCase().includes(x.toLowerCase()),
    )
  ) {
    return false;
  }

  if (availability && !c.availability.toLowerCase().includes(availability)) {
    return false;
  }

  if (minExperience > 0 && (c.yearsExperience || 0) < minExperience) {
    return false;
  }

  return true;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const employer = requireEmployer(req);
    if (!employer) return res.status(403).json({ error: "Access denied" });

    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 24)));

    let source = "consultant_profiles";
    let raw = await db
      .collection("consultant_profiles")
      .find({ status: { $ne: "archived" } })
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(300)
      .toArray();

    if (!raw.length) {
      source = "consulting_intake:candidate";
      raw = await db
        .collection("consulting_intake")
        .find({ type: "candidate" })
        .sort({ createdAt: -1 })
        .limit(300)
        .toArray();
    }

    const consultants = raw
      .map((doc) =>
        normalizeConsultantProfile({
          ...doc,
          professionalTitle: doc.professionalTitle || "Consultant",
          category: doc.category,
          yearsExperience: doc.yearsExperience,
          availability: doc.availability,
          engagementType: doc.engagementType,
          industriesServed: doc.industriesServed,
          topSkills: doc.topSkills,
          resumeUrl: doc.resumeUrl,
          trust: doc.trust,
        }),
      )
      .filter((x) => x.id && x.name)
      .filter((x) => matchesFilters(x, req.query))
      .slice(0, limit);

    return res.status(200).json({
      ok: true,
      source,
      consultants,
      meta: { total: consultants.length, limit },
    });
  } catch (error) {
    console.error("[GET /api/employer/consultants]", error);
    return res.status(500).json({ error: "Failed to load consultants" });
  }
}
