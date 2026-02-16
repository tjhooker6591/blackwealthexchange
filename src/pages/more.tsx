"use client";
import Link from "next/link";

export default function More() {
  const links = [
    { href: "/about", label: "About" },
    { href: "/events", label: "Events" },
    { href: "/global-timeline", label: "Global Timeline" },
    { href: "/library-of-black-history", label: "Library of Black History" },
    { href: "/black-entertainment-news", label: "Entertainment News" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-extrabold">
          More <span className="text-[#D4AF37]">BWE</span>
        </h1>
        <p className="mt-2 text-white/70">
          A simple hub for extra pages. We can expand this into a clean menu + “More” categories.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 font-extrabold hover:bg-white/[0.06] transition"
            >
              {l.label} →
            </Link>
          ))}
        </div>

        <div className="mt-8">
          <Link href="/" className="rounded-xl bg-[#D4AF37] px-4 py-2.5 font-extrabold text-black hover:bg-yellow-500 transition">
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
