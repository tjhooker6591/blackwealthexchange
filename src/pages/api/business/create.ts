import type { NextApiRequest, NextApiResponse } from "next";
import formidable, { type File } from "formidable";
import fs from "node:fs";
import clientPromise from "@/lib/mongodb";
import {
  buildUniqueSlug,
  getCanonicalBusinessName,
  getCreateBusinessDuplicateError,
  getCreateBusinessSuccessMessage,
  deriveNewBusinessVerificationDecision,
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

function parseJsonArray<T>(raw: string): T[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
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
      addressLine1: first(fields.addressLine1 as any),
      city: first(fields.city as any),
      state: first(fields.state as any),
      postalCode: first(fields.postalCode as any),
      phone: first(fields.phone as any),
      email: first(fields.email as any),
      website: first(fields.website as any),
      businessEmail: first(fields.businessEmail as any),
      description: first(fields.description as any),
      facebook: first(fields.facebook as any),
      twitter: first(fields.twitter as any),
      claimantName: first(fields.claimantName as any),
      claimantEmail: first(fields.claimantEmail as any),
      claimantPhone: first(fields.claimantPhone as any),
      relationshipToBusiness: first(fields.relationshipToBusiness as any),
      claimantRoleTitle: first(fields.claimantRoleTitle as any),
      owners: parseJsonArray(first(fields.owners as any)),
      evidence: parseJsonArray(first(fields.evidence as any)),
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
      addressLine1,
      city,
      state,
      postalCode,
      phone,
      email,
      website,
      businessEmail,
      description,
      facebook,
      twitter,
      claimantName,
      claimantEmail,
      claimantPhone,
      relationshipToBusiness,
      claimantRoleTitle,
      owners,
      evidence,
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

    const businesses = db.collection("businesses");

    const existingWithSlug = slugBase
      ? await db.collection("businesses").countDocuments({
          slug: { $regex: `^${slugBase}(-\\d+)?$`, $options: "i" },
        })
      : 0;

    const existingSubmission = await businesses.findOne({
      $or: [
        { business_name: { $regex: `^${businessName}$`, $options: "i" } },
        { businessName: { $regex: `^${businessName}$`, $options: "i" } },
        { title: { $regex: `^${businessName}$`, $options: "i" } },
      ],
      "claimantVerification.claimantEmail": claimantEmail,
      approved: { $ne: true },
    });

    const existingBusinessConflict = Boolean(
      await businesses.findOne({
        $and: [
          {
            $or: [
              { business_name: { $regex: `^${businessName}$`, $options: "i" } },
              { businessName: { $regex: `^${businessName}$`, $options: "i" } },
              { title: { $regex: `^${businessName}$`, $options: "i" } },
            ],
          },
          {
            $or: [
              { approved: true },
              { status: "active" },
              { status: "approved" },
              { listingStatus: "active" },
            ],
          },
        ],
      }),
    );

    const verificationDecision = deriveNewBusinessVerificationDecision(
      validation.value,
      { existingBusinessConflict },
    );

    const slug =
      existingSubmission?.slug || buildUniqueSlug(slugBase, existingWithSlug);
    const alias = existingSubmission?.alias || slug;

    const doc: any = {
      business_name: businessName,
      businessName,
      title: businessName,
      email,
      businessEmail,
      phone,
      website,
      description,
      category,
      categories: category,
      addressLine1,
      city: city || normalizedLocation.city,
      state: state || normalizedLocation.state,
      postalCode,
      locationDisplay: normalizedLocation.normalized,
      status: verificationDecision.status,
      approved: false,
      listingStatus:
        verificationDecision.disposition === "AUTO_VERIFIED_BLACK_OWNED"
          ? "pending_public_activation"
          : "pending_approval",
      social: {
        facebook,
        twitter,
      },
      claimantVerification: {
        claimantName,
        claimantEmail,
        claimantPhone,
        relationshipToBusiness,
        claimantRoleTitle,
      },
      blackOwnedVerification: {
        decision: verificationDecision,
        owners,
        evidence,
        currentPolicyVersion: "bwe-new-business-black-owned-v1",
        publicActivationStatus:
          verificationDecision.disposition === "AUTO_VERIFIED_BLACK_OWNED"
            ? "DRY_RUN"
            : "NOT_READY",
      },
      slug,
      alias,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    doc.businessName = getCanonicalBusinessName(doc) || businessName;

    if (imagePath) {
      doc.image = imagePath;
      doc.logo = imagePath;
      doc.images = [imagePath];
    }

    let savedBusinessId = "";

    if (existingSubmission?._id) {
      await businesses.updateOne(
        { _id: existingSubmission._id },
        {
          $set: {
            ...doc,
            createdAt: existingSubmission.createdAt || doc.createdAt,
            updatedAt: new Date(),
            submittedAt: new Date(),
          },
        },
      );
      savedBusinessId = String(existingSubmission._id);
    } else {
      const insertResult = await businesses.insertOne(doc);
      savedBusinessId = String(insertResult.insertedId);
    }

    return res.status(201).json({
      ok: true,
      businessId: savedBusinessId,
      image: imagePath || null,
      alias: doc.alias || null,
      slug: doc.slug || null,
      message: getCreateBusinessSuccessMessage(),
      verificationDisposition: verificationDecision.disposition,
      verificationSummary: verificationDecision.summary,
      requiredActions: verificationDecision.requiredActions,
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
