import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { ADMIN_ERROR_CODES, adminFail } from "@/lib/adminApiContract";
import {
  listPersonBusinessRelationships,
  resolvePersonBusinessRelationship,
} from "@/lib/personBusinessRelationships";
import type { Business360Section } from "@/lib/business360";

function parseSections(
  value: string | string[] | undefined,
): Business360Section[] {
  const raw = Array.isArray(value) ? value.join(",") : String(value || "");
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean) as Business360Section[];
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>,
) {
  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return adminFail(
      res,
      405,
      ADMIN_ERROR_CODES.METHOD_NOT_ALLOWED,
      "Method Not Allowed",
    );
  }

  const userId = String(req.query.userId || "").trim();
  if (!userId) {
    return adminFail(
      res,
      400,
      "MISSING_USER_ID",
      "User identifier is required.",
    );
  }

  try {
    const includeBusiness360 =
      String(req.query.includeBusiness360 || "").trim() === "1";
    const business360Sections = parseSections(req.query.sections);
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const businessId = String(req.query.businessId || "").trim();

    const result = businessId
      ? await resolvePersonBusinessRelationship(db, {
          userId,
          businessId,
          includeBusiness360,
          business360Sections,
        })
      : await listPersonBusinessRelationships(db, {
          userId,
          includeBusiness360,
          business360Sections,
        });

    return res.status(result.ok ? 200 : 400).json(result);
  } catch (error: any) {
    return adminFail(
      res,
      500,
      ADMIN_ERROR_CODES.INTERNAL_ERROR,
      String(
        error?.message || "Failed to resolve person-business relationships.",
      ),
    );
  }
}
