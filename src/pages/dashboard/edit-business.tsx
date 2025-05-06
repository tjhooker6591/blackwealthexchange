// File: pages/dashboard/edit-business.tsx
import { GetServerSideProps } from "next";
import jwt from "jsonwebtoken";
import clientPromise from "@/lib/mongodb";
import React, { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

interface TokenPayload {
  email: string;
  accountType: string;
  isAdmin?: boolean;
}

interface Business {
  businessName: string;
  email: string;
  businessAddress?: string;
  businessPhone?: string;
  description?: string;
  verified: boolean;
}

interface Props {
  business: Business;
}

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { req } = ctx;
  const rawCookie = req.cookies["session_token"];
  if (!rawCookie) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  let payload: TokenPayload;
  try {
    payload = jwt.verify(rawCookie, process.env.JWT_SECRET!) as TokenPayload;
  } catch {
    return { redirect: { destination: "/login", permanent: false } };
  }

  if (payload.accountType !== "business") {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const db = (await clientPromise).db("bwes-cluster");
  const doc = await db
    .collection("businesses")
    .findOne({ email: payload.email });

  if (!doc) {
    return { notFound: true };
  }

  const business: Business = {
    businessName: doc.businessName,
    email: doc.email,
    businessAddress: doc.businessAddress || "",
    businessPhone: doc.businessPhone || "",
    description: doc.description || "",
    verified: doc.verified ?? false,
  };

  return { props: { business } };
};

export default function EditBusiness({ business }: Props) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(business.businessName);
  const [email, setEmail] = useState(business.email);
  const [businessAddress, setBusinessAddress] = useState(
    business.businessAddress,
  );
  const [businessPhone, setBusinessPhone] = useState(business.businessPhone);
  const [description, setDescription] = useState(business.description);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/business/update", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          email,
          businessAddress,
          businessPhone,
          description,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">
        Edit Business Info
      </h1>

      {error && <p className="mb-4 text-red-400">⚠️ {error}</p>}

      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-lg mx-auto space-y-4"
      >
        {/* Business Name */}
        <div>
          <label className="block text-gray-300 mb-1">Business Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
            required
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-gray-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
            required
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-gray-300 mb-1">Address</label>
          <input
            type="text"
            value={businessAddress}
            onChange={(e) => setBusinessAddress(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-gray-300 mb-1">Phone</label>
          <input
            type="tel"
            value={businessPhone}
            onChange={(e) => setBusinessPhone(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
          />
        </div>

        {/* Actions */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full mt-4 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="w-full mt-2 bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-600 transition"
        >
          Cancel
        </button>
      </form>
    </div>
  );
}
