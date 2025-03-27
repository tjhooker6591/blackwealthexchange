// src/components/NavBar.tsx

"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function NavBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-black text-white relative z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center space-x-2 cursor-pointer">
          <Image
            src="/bwe-logo.png" // Adjust path if needed
            alt="BWE Logo"
            width={40}
            height={40}
          />
          <span className="text-gold font-bold text-xl">
            Black Wealth Exchange
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {/* Student Resources Dropdown */}
          <div className="relative group">
            <button className="hover:text-gold font-semibold">
              Student Resources
            </button>
            <div className="absolute left-0 top-full mt-0 z-50 bg-white text-black py-2 px-4 rounded shadow-md hidden group-hover:block min-w-[180px]">
              <Link
                href="/black-student-opportunities/grants"
                className="block py-1 hover:text-gold"
              >
                Grants
              </Link>
              <Link
                href="/black-student-opportunities/scholarships"
                className="block py-1 hover:text-gold"
              >
                Scholarships
              </Link>
              <Link
                href="/black-student-opportunities/internships"
                className="block py-1 hover:text-gold"
              >
                Internships
              </Link>
              <Link
                href="/black-student-opportunities/mentorship"
                className="block py-1 hover:text-gold"
              >
                Mentorship
              </Link>
            </div>
          </div>

          {/* Other top-level links */}
          <Link
            href="/business-directory"
            className="hover:text-gold font-semibold"
          >
            Business Directory
          </Link>
          <Link
            href="/financial-literacy"
            className="hover:text-gold font-semibold"
          >
            Financial 101
          </Link>
          <Link
            href="/housing-lending"
            className="hover:text-gold font-semibold"
          >
            Housing &amp; Lending
          </Link>
          <Link
            href="/black-entertainment-news"
            className="hover:text-gold font-semibold"
          >
            Entertainment
          </Link>
        </div>

        {/* Hamburger Button (visible on mobile) */}
        <button
          className="md:hidden flex items-center px-2 py-1 border border-gold rounded text-gold hover:bg-gray-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
            <path d="M4 5h16M4 12h16M4 19h16" />
          </svg>
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
              <Link
                href="/black-student-opportunities/grants"
                className="block py-1 hover:text-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Grants
              </Link>
              <Link
                href="/black-student-opportunities/scholarships"
                className="block py-1 hover:text-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Scholarships
              </Link>
              <Link
                href="/black-student-opportunities/internships"
                className="block py-1 hover:text-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Internships
              </Link>
              <Link
                href="/black-student-opportunities/mentorship"
                className="block py-1 hover:text-gold"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mentorship
              </Link>
            </div>
          </details>
          <Link
            href="/business-directory"
            className="block py-2 hover:text-gold font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Business Directory
          </Link>
          <Link
            href="/financial-literacy"
            className="block py-2 hover:text-gold font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Financial 101
          </Link>
          <Link
            href="/housing-lending"
            className="block py-2 hover:text-gold font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Housing &amp; Lending
          </Link>
          <Link
            href="/black-entertainment-news"
            className="block py-2 hover:text-gold font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Entertainment
          </Link>
        </div>
      )}
    </nav>
  );
}
