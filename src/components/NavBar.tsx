"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image"; // ✅ updated from legacy

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-black text-white relative z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center space-x-2 cursor-pointer">
          <Image
            src="/bwe-logo.png"
            alt="BWE Logo"
            width={40}
            height={40}
            priority
          />
          <span className="text-gold font-bold text-xl">
            Black Wealth Exchange
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link href="/about" className="hover:text-gold font-semibold">
            Our Mission & About
          </Link>

          <Link href="/global-timeline" className="hover:text-gold font-semibold">
            The Journey
          </Link>

          <div className="relative group">
            <button className="hover:text-gold font-semibold">
              Student Resources
            </button>
            <div className="absolute left-0 top-full mt-0 z-50 bg-white text-black py-2 px-4 rounded shadow-md hidden group-hover:block min-w-[180px]">
              <Link href="/black-student-opportunities/grants" className="block py-1 hover:text-gold">Grants</Link>
              <Link href="/black-student-opportunities/scholarships" className="block py-1 hover:text-gold">Scholarships</Link>
              <Link href="/black-student-opportunities/internships" className="block py-1 hover:text-gold">Internships</Link>
              <Link href="/black-student-opportunities/mentorship" className="block py-1 hover:text-gold">Mentorship</Link>
            </div>
          </div>

          <Link href="/business-directory" className="hover:text-gold font-semibold">Business Directory</Link>
          <Link href="/financial-literacy" className="hover:text-gold font-semibold">Financial 101</Link>
          <Link href="/real-estate-investment" className="hover:text-gold font-semibold">Housing & Lending</Link>
          <Link href="/black-entertainment-news" className="hover:text-gold font-semibold">Entertainment</Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden flex items-center gap-2 px-4 py-2 bg-gold text-black font-bold rounded-full shadow hover:bg-yellow-500 transition"
          aria-label="Open Menu"
        >
          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          <span className="text-sm">Menu</span>
        </button>
      </div>

      {/* Mobile Menu (collapsible) */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-gold px-4 pb-4 relative z-50">
          <details className="py-2">
            <summary className="font-semibold cursor-pointer hover:text-gold">
              Student Resources
            </summary>
            <div className="pl-4 mt-1">
              <Link href="/black-student-opportunities/grants" className="block py-1 hover:text-gold" onClick={() => setMobileMenuOpen(false)}>Grants</Link>
              <Link href="/black-student-opportunities/scholarships" className="block py-1 hover:text-gold" onClick={() => setMobileMenuOpen(false)}>Scholarships</Link>
              <Link href="/black-student-opportunities/internships" className="block py-1 hover:text-gold" onClick={() => setMobileMenuOpen(false)}>Internships</Link>
              <Link href="/black-student-opportunities/mentorship" className="block py-1 hover:text-gold" onClick={() => setMobileMenuOpen(false)}>Mentorship</Link>
            </div>
          </details>

          <Link href="/about" className="block py-2 hover:text-gold font-semibold" onClick={() => setMobileMenuOpen(false)}>Our Mission & About</Link>
          <Link href="/global-timeline" className="block py-2 hover:text-gold font-semibold" onClick={() => setMobileMenuOpen(false)}>The Journey</Link>
          <Link href="/business-directory" className="block py-2 hover:text-gold font-semibold" onClick={() => setMobileMenuOpen(false)}>Business Directory</Link>
          <Link href="/financial-literacy" className="block py-2 hover:text-gold font-semibold" onClick={() => setMobileMenuOpen(false)}>Financial 101</Link>
          <Link href="/real-estate-investment" className="block py-2 hover:text-gold font-semibold" onClick={() => setMobileMenuOpen(false)}>Housing & Lending</Link>
          <Link href="/black-entertainment-news" className="block py-2 hover:text-gold font-semibold" onClick={() => setMobileMenuOpen(false)}>Entertainment</Link>
        </div>
      )}
    </nav>
  );
}
