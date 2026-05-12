import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { type File } from "formidable";
import fs from "node:fs";
import path from "node:path";
import clientPromise from "@/lib/mongodb";

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
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });

    const form = formidable({
      multiples: false,
      uploadDir,
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

    const businessName = first(fields.businessName as any).trim();
    const category = first(fields.category as any).trim();
    const location = first(fields.location as any).trim();
    const phone = first(fields.phone as any).trim();
    const email = first(fields.email as any)
      .trim()
      .toLowerCase();
    const website = first(fields.website as any).trim();
    const description = first(fields.description as any).trim();

    if (!businessName || !email || !category) {
      return res
        .status(400)
        .json({ error: "businessName, email, category are required" });
    }

    const logoRaw = (files.logo as File | File[] | undefined) || undefined;
    const logoFile = Array.isArray(logoRaw) ? logoRaw[0] : logoRaw;
    let imagePath = "";
    if (logoFile?.filepath) {
      const fileName = path.basename(logoFile.filepath);
      imagePath = `/uploads/${fileName}`;
    }

    const [city = "", state = ""] = location.split(",").map((s) => s.trim());

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB?.trim();
    const db = dbName ? client.db(dbName) : client.db("bwes-cluster");

    const slugBase = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const doc: any = {
      business_name: businessName,
      title: businessName,
      email,
      phone,
      website,
      description,
      category,
      categories: category,
      city,
      state,
      locationDisplay: location,
      status: "approved",
      listingStatus: "approved",
      slug: slugBase || undefined,
      alias: slugBase || undefined,
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
    });
  } catch (error) {
    console.error("business create error", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
