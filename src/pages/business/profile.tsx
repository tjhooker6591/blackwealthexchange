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

  return {
    props: {
      business: {
        businessName: doc.businessName,
        email: doc.email,
        businessAddress: doc.businessAddress || "",
        businessPhone: doc.businessPhone || "",
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
        {business.businessAddress && (
          <p>
            <strong>Address:</strong> {business.businessAddress}
          </p>
        )}
        {business.businessPhone && (
          <p>
            <strong>Phone:</strong> {business.businessPhone}
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
