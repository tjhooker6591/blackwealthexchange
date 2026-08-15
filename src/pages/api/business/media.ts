import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { type File } from "formidable";
import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  buildObjectIdOrStringFilter,
  parseSessionIdentity,
  resolveVerifiedOwnership,
} from "@/lib/directoryOwnership";
import {
  isMultipartFileTooLargeError,
  moveUploadedFile,
  validateUploadedImageFile,
} from "@/lib/security/imageUploadValidation";

export const config = {
  api: { bodyParser: false },
};

function first(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
}

function normalizeSlot(value: string) {
  const slot = String(value || "")
    .trim()
    .toLowerCase();
  if (["logo", "cover", "coverimage", "image", "gallery"].includes(slot)) {
    if (slot === "coverimage") return "cover";
    if (slot === "image") return "cover";
    return slot;
  }
  return "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = parseSessionIdentity(req);
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!["POST", "DELETE"].includes(req.method || "")) {
    res.setHeader("Allow", ["POST", "DELETE"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const form = formidable({
    multiples: false,
    keepExtensions: true,
    maxFileSize: 8 * 1024 * 1024,
  });
  const { fields, files } = await new Promise<{
    fields: formidable.Fields;
    files: formidable.Files;
  }>((resolve, reject) => {
    form.parse(req, (err, parsedFields, parsedFiles) => {
      if (err) reject(err);
      else resolve({ fields: parsedFields, files: parsedFiles });
    });
  }).catch((error) => {
    console.error("[business/media] parse", error);
    if (isMultipartFileTooLargeError(error)) {
      return { fields: { __parseError: "file_too_large" }, files: {} } as any;
    }
    return { fields: {}, files: {} } as any;
  });

  if (fields.__parseError === "file_too_large") {
    return res.status(400).json({ error: "file_too_large" });
  }

  const businessId = String(
    first(fields.businessId as any) || req.query.businessId || "",
  ).trim();
  const slot = normalizeSlot(
    String(first(fields.slot as any) || req.query.slot || ""),
  );
  const removeIndex = Number(
    first(fields.index as any) || req.query.index || "-1",
  );

  if (!businessId || !slot) {
    return res.status(400).json({ error: "business_id_and_slot_required" });
  }

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());
    const ownership = await resolveVerifiedOwnership(db, {
      entityType: "business",
      entityId: businessId,
      userId: session.userId,
    });

    if (!ownership) {
      return res.status(403).json({ error: "ownership_verification_required" });
    }

    const business = await db.collection("businesses").findOne(
      buildObjectIdOrStringFilter("_id", ownership.entityId) || {
        _id: ownership.entityId as any,
      },
    );
    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    if (req.method === "DELETE") {
      const update: any = {
        $set: { updatedAt: new Date() },
        $unset: {} as Record<string, "">,
      };
      if (slot === "logo") {
        update.$unset.logo = "";
      } else if (slot === "cover") {
        update.$unset.image = "";
        update.$unset.coverImage = "";
      } else if (slot === "gallery") {
        const current = Array.isArray(business.images)
          ? business.images.slice()
          : [];
        if (removeIndex >= 0 && removeIndex < current.length)
          current.splice(removeIndex, 1);
        update.$set.images = current;
        update.$set.galleryImages = current;
      }
      await db.collection("businesses").updateOne(
        buildObjectIdOrStringFilter("_id", ownership.entityId) || {
          _id: ownership.entityId as any,
        },
        update,
      );
      return res.status(200).json({ ok: true, removed: true, slot });
    }

    const raw = files.file || files.image || files.logo;
    const file = Array.isArray(raw) ? raw[0] : (raw as File | undefined);
    if (!file) {
      return res.status(400).json({ error: "file_required" });
    }
    const validation = await validateUploadedImageFile(file, 8 * 1024 * 1024);
    if (!validation.ok) {
      return res.status(400).json({
        error:
          validation.reason === "file_too_large"
            ? "file_too_large"
            : "unsupported_media_type",
      });
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "businesses",
    );
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filename = `${uuidv4()}${validation.canonicalExtension}`;
    const destPath = path.join(uploadDir, filename);
    await moveUploadedFile(file.filepath, destPath);
    const fileUrl = `/uploads/businesses/${filename}`;

    const update: any = { $set: { updatedAt: new Date() } };
    if (slot === "logo") {
      update.$set.logo = fileUrl;
    } else if (slot === "cover") {
      update.$set.image = fileUrl;
      update.$set.coverImage = fileUrl;
    } else if (slot === "gallery") {
      const current = Array.isArray(business.images)
        ? business.images.slice()
        : [];
      current.push(fileUrl);
      update.$set.images = current;
      update.$set.galleryImages = current;
    }

    await db.collection("businesses").updateOne(
      buildObjectIdOrStringFilter("_id", ownership.entityId) || {
        _id: ownership.entityId as any,
      },
      update,
    );

    return res.status(200).json({ ok: true, slot, url: fileUrl });
  } catch (error) {
    console.error("[business/media]", error);
    return res.status(500).json({ error: "internal_error" });
  }
}
