import { MongoClient, ObjectId } from "mongodb";
import {
  ensureApiRateLimitIndexes,
  getClientIp,
  hitApiRateLimit,
} from "@/lib/apiRateLimit";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";

function s(value) {
  return typeof value === "string" ? value : "";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { alias } = req.query;
  if (!alias) {
    return res.status(400).json({ error: "Alias is required" });
  }

  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    return res
      .status(500)
      .json({ error: "Mongo URI is not defined in environment variables" });
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const database = client.db(process.env.MONGODB_DB || "bwes-cluster");

    await ensureApiRateLimitIndexes(database);
    const ip = getClientIp(req);
    const ipLimit = await hitApiRateLimit(
      database,
      `business:detail:ip:${ip}`,
      120,
      5,
    );
    if (ipLimit.blocked) {
      res.setHeader("Retry-After", String(ipLimit.retryAfterSeconds));
      return res.status(429).json({ error: "Too many requests" });
    }

    const businessesCollection = database.collection("businesses");

    const projection = {
      alias: 1,
      slug: 1,
      business_name: 1,
      businessName: 1,
      name: 1,
      shortSummary: 1,
      summary: 1,
      description: 1,
      phone: 1,
      businessPhone: 1,
      address: 1,
      streetAddress: 1,
      businessAddress: 1,
      city: 1,
      state: 1,
      postalCode: 1,
      zip: 1,
      zipCode: 1,
      serviceArea: 1,
      image: 1,
      logo: 1,
      images: 1,
      galleryImages: 1,
      website: 1,
      categories: 1,
      secondaryCategories: 1,
      category: 1,
      primaryCategory: 1,
      display_categories: 1,
      operatingHours: 1,
      hours: 1,
      offeringsSummary: 1,
      productsServicesSummary: 1,
      programsSummary: 1,
      tags: 1,
      specialties: 1,
      keywords: 1,
      social: 1,
      facebook: 1,
      instagram: 1,
      linkedin: 1,
      twitter: 1,
      youtube: 1,
      tiktok: 1,
      primaryCtaLabel: 1,
      primaryCtaUrl: 1,
      additionalCtas: 1,
      status: 1,
      verified: 1,
      isVerified: 1,
      amountPaid: 1,
      isComplete: 1,
      completenessScore: 1,
      directoryVisibilityApproved: 1,
      claimStage: 1,
      claimLocked: 1,
      claimedByUserId: 1,
      claimedByEmail: 1,
      foundingMembershipId: 1,
      ownershipReviewStatus: 1,
      latitude: 1,
      longitude: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    let business = await businessesCollection.findOne(
      { $or: [{ alias }, { slug: alias }] },
      { projection },
    );

    if (!business && ObjectId.isValid(alias)) {
      business = await businessesCollection.findOne(
        { _id: new ObjectId(alias) },
        { projection },
      );
    }

    if (!business) {
      return res.status(404).json({ error: "Business not found" });
    }

    const profile = mapDirectoryProfileFromDoc(business);
    const normalized = {
      _id: String(business._id),
      alias: profile.id
        ? s(business.alias || business.slug)
        : s(business.alias),
      slug: s(business.slug),
      business_name: profile.displayName || "",
      shortSummary: profile.shortSummary || "",
      description: profile.description || "No description available",
      phone: profile.phone || "N/A",
      address: profile.streetAddress || "Address not available",
      city: profile.city || "",
      state: profile.state || "",
      postalCode: profile.postalCode || "",
      serviceArea: profile.serviceArea || "",
      image: profile.coverImage || "/house-draft.jpg",
      logo: profile.logo || "",
      galleryImages: Array.isArray(profile.galleryImages)
        ? profile.galleryImages
        : [],
      website: profile.website || "",
      categories: Array.isArray(profile.secondaryCategories)
        ? profile.secondaryCategories
        : [],
      category: profile.primaryCategory || "",
      operatingHours: profile.operatingHours || "",
      offeringsSummary: profile.offeringsSummary || "",
      tags: Array.isArray(profile.tags) ? profile.tags : [],
      facebook: profile.facebook || "",
      instagram: profile.instagram || "",
      linkedin: profile.linkedin || "",
      twitter: profile.twitter || "",
      youtube: profile.youtube || "",
      tiktok: profile.tiktok || "",
      primaryCtaLabel: profile.primaryCtaLabel || "",
      primaryCtaUrl: profile.primaryCtaUrl || "",
      additionalCtas: Array.isArray(profile.additionalCtas)
        ? profile.additionalCtas
        : [],
      status: s(business.status),
      verified: business.verified === true,
      isVerified: business.isVerified === true,
      amountPaid: Number(business.amountPaid || 0),
      isComplete:
        typeof business.isComplete === "boolean" ? business.isComplete : null,
      completenessScore: Number(business.completenessScore || 0),
      directoryVisibilityApproved:
        business.directoryVisibilityApproved === true,
      claimStage: s(business.claimStage),
      claimLocked: business.claimLocked === true,
      claimedByUserId: s(business.claimedByUserId),
      claimedByEmail: s(business.claimedByEmail),
      foundingMembershipId: s(business.foundingMembershipId),
      ownershipReviewStatus: s(business.ownershipReviewStatus),
      latitude:
        typeof business.latitude === "number" ? business.latitude : null,
      longitude:
        typeof business.longitude === "number" ? business.longitude : null,
      createdAt: business.createdAt || null,
      updatedAt: business.updatedAt || null,
    };

    return res.status(200).json(normalized);
  } catch (error) {
    console.error("Error fetching business:", error);
    return res.status(500).json({ error: "Error fetching business data" });
  } finally {
    await client.close();
  }
}
