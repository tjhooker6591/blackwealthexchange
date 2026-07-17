// pages/dashboard/business/profile.tsx
import { GetServerSideProps } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import React from "react";

interface TokenPayload {
  email: string;
  accountType: string;
}

interface Biz {
  businessName: string;
  email: string;
  businessAddress?: string;
  businessPhone?: string;
  website?: string;
  category?: string;
  categories?: string[];
  city?: string;
  state?: string;
  facebook?: string;
  twitter?: string;
  description?: string;
  verified: boolean;
}

interface Props {
  business: Biz;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
}) => {
  const token = req.cookies["session_token"];
  if (!token) return { redirect: { destination: "/login", permanent: false } };

  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }

  if (payload.accountType !== "business") {
    return { notFound: true };
  }

  const db = (await clientPromise).db("bwes-cluster");
  const doc = await db
    .collection("businesses")
    .findOne({ email: payload.email });
  if (!doc) return { notFound: true };

  const social = doc?.social && typeof doc.social === "object" ? doc.social : {};

  return {
    props: {
      business: {
        businessName: doc.businessName || doc.business_name || "",
        email: doc.email || "",
        businessAddress: doc.businessAddress || doc.address || "",
        businessPhone: doc.businessPhone || doc.phone || "",
        website: doc.website || "",
        category: doc.category || doc.display_categories || "",
        categories: Array.isArray(doc.categories)
          ? doc.categories.filter((value: unknown) => typeof value === "string")
          : [],
        city: doc.city || "",
        state: doc.state || "",
        facebook:
          typeof social.facebook === "string" ? social.facebook : "",
        twitter: typeof social.twitter === "string" ? social.twitter : "",
        description: doc.description || "",
        verified: doc.verified ?? false,
      },
    },
  };
};

export default function BusinessProfile({ business }: Props) {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-gold mb-6">Business Profile</h1>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-3">
        <p>
          <strong>Name:</strong> {business.businessName}
        </p>
        <p>
          <strong>Email:</strong> {business.email}
        </p>
        {business.businessPhone && (
          <p>
            <strong>Phone:</strong> {business.businessPhone}
          </p>
        )}
        {business.website && (
          <p>
            <strong>Website:</strong> {business.website}
          </p>
        )}
        {business.businessAddress && (
          <p>
            <strong>Address:</strong> {business.businessAddress}
          </p>
        )}
        {(business.city || business.state) && (
          <p>
            <strong>Location:</strong> {[business.city, business.state]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
        {business.category && (
          <p>
            <strong>Primary category:</strong> {business.category}
          </p>
        )}
        {Array.isArray(business.categories) && business.categories.length > 0 && (
          <p>
            <strong>Categories:</strong> {business.categories.join(", ")}
          </p>
        )}
        {business.facebook && (
          <p>
            <strong>Facebook:</strong> {business.facebook}
          </p>
        )}
        {business.twitter && (
          <p>
            <strong>Twitter / X:</strong> {business.twitter}
          </p>
        )}
        {business.description && (
          <p>
            <strong>Description:</strong> {business.description}
          </p>
        )}
        <p>
          <strong>Verified:</strong> {business.verified ? "✅ Yes" : "❌ No"}
        </p>
        <button
          onClick={() => window.location.assign("/dashboard/edit-business")}
          className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400 transition"
        >
          Edit Business Info
        </button>
      </div>
    </div>
  );
}
