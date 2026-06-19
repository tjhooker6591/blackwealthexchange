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

function normalizeUrl(raw: string) {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(raw: string) {
  return raw.replace(/[^\d+]/g, "").trim();
}

function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10;
}

function normalizeLocationParts(raw: string) {
  const value = raw.trim().replace(/\s+/g, " ");
  if (!value) {
    return { normalized: "", city: "", state: "" };
  }

  if (value.includes(",")) {
    const [city = "", state = ""] = value.split(",").map((s) => s.trim());
    return {
      normalized: [city, state].filter(Boolean).join(", "),
      city,
      state: state.toUpperCase(),
    };
  }

  const parts = value.split(" ");
  if (parts.length >= 2) {
    const state = parts[parts.length - 1]?.trim() || "";
    const city = parts.slice(0, -1).join(" ").trim();
    if (city && /^[A-Za-z]{2,}$/.test(state)) {
      return {
        normalized: `${city}, ${state.toUpperCase()}`,
        city,
        state: state.toUpperCase(),
      };
    }
  }

  return { normalized: value, city: value, state: "" };
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
    const phone = normalizePhone(first(fields.phone as any));
    const email = first(fields.email as any)
      .trim()
      .toLowerCase();
    const website = normalizeUrl(first(fields.website as any));
    const description = first(fields.description as any).trim();
    const facebook = normalizeUrl(first(fields.facebook as any));
    const twitter = normalizeUrl(first(fields.twitter as any));

    const normalizedCategory = category.toLowerCase();
    const normalizedLocation = normalizeLocationParts(location);

    if (!businessName || !email || !category) {
      return res.status(400).json({
        ok: false,
        error: "Business name, email, and category are required.",
      });
    }

    if (!normalizedLocation.normalized) {
      return res.status(400).json({
        ok: false,
        error: "Please enter a location, for example: Allentown, PA.",
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        ok: false,
        error: "Please enter a valid email address.",
      });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({
        ok: false,
        error: "Please enter a valid phone number with at least 10 digits.",
      });
    }

    if (!description) {
      return res.status(400).json({
        ok: false,
        error: "Please add a short business description.",
      });
    }

    const logoRaw = (files.logo as File | File[] | undefined) || undefined;
    const logoFile = Array.isArray(logoRaw) ? logoRaw[0] : logoRaw;
    let imagePath = "";
    if (logoFile?.filepath) {
      const fileName = path.basename(logoFile.filepath);
      imagePath = `/uploads/${fileName}`;
    }

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB?.trim();
    const db = dbName ? client.db(dbName) : client.db("bwes-cluster");

    const slugBase = businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    let slug = slugBase || undefined;
    let alias = slugBase || undefined;

    if (slugBase) {
      const existingWithSlug = await db.collection("businesses").countDocuments({
        slug: { $regex: `^${slugBase}(-\\d+)?$`, $options: "i" },
      });
      if (existingWithSlug > 0) {
        slug = `${slugBase}-${existingWithSlug + 1}`;
        alias = slug;
      }
    }

    const doc: any = {
      business_name: businessName,
      title: businessName,
      email,
      phone,
      website,
      description,
      category: normalizedCategory,
      categories: normalizedCategory,
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
      message: "Business submitted for review.",
      listingStatus: doc.listingStatus,
      normalizedLocation: doc.locationDisplay,
    });
  } catch (error: any) {
    console.error("business create error", error);

    if (error?.code === 11000) {
      return res.status(409).json({
        ok: false,
        error:
          "A business with this name appears to already exist. Please update the business name slightly or contact support if this is your listing.",
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
