"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth";

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  // Destination for dashboard based on user type
  const dashboardHref =
    user?.accountType === "seller"
      ? "/marketplace/dashboard"
      : user?.accountType === "employer"
        ? "/employer/jobs"
        : user?.accountType === "business"
          ? "/dashboard/edit-business"
          : "/dashboard";

  const profileHref =
    user?.accountType === "business" ? "/dashboard/edit-business" : "/profile";

  // Helper for mobile nav actions
  const handleMobileNav = (href?: string) => {
    setMobileMenuOpen(false);
    if (href) router.push(href);
  };

  return (
    <nav className="relative z-50 border-b border-white/5 bg-black text-white">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 lg:max-w-[220px] xl:max-w-none"
        >
          <Image
            src="/favicon.png"
            alt="BWE Logo"
            width={36}
            height={36}
            className="h-9 w-9 shrink-0 object-contain"
            priority
          />
          <span className="hidden truncate text-base font-extrabold text-[#D4AF37] xl:inline">
            Black Wealth Exchange
          </span>
          <span className="truncate text-base font-extrabold text-[#D4AF37] xl:hidden">
            BWE
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden items-center gap-1 lg:flex">
          <Link
            href="/start-here"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5 hover:text-[#D4AF37]"
          >
            Quick Path
          </Link>

          <Link
            href="/black-wealth"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5 hover:text-[#D4AF37]"
          >
            Wealth Guide
          </Link>

          <Link
            href="/financial-literacy"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5 hover:text-[#D4AF37]"
          >
            Learn
          </Link>

          <Link
            href="/marketplace"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5 hover:text-[#D4AF37]"
          >
            Marketplace
          </Link>

          <Link
            href="/black-student-opportunities"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5 hover:text-[#D4AF37]"
          >
            Student Opportunities
          </Link>

          <Link
            href="/events"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5 hover:text-[#D4AF37]"
          >
            Events
          </Link>

          <Link
            href="/black-card"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5 hover:text-[#D4AF37]"
          >
            Black Card
          </Link>

          <Link
            href="/advertise-with-us"
            className="rounded-lg border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-2 text-sm font-semibold text-[#F1D57A] transition-colors hover:bg-[#D4AF37]/18"
          >
            Advertise
          </Link>

          <details className="group relative">
            <summary className="list-none cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5 hover:text-[#D4AF37]">
              More
            </summary>
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl">
              <Link
                href="/about"
                className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-[#D4AF37]"
              >
                About
              </Link>
              <Link
                href="/global-timeline"
                className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-[#D4AF37]"
              >
                Journey
              </Link>
              <Link
                href="/travel-map/explore"
                className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-[#D4AF37]"
              >
                Travel Map
              </Link>
              <Link
                href="/wealth-builder"
                className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-[#D4AF37]"
              >
                Wealth Builder
              </Link>
              <Link
                href="/music"
                className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-[#D4AF37]"
              >
                Music
              </Link>
              <Link
                href="/affiliate/index"
                className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-[#D4AF37]"
              >
                Earn with BWE
              </Link>
              <Link
                href="/join-the-mission"
                className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-[#D4AF37]"
              >
                Mission
              </Link>
            </div>
          </details>

          {loading ? null : user ? (
            <details className="group relative ml-1">
              <summary className="list-none cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5 hover:text-[#D4AF37]">
                Account
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-48 rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl">
                <Link
                  href={dashboardHref}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-[#D4AF37]"
                >
                  Dashboard
                </Link>
                <Link
                  href={profileHref}
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-[#D4AF37]"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm text-white/85 hover:bg-white/5 hover:text-red-500"
                >
                  Sign Out
                </button>
              </div>
            </details>
          ) : (
            <details className="group relative ml-1">
              <summary className="list-none cursor-pointer rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/5 hover:text-[#D4AF37]">
                Account
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-44 rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl">
                <Link
                  href="/login"
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-[#D4AF37]"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="block rounded-lg px-3 py-2 text-sm text-white/85 hover:bg-white/5 hover:text-[#D4AF37]"
                >
                  Sign Up
                </Link>
              </div>
            </details>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-nav-menu"
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#D4AF37]/50 bg-black px-4 text-sm font-extrabold text-[#D4AF37] shadow-[0_0_0_1px_rgba(212,175,55,0.06)] transition hover:bg-[#D4AF37]/10 lg:hidden"
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {mobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6L6 18"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 7h16M4 12h16M4 17h16"
              />
            )}
          </svg>
          <span>Menu</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          id="mobile-nav-menu"
          className="border-t border-[#D4AF37]/20 bg-black/95 px-4 pb-4 pt-3 lg:hidden"
        >
          <div className="space-y-1 rounded-2xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
            <Link
              href="/start-here"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Quick Path
            </Link>

            <Link
              href="/about"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              About
            </Link>

            <Link
              href="/black-wealth"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Black Wealth Guide
            </Link>

            <Link
              href="/financial-literacy"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Learn
            </Link>

            <Link
              href="/marketplace"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Marketplace
            </Link>

            <Link
              href="/black-student-opportunities"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Student Opportunities
            </Link>

            <Link
              href="/global-timeline"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Journey
            </Link>

            <Link
              href="/events"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Events
            </Link>

            <Link
              href="/advertise-with-us"
              className="block rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/10 px-3 py-2.5 font-semibold text-[#F1D57A] transition-colors hover:bg-[#D4AF37]/18"
              onClick={() => handleMobileNav()}
            >
              Advertise with BWE
            </Link>

            <Link
              href="/travel-map/explore"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Travel Map
            </Link>

            <Link
              href="/wealth-builder"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Wealth Builder
            </Link>

            <Link
              href="/music"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Music
            </Link>

            <Link
              href="/affiliate/index"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Earn with BWE
            </Link>

            <Link
              href="/join-the-mission"
              className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
              onClick={() => handleMobileNav()}
            >
              Join the Mission
            </Link>

            <div className="my-2 h-px bg-white/10" />

            {loading ? null : user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
                  onClick={() => handleMobileNav()}
                >
                  Dashboard
                </Link>

                <Link
                  href={profileHref}
                  className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
                  onClick={() => handleMobileNav()}
                >
                  Profile
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full rounded-xl px-3 py-2.5 text-left font-semibold text-white/85 transition-colors hover:bg-white/[0.04] hover:text-red-500"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
                  onClick={() => handleMobileNav()}
                >
                  Log In
                </Link>

                <Link
                  href="/signup"
                  className="block rounded-xl px-3 py-2.5 font-medium text-white/85 transition-colors hover:bg-white/[0.04] hover:text-[#D4AF37]"
                  onClick={() => handleMobileNav()}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
