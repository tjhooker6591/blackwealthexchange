/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, Image as ImageIcon, Save, XCircle } from "lucide-react";

type ProductForm = {
  name: string;
  description: string;
  price: string; // keep string in UI, convert to number on submit
  category: string;
  imageUrl: string;
};

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

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function normalizeCategory(input: string) {
  if (!input) return "";
  // Support legacy lowercase values
  const lower = input.toLowerCase();
  const map: Record<string, string> = {
    apparel: "Apparel",
    accessories: "Accessories",
    beauty: "Beauty",
    art: "Art",
    books: "Books",
    home: "Home",
    "home goods": "Home",
    homegoods: "Home",
    food: "Food",
    "food & drink": "Food",
    other: "Other",
  };
  return map[lower] || input; // if already Title Case, keep it
}

export default function EditProductPage() {
  const router = useRouter();
  const rawId = router.query.id;

  const productId = useMemo(() => {
    if (!rawId) return "";
    return Array.isArray(rawId) ? rawId[0] : rawId;
  }, [rawId]);

  const [product, setProduct] = useState<ProductForm>({
    name: "",
    description: "",
    price: "",
    category: "",
    imageUrl: "",
  });

  const [initial, setInitial] = useState<ProductForm | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string>("");
  const [notice, setNotice] = useState<string>("");

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof ProductForm, string>>
  >({});

  const topRef = useRef<HTMLDivElement | null>(null);

  const isDirty = useMemo(() => {
    if (!initial) return false;
    return JSON.stringify(initial) !== JSON.stringify(product);
  }, [initial, product]);

  // --- Guard unsaved changes (browser tab close + route changes)
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    const onRouteChangeStart = (url: string) => {
      if (!isDirty) return;
      if (url === router.asPath) return;

      const ok = window.confirm(
        "You have unsaved changes. Leave without saving?",
      );
      if (!ok) {
        // Cancel route change (Next.js Pages Router pattern)
        router.events.emit("routeChangeError");

        throw "Route change aborted (unsaved changes).";
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    router.events.on("routeChangeStart", onRouteChangeStart);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      router.events.off("routeChangeStart", onRouteChangeStart);
    };
  }, [isDirty, router]);

  // --- Fetch product
  useEffect(() => {
    if (!router.isReady) return;
    if (!productId) return;

    const controller = new AbortController();

    const fetchProduct = async () => {
      setLoading(true);
      setError("");
      setNotice("");
      setFieldErrors({});

      try {
        const res = await fetch(
          `/api/marketplace/get-product?id=${encodeURIComponent(productId)}`,
          { signal: controller.signal },
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data?.product) {
          setError("Product not found or failed to load.");
          return;
        }

        const next: ProductForm = {
          name: data.product.name || "",
          description: data.product.description || "",
          price:
            data.product.price !== undefined && data.product.price !== null
              ? String(data.product.price)
              : "",
          category: normalizeCategory(data.product.category || ""),
          imageUrl: data.product.imageUrl || "",
        };

        setProduct(next);
        setInitial(next);
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        console.error("Failed to load product", err);
        setError("An error occurred while fetching the product.");
      } finally {
        setLoading(false);
        requestAnimationFrame(() => {
          topRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });
      }
    };

    fetchProduct();
    return () => controller.abort();
  }, [router.isReady, productId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setNotice("");
    setFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setProduct((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof ProductForm, string>> = {};

    if (!product.name.trim()) nextErrors.name = "Product name is required.";

    const priceNum = Number(product.price);
    if (!product.price.trim()) nextErrors.price = "Price is required.";
    else if (!Number.isFinite(priceNum) || priceNum <= 0)
      nextErrors.price = "Enter a valid price greater than 0.";

    if (!product.category.trim())
      nextErrors.category = "Please select a category.";

    // imageUrl optional, but if provided, must look like URL-ish
    if (
      product.imageUrl.trim() &&
      !/^https?:\/\/|^\/|^data:image\//i.test(product.imageUrl.trim())
    ) {
      nextErrors.imageUrl =
        "Use a full https URL, a site path like /images/x.jpg, or a data:image/* value.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving) return;

    setError("");
    setNotice("");

    if (!validate()) {
      setNotice("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        id: productId,
        name: product.name.trim(),
        description: product.description.trim(),
        category: product.category.trim(),
        imageUrl: product.imageUrl.trim(),
        price: Number(product.price), // ✅ send number to backend
      };

      const res = await fetch("/api/marketplace/update-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setNotice("Saved successfully.");
        setInitial({
          ...product,
          name: payload.name,
          description: payload.description,
          category: payload.category,
          imageUrl: payload.imageUrl,
          price: String(payload.price),
        });

        // Send them back after a short moment (optional)
        router.push("/marketplace/dashboard");
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data?.error || "Failed to update product.");
      }
    } catch (err) {
      console.error("Error updating product:", err);
      setError("An unexpected error occurred while saving.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!initial) return;
    setProduct(initial);
    setFieldErrors({});
    setNotice("Changes reverted.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-3xl mx-auto">
          <div className="h-8 w-40 bg-white/10 rounded animate-pulse mb-6" />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 animate-pulse">
            <div className="h-5 w-44 bg-white/10 rounded mb-4" />
            <div className="h-10 bg-white/10 rounded mb-3" />
            <div className="h-28 bg-white/10 rounded mb-3" />
            <div className="h-10 bg-white/10 rounded mb-3" />
            <div className="h-10 bg-white/10 rounded mb-6" />
            <div className="h-11 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <div className="flex items-center gap-2 text-red-200 font-semibold">
              <XCircle className="h-5 w-5" />
              {error}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => router.reload()}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                Retry
              </button>
              <Link
                href="/marketplace/dashboard"
                className="px-4 py-2 rounded-xl border border-yellow-500/30 bg-black hover:bg-white/5 text-gold transition"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Subtle gold glow (matches your upgraded marketplace vibe) */}
      <div className="pointer-events-none fixed inset-0 opacity-60">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-3xl" />
        <div className="absolute top-[38%] left-[12%] h-[320px] w-[320px] rounded-full bg-yellow-500/5 blur-3xl" />
      </div>

      <div ref={topRef} />

      <div className="relative p-6">
        <div className="max-w-3xl mx-auto">
          {/* Top bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gold tracking-tight">
                Edit Product
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Update details, preview the image, then save.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/marketplace/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>

              <Link
                href={`/marketplace/product/${encodeURIComponent(productId)}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-yellow-500/30 bg-black text-gold hover:bg-white/5 transition"
              >
                View Listing
              </Link>
            </div>
          </div>

          {/* Notice */}
          {notice ? (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200">
              {notice}
            </div>
          ) : null}

          {/* Form Card */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-white/10 bg-white/5 shadow-xl overflow-hidden"
          >
            <div className="p-6 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm mb-1 text-gray-200">
                  Product Name <span className="text-red-300">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  value={product.name}
                  onChange={handleChange}
                  className={cx(
                    "w-full p-3 rounded-xl bg-black/40 border outline-none transition",
                    "border-white/10 focus:border-yellow-500/40 focus:ring-2 focus:ring-yellow-500/20",
                    fieldErrors.name &&
                      "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20",
                  )}
                  placeholder="e.g., Pamfa United Denim Jacket"
                />
                {fieldErrors.name ? (
                  <p className="mt-1 text-xs text-red-200">
                    {fieldErrors.name}
                  </p>
                ) : null}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm mb-1 text-gray-200">
                  Description
                </label>
                <textarea
                  name="description"
                  value={product.description}
                  onChange={handleChange}
                  rows={5}
                  className={cx(
                    "w-full p-3 rounded-xl bg-black/40 border outline-none transition",
                    "border-white/10 focus:border-yellow-500/40 focus:ring-2 focus:ring-yellow-500/20",
                  )}
                  placeholder="Write a clear, buyer-friendly description (materials, sizing, usage, etc.)"
                />
              </div>

              {/* Price + Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-200">
                    Price ($) <span className="text-red-300">*</span>
                  </label>
                  <input
                    name="price"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={product.price}
                    onChange={handleChange}
                    className={cx(
                      "w-full p-3 rounded-xl bg-black/40 border outline-none transition",
                      "border-white/10 focus:border-yellow-500/40 focus:ring-2 focus:ring-yellow-500/20",
                      fieldErrors.price &&
                        "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20",
                    )}
                    placeholder="e.g., 49.99"
                  />
                  {fieldErrors.price ? (
                    <p className="mt-1 text-xs text-red-200">
                      {fieldErrors.price}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-sm mb-1 text-gray-200">
                    Category <span className="text-red-300">*</span>
                  </label>
                  <select
                    name="category"
                    value={product.category}
                    onChange={handleChange}
                    className={cx(
                      "w-full p-3 rounded-xl bg-black/40 border outline-none transition",
                      "border-white/10 focus:border-yellow-500/40 focus:ring-2 focus:ring-yellow-500/20",
                      fieldErrors.category &&
                        "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20",
                    )}
                  >
                    <option value="">Select a category</option>
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c} className="bg-black">
                        {c}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.category ? (
                    <p className="mt-1 text-xs text-red-200">
                      {fieldErrors.category}
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Image URL + Preview */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                <div className="md:col-span-3">
                  <label className="block text-sm mb-1 text-gray-200">
                    Image URL
                  </label>
                  <input
                    name="imageUrl"
                    type="text"
                    value={product.imageUrl}
                    onChange={handleChange}
                    className={cx(
                      "w-full p-3 rounded-xl bg-black/40 border outline-none transition",
                      "border-white/10 focus:border-yellow-500/40 focus:ring-2 focus:ring-yellow-500/20",
                      fieldErrors.imageUrl &&
                        "border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20",
                    )}
                    placeholder="https://... or /images/product.jpg"
                  />
                  {fieldErrors.imageUrl ? (
                    <p className="mt-1 text-xs text-red-200">
                      {fieldErrors.imageUrl}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-400">
                      Tip: Use a fast image host (or your own CDN). Clear images
                      sell.
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
                    <div className="flex items-center gap-2 text-xs text-gray-300 mb-2">
                      <ImageIcon className="h-4 w-4 text-yellow-300" />
                      Preview
                    </div>
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-black/40">
                      {product.imageUrl?.trim() ? (
                        <img
                          src={product.imageUrl.trim()}
                          alt="Product preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (
                              e.currentTarget as HTMLImageElement
                            ).style.display = "none";
                          }}
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
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-white/10 bg-black/30 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="text-xs text-gray-400">
                {isDirty ? (
                  <span>
                    You have{" "}
                    <span className="text-gray-200 font-semibold">
                      unsaved changes
                    </span>
                    .
                  </span>
                ) : (
                  <span>All changes saved.</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!isDirty || saving}
                  className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white/5 transition"
                >
                  Reset
                </button>

                <button
                  type="submit"
                  disabled={saving || !isDirty}
                  className={cx(
                    "inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-semibold transition",
                    "bg-gold text-black hover:bg-yellow-500",
                    "disabled:opacity-40 disabled:hover:bg-gold",
                  )}
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </form>

          {/* Bottom helper */}
          <div className="mt-6 text-center">
            <Link
              href="/marketplace/dashboard"
              className="text-sm text-gray-400 hover:text-gray-200"
            >
              Return to Seller Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
