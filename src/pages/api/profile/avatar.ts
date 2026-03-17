// pages/api/profile/avatar.ts
import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Disable Next’s default body parser so formidable can handle multipart
export const config = {
  api: {
    bodyParser: false,
  },
};

type Data = { imageUrl: string; avatarUrl: string } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Ensure upload directory exists
  const uploadDir = path.join(process.cwd(), "public", "uploads", "avatars");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configure formidable
  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    filename: (_name, _ext, part) => {
      const ext = path.extname(part.originalFilename || "");
      return `${uuidv4()}${ext}`;
    },
  });

  form.parse(req, (err, _fields, files) => {
    if (err) {
      console.error("Form parse error:", err);
      return res.status(500).json({ error: "Upload failed" });
    }

    // accept either avatar or profileImage field names
    const raw = files.avatar || files.profileImage;
    let file: File | undefined;
    if (Array.isArray(raw)) {
      file = raw[0];
    } else {
      file = raw as File | undefined;
    }

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Derive public URL, stripping off /public
    const savedPath = file.filepath;
    const relative = path.relative(
      path.join(process.cwd(), "public"),
      savedPath,
    );
    const avatarUrl = "/" + relative.replace(/\\/g, "/");

    return res.status(200).json({ imageUrl: avatarUrl, avatarUrl });
  });
}
