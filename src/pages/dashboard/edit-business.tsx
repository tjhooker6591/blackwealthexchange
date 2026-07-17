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

  const social = doc?.social && typeof doc.social === "object" ? doc.social : {};

  const business: Business = {
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
  const [website, setWebsite] = useState(business.website || "");
  const [category, setCategory] = useState(business.category || "");
  const [categoriesText, setCategoriesText] = useState(
    Array.isArray(business.categories) ? business.categories.join(", ") : "",
  );
  const [city, setCity] = useState(business.city || "");
  const [state, setState] = useState(business.state || "");
  const [facebook, setFacebook] = useState(business.facebook || "");
  const [twitter, setTwitter] = useState(business.twitter || "");
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
          address: businessAddress,
          businessPhone,
          phone: businessPhone,
          website,
          category,
          categories: categoriesText,
          city,
          state,
          facebook,
          twitter,
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
        className="bg-gray-900 p-6 rounded-lg shadow-lg max-w-3xl mx-auto space-y-5"
      >
        <div className="grid gap-4 md:grid-cols-2">
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

          <div>
            <label className="block text-gray-300 mb-1">Public Contact Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Phone</label>
            <input
              type="tel"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Website</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="yourbusiness.com"
              className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-gray-300 mb-1">Address</label>
            <input
              type="text"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">State</label>
            <input
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none uppercase"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Primary Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-300 mb-1">Secondary Categories</label>
          <input
            type="text"
            value={categoriesText}
            onChange={(e) => setCategoriesText(e.target.value)}
            placeholder="Retail, Wellness, Community"
            className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-gray-300 mb-1">Facebook</label>
            <input
              type="text"
              value={facebook}
              onChange={(e) => setFacebook(e.target.value)}
              placeholder="facebook.com/yourbusiness"
              className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-1">Twitter / X</label>
            <input
              type="text"
              value={twitter}
              onChange={(e) => setTwitter(e.target.value)}
              placeholder="x.com/yourbusiness"
              className="w-full px-3 py-2 rounded bg-gray-800 text-white focus:outline-none"
            />
          </div>
        </div>

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
