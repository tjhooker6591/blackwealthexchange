"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/legacy/image";

type MeUser = {
  id?: string;
  _id?: string;
  accountType?: string;
  email?: string;
  name?: string;
};

const CATEGORIES = [
  "Beauty & Grooming",
  "Clothing & Fashion",
  "Food & Beverage",
  "Home & Lifestyle",
  "Books & Education",
  "Tech & Gadgets",
  "Jewelry & Accessories",
  "Health & Wellness",
  "Baby & Kids",
  "Art & Culture",
  "Business & Services",
] as const;

function slugifyFolder(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function AddProductPage() {
  const router = useRouter();

  const [user, setUser] = useState<MeUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>(""); // keep as string for input
  const [category, setCategory] =
    useState<(typeof CATEGORIES)[number]>("Beauty & Grooming");
  const [stockQuantity, setStockQuantity] = useState<number>(0);

  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const sellerId = useMemo(() => {
    return user?.id || user?._id || "";
  }, [user]);

  // ✅ Auth gate (seller only)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) {
          router.replace("/login?redirect=/marketplace/add-products");
          return;
        }

        const data = await res.json().catch(() => null);
        const u: MeUser | null = data?.user || null;

        if (!u?.accountType) {
          router.replace("/login?redirect=/marketplace/add-products");
          return;
        }

        // If you want to allow “business” users to sell later, expand this check.
        if (u.accountType !== "seller") {
          setAccessDenied(true);
          return;
        }

        setUser(u);
      } catch (err) {
        console.error("Failed to verify session:", err);
        router.replace("/login?redirect=/marketplace/add-products");
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, [router]);

  const validate = () => {
    if (!name.trim()) return "Product name is required.";
    if (!description.trim()) return "Product description is required.";

    const p = Number(price);
    if (!price || Number.isNaN(p) || p <= 0) return "Enter a valid price.";

    if (stockQuantity < 0 || Number.isNaN(stockQuantity))
      return "Stock quantity must be 0 or greater.";

    if (!imageUrl) return "Please upload a product image.";
    if (!sellerId) return "Seller session not found. Please log in again.";

    return "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg("");
    setSuccessMsg("");

    // basic client checks
    const maxMB = 8;
    if (file.size > maxMB * 1024 * 1024) {
      setErrorMsg(`Image is too large. Max size is ${maxMB}MB.`);
      return;
    }

    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    if (!preset || !cloudName) {
      setErrorMsg(
        "Cloudinary is not configured. Missing NEXT_PUBLIC_CLOUDINARY_* env vars.",
      );
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);

    // safer folder naming (no spaces/special chars)
    const folder = `bwe/marketplace/${slugifyFolder(category)}`;
    formData.append("folder", folder);

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || "Upload failed.");
      }

      setImageUrl(data.secure_url);
      setSuccessMsg("✅ Image uploaded!");
    } catch (err: unknown) {
      console.error("Upload failed:", err);
      setErrorMsg(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/marketplace/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          price: Number(price),
          category,
          imageUrl,
          stockQuantity: Number(stockQuantity) || 0,

          // ✅ Use real sellerId
          sellerId,

          // Optional: keep if your schema supports them
          // createdAt: new Date().toISOString(),
        }),
      });

      const result = await res.json().catch(() => null);

      if (!res.ok || !result?.success) {
        throw new Error(
          result?.error || result?.message || "Failed to save product.",
        );
      }

      setSuccessMsg("✅ Product saved successfully!");
      setName("");
      setDescription("");
      setPrice("");
      setCategory("Beauty & Grooming");
      setStockQuantity(0);
      setImageUrl("");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-300">Loading…</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 text-center">
        <div className="max-w-lg bg-gray-900 border border-red-500/30 rounded-xl p-6">
          <h1 className="text-2xl font-bold text-red-400 mb-3">
            Access Denied
          </h1>
          <p className="text-gray-300">
            You must be logged in with a <strong>seller account</strong> to add
            products.
          </p>
          <div className="mt-5 flex gap-3 justify-center flex-wrap">
            <Link href="/login?redirect=/marketplace/add-products">
              <button className="px-5 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-500 transition">
                Go to Login
              </button>
            </Link>
            <Link href="/marketplace/become-a-seller">
              <button className="px-5 py-2 border border-gold text-gold rounded hover:bg-gold hover:text-black transition">
                Become a Seller
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white px-4 py-16 overflow-hidden">
      {/* Background Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 z-0"
        style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 z-0" />

      <div className="relative z-10 max-w-3xl mx-auto bg-gray-900 bg-opacity-90 border border-gold rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-3xl font-bold text-gold">Add a New Product</h1>
          <Link href="/marketplace/dashboard">
            <button className="px-4 py-2 border border-gray-700 rounded hover:bg-gray-800 transition">
              ← Seller Dashboard
            </button>
          </Link>
        </div>

        <p className="text-sm text-gray-400 mb-6">
          Logged in as:{" "}
          <span className="text-gray-200">{user?.email || "Seller"}</span>
        </p>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-5 rounded border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-5 rounded border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-200">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-gold"
            required
          />

          <textarea
            placeholder="Product Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-gold"
            required
            rows={6}
          />

          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="Price (e.g., 24.99)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-gold"
            required
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-3 rounded-lg focus:ring-2 focus:ring-gold"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <input
            type="number"
            min={0}
            placeholder="Stock Quantity"
            value={Number.isFinite(stockQuantity) ? stockQuantity : 0}
            onChange={(e) => {
              const v = e.target.value;
              setStockQuantity(v === "" ? 0 : Number(v));
            }}
            className="w-full bg-gray-800 text-white border border-gray-600 px-4 py-3 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-gold"
          />

          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Upload Product Image <span className="text-red-500">*</span>
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full bg-gray-800 text-white border border-gray-600 px-3 py-2 rounded-lg file:text-white file:bg-gold file:border-0"
            />

            {uploading && (
              <p className="text-sm text-yellow-400 mt-2">Uploading image…</p>
            )}

            {imageUrl && (
              <div className="mt-4 flex items-center gap-4">
                <Image
                  src={imageUrl}
                  alt="Preview"
                  width={128}
                  height={128}
                  className="object-cover rounded-lg border border-gold"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="px-4 py-2 border border-gray-600 rounded hover:bg-gray-800 transition"
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={uploading || submitting}
            className={`w-full font-bold py-3 px-6 rounded-lg transition ${
              uploading || submitting
                ? "bg-gray-600 text-gray-200 cursor-not-allowed"
                : "bg-gradient-to-r from-gold to-yellow-500 text-black hover:shadow-xl transform hover:scale-[1.02]"
            }`}
          >
            {submitting ? "Saving…" : "Save Product"}
          </button>
        </form>
      </div>
    </div>
  );
}
