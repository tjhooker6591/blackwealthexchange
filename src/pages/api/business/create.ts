import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { type File } from "formidable";
import fs from "node:fs";
import path from "node:path";
import { v4 as uuidv4 } from "uuid";
import clientPromise from "@/lib/mongodb";
import {
  buildUniqueSlug,
  getCanonicalBusinessName,
  getCreateBusinessDuplicateError,
  getCreateBusinessSuccessMessage,
  validateBusinessSubmission,
} from "@/lib/businessSubmission";

export const config = {
  api: { bodyParser: false },
};

function first(v: string | string[] | undefined) {
  if (Array.isArray(v)) return v[0] || "";
  return v || "";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ ok: false, error: "Method Not Allowed" });
  }

  try {
    const form = formidable({
      multiples: false,
      keepExtensions: true,
      maxFileSize: 8 * 1024 * 1024,
    });

    const { fields, files } = await new Promise<{
      fields: formidable.Fields;
      files: formidable.Files;
    }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const validation = validateBusinessSubmission({
      businessName: first(fields.businessName as any),
      category: first(fields.category as any),
      location: first(fields.location as any),
      phone: first(fields.phone as any),
      email: first(fields.email as any),
      website: first(fields.website as any),
      description: first(fields.description as any),
      facebook: first(fields.facebook as any),
      twitter: first(fields.twitter as any),
    });

    if (!validation.ok) {
      return res.status(400).json({
        ok: false,
        error: validation.error,
      });
    }

    const {
      businessName,
      category,
      phone,
      email,
      website,
      description,
      facebook,
      twitter,
      normalizedLocation,
      slugBase,
    } = validation.value;

    const logoRaw = (files.logo as File | File[] | undefined) || undefined;
    const logoFile = Array.isArray(logoRaw) ? logoRaw[0] : logoRaw;
    let imagePath = "";
    if (logoFile?.filepath) {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const ext = path.extname(logoFile.originalFilename || "") || ".jpg";
      const filename = `${uuidv4()}${ext}`;
      const destPath = path.join(uploadDir, filename);
      await fs.promises.copyFile(logoFile.filepath, destPath);
      imagePath = `/uploads/${filename}`;
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB?.trim();
    const db = dbName ? client.db(dbName) : client.db("bwes-cluster");

    const existingWithSlug = slugBase
      ? await db.collection("businesses").countDocuments({
          slug: { $regex: `^${slugBase}(-\\d+)?$`, $options: "i" },
        })
      : 0;

    const slug = buildUniqueSlug(slugBase, existingWithSlug);
    const alias = slug;

    const doc: any = {
      business_name: businessName,
      businessName,
      title: businessName,
      email,
      phone,
      website,
      description,
      category,
      categories: category,
      city: normalizedLocation.city,
      state: normalizedLocation.state,
      locationDisplay: normalizedLocation.normalized,
      status: "pending",
      approved: false,
      listingStatus: "pending_approval",
      social: {
        facebook,
        twitter,
      },
      slug,
      alias,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    doc.businessName = getCanonicalBusinessName(doc) || businessName;

    if (imagePath) {
      doc.image = imagePath;
      doc.logo = imagePath;
      doc.images = [imagePath];
    }

    await db.collection("businesses").insertOne(doc);

    return res.status(201).json({
      ok: true,
      image: imagePath || null,
      alias: doc.alias || null,
      slug: doc.slug || null,
      message: getCreateBusinessSuccessMessage(),
      listingStatus: doc.listingStatus,
      normalizedLocation: doc.locationDisplay,
    });
  } catch (error: any) {
    console.error("business create error", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        ok: false,
        error: getCreateBusinessDuplicateError(),
      });
    }

    return res.status(500).json({
      ok: false,
      error:
        error?.message ||
        "We could not submit your business right now. Please try again.",
    });
  }
}
