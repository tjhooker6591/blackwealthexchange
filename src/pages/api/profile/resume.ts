import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { File } from "formidable";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export const config = { api: { bodyParser: false } };

type Data = { resumeUrl: string } | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "resumes");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const form = formidable({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024,
    filename: (_name, _ext, part) => {
      const ext = path.extname(part.originalFilename || "").toLowerCase();
      return `${uuidv4()}${ext}`;
    },
  });

  form.parse(req, (err, _fields, files) => {
    if (err) {
      console.error("resume parse error", err);
      return res.status(500).json({ error: "Upload failed" });
    }

    const raw = files.resume;
    const file: File | undefined = Array.isArray(raw)
      ? raw[0]
      : (raw as File | undefined);

    if (!file) return res.status(400).json({ error: "No file uploaded" });

    const allowed = new Set([".pdf", ".doc", ".docx"]);
    const ext = path
      .extname(file.originalFilename || file.newFilename || "")
      .toLowerCase();
    if (!allowed.has(ext))
      return res.status(400).json({ error: "Invalid file type" });

    const relative = path.relative(path.join(process.cwd(), "public"), file.filepath);
    const resumeUrl = "/" + relative.replace(/\\/g, "/");
    return res.status(200).json({ resumeUrl });
  });
}
