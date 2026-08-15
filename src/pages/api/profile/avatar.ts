import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import cookie from "cookie";
import clientPromise from "@/lib/mongodb";
import { getJwtSecret, getMongoDbName } from "@/lib/env";
import os from "os";
import {
  isMultipartFileTooLargeError,
  moveUploadedFile,
  validateUploadedImageFile,
} from "@/lib/security/imageUploadValidation";

export const config = {
  api: {
    bodyParser: false,
  },
};

type Data =
  | {
      imageUrl: string;
      avatarUrl: string;
      avatar: {
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

    if (!payload?.email) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const form = formidable({
      uploadDir: os.tmpdir(),
      keepExtensions: true,
      maxFileSize: 5 * 1024 * 1024,
    });

    form.parse(req, async (err, _fields, files) => {
      if (err) {
        console.error("Form parse error:", err);
        return res.status(isMultipartFileTooLargeError(err) ? 400 : 500).json({
          error: isMultipartFileTooLargeError(err)
            ? "file_too_large"
            : "Upload failed",
        });
      }

      const raw = files.avatar || files.profileImage;
      const file: File | undefined = Array.isArray(raw)
        ? raw[0]
        : (raw as File | undefined);

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const validation = await validateUploadedImageFile(file, 5 * 1024 * 1024);
      if (!validation.ok) {
        return res.status(400).json({
          error:
            validation.reason === "file_too_large"
              ? "file_too_large"
              : "unsupported_media_type",
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
      const avatarUrl = "/" + relative.replace(/\\/g, "/");
      const uploadedAt = new Date().toISOString();

      const client = await clientPromise;
      const db = client.db(getMongoDbName());
      const col = db.collection(collectionFor(payload.accountType));

      const avatar = {
        url: avatarUrl,
        filename: file.originalFilename || file.newFilename || undefined,
        uploadedAt,
        contentType: file.mimetype || undefined,
        size: typeof file.size === "number" ? file.size : undefined,
      };

      await col.updateOne(
        { email: payload.email },
        {
          $set: {
            avatar,
            profileImage: avatarUrl,
            updatedAt: new Date(),
          },
        },
      );

      return res.status(200).json({
        imageUrl: avatarUrl,
        avatarUrl,
        avatar,
      });
    });
  } catch (error) {
    console.error("avatar upload error", error);
    return res.status(500).json({ error: "Upload failed" });
  }
}
