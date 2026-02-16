/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Image as ImageIcon, UploadCloud, CheckCircle2, ArrowLeft } from "lucide-react";

const MAX_IMAGE_MB = 6;

const CATEGORY_OPTIONS = [
  "Apparel",
  "Accessories",
  "Beauty",
  "Art",
  "Books",
  "Home",
  "Food",
  "Other",
] as const;

type Category = (typeof CATEGORY_OPTIONS)[number];

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function toTitleCategory(val: string): Category | "" {
  if (!val) return "";
  const lower = val.toLowerCase().trim();
  const map: Record<string, Category> = {
    apparel: "Apparel",
    accessories: "Accessories",
    beauty: "Beauty",
    art: "Art",
    books: "Books",
    home: "Home",
    "home goods": "Home",
    "homegoods": "Home",
    food: "Food",
    "food & drink": "Food",
    other: "Other",
  };
  return map[lower] || (CATEGORY_OPTIONS as readonly string[]).includes(val)
    ? (val as Category)
    : "";
}

export default function AddProductPage() {
  const router = useRouter();

  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(""); // keep string in UI
  const [category, setCategory] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const [bootLoading, setBootLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  const normalizedCategory = useMemo(() => toTitleCategory(category), [category]);

  const isFormValid =
    productName.trim() &&
    normalizedCategory &&
    price.trim() &&
    Number(price) > 0 &&
    imageFile;

  // Auth gate: enforce logged-in seller
  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      setBootLoading(true);
      setError("");

      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.replace("/auth/seller-login");
          return;
        }
        const data = await res.json();
        const acct = data?.user?.accountType;

        // If not seller, send them to become-a-seller
        if (acct !== "seller") {
          router.replace("/marketplace/become-a-seller");
          return;
        }
      } catch {
        router.replace("/auth/seller-login");
        return;
      } finally {
        if (mounted) setBootLoading(false);
      }
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

  // Image preview cleanup
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!productName.trim()) next.productName = "Product name is required.";

    const p = Number(price);
    if (!price.trim()) next.price = "Price is required.";
    else if (!Number.isFinite(p) || p <= 0) next.price = "Price must be greater than 0.";

    if (!normalizedCategory) next.category = "Please select a category.";

    if (!imageFile) next.image = "Product image is required.";
    else {
      const mb = imageFile.size / (1024 * 1024);
      if (mb > MAX_IMAGE_MB) next.image = `Image must be ≤ ${MAX_IMAGE_MB}MB.`;
    }

    setFieldError(next);
    return Object.keys(next).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setFieldError((prev) => ({ ...prev, image: "" }));

    const f = e.target.files?.[0];
    if (!f) return;

    const mb = f.size / (1024 * 1024);
    if (mb > MAX_IMAGE_MB) {
      setImageFile(null);
      setError(`Image too large. Please upload an image ≤ ${MAX_IMAGE_MB}MB.`);
      return;
    }
    setImageFile(f);
  };

  const resetForm = () => {
    setProductName("");
    setDescription("");
    setPrice("");
    setCategory("");
    setImageFile(null);
    setPreviewUrl("");
    setFieldError({});
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("name", productName.trim());
      formData.append("description", description.trim());
      formData.append("price", String(Number(price)));
      formData.append("category", normalizedCategory); // ✅ Title Case, consistent with marketplace UI
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch("/api/marketplace/add-product", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to add product.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (bootLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6 flex items-center justify-center">
        <div className="text-gray-300">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* subtle gold glow */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
        <div className="absolute top-[38%] left-[12%] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-3xl" />
      </div>

      <div className="relative p-6">
        <div className="max-w-3xl mx-auto">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gold tracking-tight">
                Add a New Product
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Create a listing for admin approval, then it appears in the marketplace.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/marketplace/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 shadow-xl overflow-hidden">
            <div className="p-6">
              {success ? (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm text-gray-200 mb-5">
                    <CheckCircle2 className="h-4 w-4 text-yellow-300" />
                    Submitted for approval
                  </div>

                  <h2 className="text-2xl font-bold text-gold mb-3">
                    ✅ Product Submitted!
                  </h2>

                  <p className="text-gray-300 mb-6">
                    Your product is <strong>awaiting admin approval</strong>. It will appear in the marketplace once approved.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => router.push("/marketplace/dashboard")}
                      className="px-5 py-2 rounded-xl bg-gold text-black font-semibold hover:bg-yellow-500 transition"
                    >
                      Return to Dashboard
                    </button>

                    <button
                      onClick={() => {
                        setSuccess(false);
                        resetForm();
                      }}
                      className="px-5 py-2 rounded-xl border border-white/10 bg-white/5 text-gray-100 hover:bg-white/10 transition"
                    >
                      Add Another Product
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400 mb-5">
                    <span className="text-gold font-semibold">Note:</span> Keep titles clear and images high quality.
                  </p>

                  {error ? (
                    <div className="mb-5 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                      ❌ {error}
                    </div>
                  ) : null}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Product Name */}
                    <div>
                      <label className="block text-sm mb-1">Product Name *</label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => {
                          setProductName(e.target.value);
                          setFieldError((p) => ({ ...p, productName: "" }));
                        }}
                        className={cx(
                          "w-full p-3 rounded-xl bg-black/40 border outline-none transition",
                          "border-white/10 focus:border-yellow-500/40 focus:ring-2 focus:ring-yellow-500/20",
                          fieldError.productName && "border-red-500/40",
                        )}
                        placeholder="e.g. Black Heritage Hoodie"
                      />
                      {fieldError.productName ? (
                        <p className="mt-1 text-xs text-red-200">{fieldError.productName}</p>
                      ) : null}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm mb-1">Description</label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full p-3 rounded-xl bg-black/40 border border-white/10 outline-none focus:border-yellow-500/40 focus:ring-2 focus:ring-yellow-500/20 transition"
                        rows={4}
                        placeholder="Describe the product, sizing, materials, etc."
                      />
                    </div>

                    {/* Price + Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm mb-1">Price ($) *</label>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="0.01"
                          min="0"
                          value={price}
                          onChange={(e) => {
                            setPrice(e.target.value);
                            setFieldError((p) => ({ ...p, price: "" }));
                          }}
                          className={cx(
                            "w-full p-3 rounded-xl bg-black/40 border outline-none transition",
                            "border-white/10 focus:border-yellow-500/40 focus:ring-2 focus:ring-yellow-500/20",
                            fieldError.price && "border-red-500/40",
                          )}
                          placeholder="e.g. 29.99"
                        />
                        {fieldError.price ? (
                          <p className="mt-1 text-xs text-red-200">{fieldError.price}</p>
                        ) : null}
                      </div>

                      <div>
                        <label className="block text-sm mb-1">Category *</label>
                        <select
                          value={category}
                          onChange={(e) => {
                            setCategory(e.target.value);
                            setFieldError((p) => ({ ...p, category: "" }));
                          }}
                          className={cx(
                            "w-full p-3 rounded-xl bg-black/40 border outline-none transition",
                            "border-white/10 focus:border-yellow-500/40 focus:ring-2 focus:ring-yellow-500/20",
                            fieldError.category && "border-red-500/40",
                          )}
                        >
                          <option value="">Select a category</option>
                          {CATEGORY_OPTIONS.map((c) => (
                            <option key={c} value={c} className="bg-black">
                              {c}
                            </option>
                          ))}
                        </select>
                        {fieldError.category ? (
                          <p className="mt-1 text-xs text-red-200">{fieldError.category}</p>
                        ) : null}
                      </div>
                    </div>

                    {/* Image upload + preview */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                      <div className="md:col-span-3">
                        <label className="block text-sm mb-1">Product Image *</label>
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                            <UploadCloud className="h-4 w-4 text-yellow-300" />
                            Upload an image (≤ {MAX_IMAGE_MB}MB)
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="w-full text-sm"
                          />
                          {fieldError.image ? (
                            <p className="mt-2 text-xs text-red-200">{fieldError.image}</p>
                          ) : null}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                          <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                            <ImageIcon className="h-4 w-4 text-yellow-300" />
                            Preview
                          </div>
                          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                            {previewUrl ? (
                              <img
                                src={previewUrl}
                                alt="Product preview"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">
                                No image
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!isFormValid || submitting}
                      className={cx(
                        "w-full py-3 px-4 rounded-xl text-black font-semibold transition",
                        isFormValid && !submitting
                          ? "bg-gold hover:bg-yellow-500"
                          : "bg-gray-600 cursor-not-allowed",
                      )}
                    >
                      {submitting ? "Submitting…" : "Submit Product"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>

          <p className="mt-5 text-xs text-gray-500 text-center">
            Marketplace note: Sellers handle listings, shipping, and customer service. BWE facilitates checkout and payouts.
          </p>
        </div>
      </div>
    </div>
  );
}
