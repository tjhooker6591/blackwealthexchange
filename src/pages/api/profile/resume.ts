import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";
import os from "os";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import {
  isMultipartFileTooLargeError,
  moveUploadedFile,
} from "@/lib/security/imageUploadValidation";
import { validateUploadedDocumentFile } from "@/lib/security/documentUploadValidation";

export const config = { api: { bodyParser: false } };

type Data =
  | {
      resumeUrl: string;
      resume: {
        url: string;
        filename?: string;
        uploadedAt: string;
        contentType?: string;
        size?: number;
      };
    }
  | { error: string };

function collectionFor(accountType?: string) {
  if (accountType === "seller") return "sellers";
  if (accountType === "employer") return "employers";
  if (accountType === "business") return "businesses";
  return "users";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, getJwtSecret()) as {
      email?: string;
      accountType?: string;
    };

    if (!payload?.email) return res.status(401).json({ error: "Unauthorized" });

    const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // Phase 8 -- P8-07 Image/File/IP Protection. Stage the upload in a
    // temp directory (never the public-served uploadDir) and validate its
    // actual content signature before it ever touches a publicly
    // reachable path -- mirrors the already-correct pattern in
    // src/pages/api/profile/avatar.ts. Previously this route wrote
    // directly into public/uploads/resumes using the client-supplied
    // filename extension, and only checked that extension AFTER the file
    // was already saved there, with no cleanup on rejection: an attacker
    // could get an arbitrary file with an arbitrary (non-pdf/doc/docx)
    // extension and arbitrary content persisted, unvalidated, in a
    // public directory.
    const form = formidable({
      uploadDir: os.tmpdir(),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
    });

    form.parse(req, async (err, _fields, files) => {
      if (err) {
        console.error("resume parse error", err);
        return res.status(isMultipartFileTooLargeError(err) ? 400 : 500).json({
          error: isMultipartFileTooLargeError(err)
            ? "file_too_large"
            : "Upload failed",
        });
      }

      const raw = files.resume;
      const file: File | undefined = Array.isArray(raw)
        ? raw[0]
        : (raw as File | undefined);

      if (!file) return res.status(400).json({ error: "No file uploaded" });

      const validation = await validateUploadedDocumentFile(
        file,
        10 * 1024 * 1024,
      );
      if (!validation.ok) {
        await fs.promises.unlink(file.filepath).catch(() => null);
        return res.status(400).json({
          error:
            validation.reason === "file_too_large"
              ? "file_too_large"
              : "Invalid file type",
        });
      }

      const savedPath = path.join(
        uploadDir,
        `${uuidv4()}${validation.canonicalExtension}`,
      );
      await moveUploadedFile(file.filepath, savedPath);

      const relative = path.relative(
        path.join(process.cwd(), "public"),
        savedPath,
      );
      const resumeUrl = "/" + relative.replace(/\\/g, "/");
      const uploadedAt = new Date().toISOString();

      const resume = {
        url: resumeUrl,
        filename: file.originalFilename || file.newFilename || undefined,
        uploadedAt,
        contentType: file.mimetype || undefined,
        size: typeof file.size === "number" ? file.size : undefined,
      };

      const client = await clientPromise;
      const db = client.db(getMongoDbName());
      const col = db.collection(collectionFor(payload.accountType));

      await col.updateOne(
        { email: payload.email },
        {
          $set: {
            resume,
            resumeUrl,
            updatedAt: new Date(),
          },
        },
      );

      return res.status(200).json({ resumeUrl, resume });
    });
  } catch (error) {
    console.error("resume upload error", error);
    return res.status(500).json({ error: "Upload failed" });
  }
}
