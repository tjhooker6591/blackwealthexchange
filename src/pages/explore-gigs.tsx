// pages/explore-gigs.tsx
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, ArrowRight, Search, Briefcase, Users } from "lucide-react";

export default function ExploreGigsPage() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Explore Gigs | Black Wealth Exchange</title>
      </Head>

      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() =>
              window.history.length > 1
                ? router.back()
                : router.push("/freelance")
            }
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
          >
            <ArrowLeft className="h-4 w-4 text-gold" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/post-job"
              className="rounded-xl bg-gold px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500 transition"
            >
              Post Work
            </Link>
            <Link
              href="/subscribe?product=freelance"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
            >
              Join Waitlist
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gold">
            Explore Gigs
          </h1>
          <p className="mt-2 text-gray-300">
            This hub is being built next. For now, join the waitlist and we’ll
            notify you as soon as gigs browsing + freelance profiles go live.
          </p>

          <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Search className="h-4 w-4 text-gold" />
              Search (Coming Soon)
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by skill, role, or service (coming soon)"
              className="mt-3 w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder:text-gray-500 outline-none"
              disabled
            />
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/subscribe?product=freelance"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-5 py-2 font-semibold text-black hover:bg-yellow-500 transition"
              >
                Join Freelance Waitlist <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/freelance"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2 font-semibold hover:bg-white/10 transition"
              >
                Learn More <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center gap-2 font-semibold">
                <Users className="h-5 w-5 text-gold" />
                For Freelancers
              </div>
              <p className="mt-2 text-sm text-gray-300">
                Build a profile, list services, and get discovered by businesses
                looking for talent.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-5">
              <div className="flex items-center gap-2 font-semibold">
                <Briefcase className="h-5 w-5 text-gold" />
                For Businesses
              </div>
              <p className="mt-2 text-sm text-gray-300">
                Post projects, find specialists, and build repeat relationships
                with trusted freelancers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
