"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import useAuth from "@/hooks/useAuth"; // ✅ Use the default import

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
      ? "/dashboard/business/profile"
      : "/dashboard";

  const profileHref =
    user?.accountType === "business"
      ? "/dashboard/business/profile"
      : "/profile";

  // Helper for mobile nav actions
  const handleMobileNav = (href?: string) => {
    setMobileMenuOpen(false);
    if (href) router.push(href);
  };

  return (
    <nav className="bg-black text-white relative z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/favicon.png" alt="BWE Logo" width={40} height={40} />
          <span className="text-gold font-bold truncate">
            Black Wealth Exchange
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/about" className="hover:text-gold font-semibold transition-colors">About</Link>
          <Link href="/global-timeline" className="hover:text-gold font-semibold transition-colors">Journey</Link>
          <Link href="/events" className="hover:text-gold font-semibold transition-colors">Events</Link>

          {loading ? null : user ? (
            <>
              <Link href={dashboardHref} className="hover:text-gold font-semibold transition-colors">Dashboard</Link>
              <Link href={profileHref} className="hover:text-gold font-semibold transition-colors">Profile</Link>
              <button
                onClick={logout}
                className="hover:text-red-500 font-semibold transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-gold font-semibold transition-colors">Log In</Link>
              <Link href="/signup" className="hover:text-gold font-semibold transition-colors">Sign Up</Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen((open) => !open)}
          className="md:hidden flex items-center justify-center h-10 px-4 bg-gold text-black rounded-full shadow hover:bg-yellow-500 transition"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="ml-2 font-semibold">Menu</span>
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-gold px-4 pb-4 space-y-2">
          <Link href="/about" className="block py-2 hover:text-gold transition-colors" onClick={() => handleMobileNav()}>About</Link>
          <Link href="/global-timeline" className="block py-2 hover:text-gold transition-colors" onClick={() => handleMobileNav()}>Journey</Link>
          <Link href="/events" className="block py-2 hover:text-gold transition-colors" onClick={() => handleMobileNav()}>Events</Link>

          {/* ...Add more links as needed... */}
          <hr className="border-gray-700 my-2" />
          {loading ? null : user ? (
            <>
              <Link href={dashboardHref} className="block py-2 hover:text-gold transition-colors" onClick={() => handleMobileNav()}>Dashboard</Link>
              <Link href={profileHref} className="block py-2 hover:text-gold transition-colors" onClick={() => handleMobileNav()}>Profile</Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left py-2 hover:text-red-500 font-semibold transition-colors"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="block py-2 hover:text-gold transition-colors" onClick={() => handleMobileNav()}>Log In</Link>
              <Link href="/signup" className="block py-2 hover:text-gold transition-colors" onClick={() => handleMobileNav()}>Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
