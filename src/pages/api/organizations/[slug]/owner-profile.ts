import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  buildDirectoryProfileUpdate,
  mapDirectoryProfileFromDoc,
  normalizeDirectoryProfileInput,
} from "@/lib/directoryProfileContract";
import {
  buildObjectIdOrStringFilter,
  parseSessionIdentity,
  resolveVerifiedOwnership,
} from "@/lib/directoryOwnership";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = parseSessionIdentity(req);
  if (!session) {
    return res.status(401).json({ ok: false, error: "unauthorized" });
  }

  const slug = String(req.query.slug || "").trim();
  if (!slug) {
    return res.status(400).json({ ok: false, error: "missing_slug" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const idFilter = buildObjectIdOrStringFilter("_id", slug);
    const org = await db
      .collection("organizations")
      .findOne(
        idFilter
          ? { $or: [idFilter as any, { alias: slug }] }
          : { alias: slug },
      );

    if (!org) {
      return res
        .status(404)
        .json({ ok: false, error: "organization_not_found" });
    }

    const ownership = await resolveVerifiedOwnership(db, {
      entityType: "organization",
      entityId: String(org._id),
      userId: session.userId,
    });

    if (!ownership) {
      return res
        .status(403)
        .json({ ok: false, error: "ownership_verification_required" });
    }

    if (req.method === "GET") {
      return res
        .status(200)
        .json({ ok: true, organization: mapDirectoryProfileFromDoc(org) });
    }

    if (req.method !== "PATCH") {
      res.setHeader("Allow", ["GET", "PATCH"]);
      return res.status(405).json({ ok: false, error: "method_not_allowed" });
    }

    const normalized = normalizeDirectoryProfileInput(req.body);
    const update = buildDirectoryProfileUpdate(normalized);
    const setKeys = Object.keys((update as any).$set || {}).filter(
      (key) => key !== "updatedAt",
    );
    const unsetKeys = Object.keys((update as any).$unset || {});

    if (!setKeys.length && !unsetKeys.length) {
      return res.status(400).json({ ok: false, error: "no_fields_to_update" });
    }

    await db
      .collection("organizations")
      .updateOne(
        buildObjectIdOrStringFilter("_id", String(org._id)) || { _id: org._id },
        update,
      );

    const updated = await db
      .collection("organizations")
      .findOne({ _id: org._id });
    return res
      .status(200)
      .json({ ok: true, organization: mapDirectoryProfileFromDoc(updated) });
  } catch (error) {
    console.error("[organizations/[slug]/owner-profile]", error);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
