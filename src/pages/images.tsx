"use client";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Images() {
  const router = useRouter();
  const q = typeof router.query.q === "string" ? router.query.q : "";

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold">
          Images <span className="text-[#D4AF37]">{q ? `(${q})` : ""}</span>
        </h1>
        <p className="mt-2 text-white/70">
          Placeholder page. Next: image results for businesses/products/brands.
        </p>

        <div className="mt-6 flex gap-3 flex-wrap">
          <Link
            href="/"
            className="rounded-xl bg-[#D4AF37] px-4 py-2.5 font-extrabold text-black hover:bg-yellow-500 transition"
          >
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
