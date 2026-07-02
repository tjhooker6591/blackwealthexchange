import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { type File } from "formidable";
import fs from "node:fs";
import clientPromise from "@/lib/mongodb";
import {
  buildUniqueSlug,
  getCreateBusinessDuplicateError,
  getCreateBusinessSuccessMessage,
  validateBusinessSubmission,
} from "@/lib/businessSubmission";
import { uploadImageBufferToCloudinary } from "@/lib/cloudinaryUpload";

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
      const fileBuffer = await fs.promises.readFile(logoFile.filepath);
      const uploaded = await uploadImageBufferToCloudinary({
        buffer: fileBuffer,
        fileName: logoFile.originalFilename || "business-logo",
        contentType: logoFile.mimetype || undefined,
        folder: "bwe/businesses",
      });
      imagePath = uploaded.secureUrl;
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
