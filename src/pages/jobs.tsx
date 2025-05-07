// src/pages/post-job.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PostJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          // Not logged in or invalid session
          router.replace("/login?redirect=/post-job");
          return;
        }
        const { user } = await res.json();
        if (user.accountType !== "employer") {
          setAccessDenied(true);
        }
      } catch (err) {
        console.error("Failed to verify session:", err);
        router.replace("/login?redirect=/post-job");
        return;
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="text-red-400">
          Access Denied. You must be an employer to post jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white px-6 py-10">
      <div className="max-w-5xl mx-auto bg-gray-800 p-8 rounded-lg shadow-lg space-y-12">
        {/* Page Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-gold">
            Black Wealth Exchange Job Hub
          </h1>
          <Link href="/">
            <button className="px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition">
              Home
            </button>
          </Link>
        </div>

        <p className="text-gray-300 text-lg">
          Explore job opportunities, internships, freelance gigs, and mentorship
          tailored to uplift Black professionals and entrepreneurs.
        </p>

        {/* Job Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Find a Job */}
          <Card
            title="Find a Job"
            description="Browse open positions from Black-owned businesses and inclusive companies."
            href="/job-listings"
            buttonLabel="Explore Jobs"
            bg="bg-gold text-black"
          />

          {/* Hire Black Talent */}
          <Card
            title="Hire Black Talent"
            description="Post your job and connect with top Black professionals. (Fee-based)"
            href="/post-job"
            buttonLabel="Post a Job"
            bg="bg-blue-500 text-white"
          />

          {/* Internships */}
          <Card
            title="Internships & College Opportunities"
            description="Gain early career experience through internships and apprenticeship programs."
            href="/internships"
            buttonLabel="View Internships"
            bg="bg-green-500 text-white"
          />

          {/* Freelance & Gig Work */}
          <Card
            title="Freelance & Gig Work"
            description="Join or hire for flexible, short-term projects with skilled freelancers."
            href="/freelance"
            buttonLabel="Explore Gigs"
            bg="bg-red-500 text-white"
          />
        </div>

        {/* Mentorship */}
        <div className="p-6 bg-purple-600 text-white rounded-lg shadow-md space-y-3">
          <h2 className="text-xl font-bold">Mentorship Program</h2>
          <p className="text-sm">
            Be matched with mentors and industry leaders to guide your career
            growth and development.
          </p>
          <Link href="/mentorship">
            <button className="mt-2 px-4 py-2 bg-black text-white rounded hover:bg-opacity-80 transition">
              Become a Mentee
            </button>
          </Link>
        </div>

        {/* Profile Creation */}
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-gold">
            Create Your Profile & Get Started
          </h2>
          <p className="text-gray-300">
            Build your professional presence and get discovered for
            opportunities.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/signup">
              <button className="px-6 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
                Create Profile
              </button>
            </Link>
            <Link href="/login">
              <button className="px-6 py-3 bg-gold text-black rounded hover:bg-yellow-500 transition">
                Login
              </button>
            </Link>
          </div>
        </div>

        {/* Premium Upgrade */}
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold text-gold">Level Up Your Career</h2>
          <p className="text-gray-300">
            Access resume reviews, coaching, and premium job leads.
          </p>
          <Link href="/pricing">
            <button className="px-6 py-3 bg-purple-600 text-white rounded hover:bg-purple-700 transition">
              Upgrade to Premium
            </button>
          </Link>
        </div>

        {/* Back to Home */}
        <div className="text-center pt-6 border-t border-gray-700 mt-10">
          <Link href="/">
            <button className="px-6 py-3 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition">
              Back to Home
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Reusable Card Component
function Card({
  title,
  description,
  href,
  buttonLabel,
  bg,
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  bg: string;
}) {
  return (
    <div className={`p-6 ${bg} rounded-lg shadow-md`}>
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-2 text-sm">{description}</p>
      <Link href={href}>
        <button className="mt-3 px-4 py-2 bg-black text-white rounded hover:bg-opacity-90 transition">
          {buttonLabel}
        </button>
      </Link>
    </div>
  );
}

