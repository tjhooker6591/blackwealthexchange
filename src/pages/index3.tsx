"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, GraduationCap, Users, Briefcase } from "lucide-react";

// EconomicImpactSimulator component
const EconomicImpactSimulator: React.FC = () => {
  const currentYear = 2025;
  const startDate = new Date(currentYear, 1, 18);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

  const maxSpending = 1980000000000; // $1.98 Trillion projected cap
  const initialValue = 300000000000; // $300 billion as of February 2025
  const monthlyGrowth = 150000000000; // $150 billion per month
  const dailyGrowth = monthlyGrowth / 30.44; // Average days in a month

  const [currentTime, setCurrentTime] = useState(startDate);
  const [totalSpending, setTotalSpending] = useState(initialValue);
  const [blackOwnedSpending, setBlackOwnedSpending] = useState(initialValue * 0.07);
  const [websiteImpact, setWebsiteImpact] = useState(initialValue * 0.01);

  useEffect(() => {
    if (totalSpending >= maxSpending) return; // Stop updating once the max limit is reached

    const timer = setInterval(() => {
      setCurrentTime((prevTime) => {
        if (prevTime >= endOfYear) return prevTime;
        return new Date(prevTime.getTime() + 1000 * 60 * 60);
      });

      setTotalSpending((prevTotal) => {
        if (prevTotal >= maxSpending) return maxSpending;
        const newTotal = prevTotal + dailyGrowth / 24;
        return newTotal > maxSpending ? maxSpending : newTotal;
      });

      setBlackOwnedSpending((prevSpending) => {
        return Math.min((totalSpending + dailyGrowth / 24) * 0.1, maxSpending * 0.1);
      });

      setWebsiteImpact((prevImpact) => {
        return Math.min((totalSpending + dailyGrowth / 24) * 0.03, maxSpending * 0.03);
      });
    }, 100);

    return () => clearInterval(timer);
  }, [totalSpending]);

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  return (
    <div className="space-y-6 p-6 bg-gray-900 rounded-lg shadow-lg border border-gold text-white">
      <h2 className="text-3xl font-bold text-center text-gold">African American Spending Power in {currentYear}</h2>
      <div className="text-5xl font-bold text-green-500 text-center">
        {formatNumber(Math.floor(totalSpending))}
      </div>
      <p className="text-center text-sm text-gray-400">
        {totalSpending >= maxSpending
          ? "Estimated total reached for 2025."
          : "Growing at approximately $150 billion per month"}
      </p>
      <div className="text-center">
        <Link href="/1.8trillionimpact" className="text-gold font-bold hover:underline text-lg">
          KNOWLEDGE IS POWER - Select Here to "SEE WHERE YOUR MONEY GOES"
        </Link>
      </div>

      <div className="text-center mt-4">
        <Link href="/economic-freedom" className="text-gold font-bold hover:underline text-lg">
          Modern Economic Slavery - Click Here To Learn
        </Link>
      </div>
    </div>
  );
};

export default function Home() {
  const [showModal, setShowModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [scrollY, setScrollY] = useState<number>(0);
  const [userLoggedIn, setUserLoggedIn] = useState<boolean>(false); // Track if user is logged in
  const [userType, setUserType] = useState<"user" | "business" | null>(null); // Track if user is a 'user' or 'business'

  const handleLoginClick = () => {
    setShowModal(true);
  };

  const handleLoginSuccess = (type: "user" | "business") => {
    setUserLoggedIn(true);
    setUserType(type);
    setShowModal(false);
  };

  const handleSearchSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (userLoggedIn) {
        window.location.href = `/business-directory?search=${searchQuery}`;
      } else {
        setShowModal(true);
      }
    }
  };

  const studentOpportunities = [
    { title: "Scholarships", icon: BookOpen, href: "/black-student-opportunities/scholarships" },
    { title: "Grants", icon: GraduationCap, href: "/black-student-opportunities/grants" },
    { title: "Mentorship", icon: Users, href: "/black-student-opportunities/mentorship" },
    { title: "Internships", icon: Briefcase, href: "/black-student-opportunities/internships" },
  ];

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-50"></div>

      {/* Navbar with Logo */}
      <nav className="absolute top-4 left-6 flex items-center space-x-3 z-20">
        <Image src="/bwe-logo.png" alt="BWE Logo" width={50} height={50} />
        <h1 className="text-xl font-bold text-gold">Black Wealth Exchange</h1>
      </nav>

      {/* Hero Section */}
      <header className="text-center py-24 relative z-10">
        <Image src="/bwe-logo.png" alt="BWE Logo" width={100} height={100} className="mx-auto mb-4 animate-fadeIn" />
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-wide text-gold neon-text animate-slideUp">
          Black Wealth Exchange
        </h1>
        <p className="text-lg md:text-xl mt-4 font-light text-gray-300 animate-fadeIn">"The Future of Black Wealth Starts Here."</p>

        {/* Economic Impact Simulator */}
        <section className="relative z-10 py-12">
          <div className="container mx-auto px-4">
            <EconomicImpactSimulator />
          </div>
        </section>

        {/* Call to Action & Search Bar */}
        <div className="mt-8 flex flex-col items-center space-y-4 w-full max-w-xl mx-auto">
          <button
            onClick={handleLoginClick} // Navigates to the signup page
            className="px-6 py-2 bg-gradient-to-r from-gold to-yellow-500 text-black font-semibold text-lg rounded-lg hover:shadow-xl transform hover:scale-105 transition animate-pulseGlow"
          >
            Get Started
          </button>

          <div className="relative w-full">
            <input
              type="text"
              placeholder="Find Black-Owned Businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-gold focus:outline-none transition-all"
            />
            <Link href={`/business-directory?search=${searchQuery}`}>
              <button className="absolute right-2 top-1 px-3 py-1 bg-gold text-black rounded-lg font-semibold hover:bg-yellow-500 transition">
                Search
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Student Opportunities Section */}
      <section className="relative z-10 py-12 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gold mb-8">Student Opportunities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {studentOpportunities.map((item, index) => (
              <Link key={index} href={item.href}>
                <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition duration-300 cursor-pointer">
                  <item.icon className="w-12 h-12 text-gold mb-2" />
                  <span className="text-lg font-semibold text-center">{item.title}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 relative z-10">
        {/* Real Estate & Investment Section */}
        <section className="bg-gray-800 rounded-lg shadow-lg p-4 mb-8 mt-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gold">Real Estate & Investment</h2>
              <p className="text-sm text-gray-300 mt-1">Explore Black-owned real estate options and investments</p>
            </div>
            <button
              onClick={() => {
                if (!userLoggedIn) setShowModal(true);
              }}
              className="px-4 py-2 bg-gold text-black font-semibold text-sm rounded-lg hover:bg-yellow-500 transition"
            >
              Learn More
            </button>
          </div>
        </section>

        {/* Featured Sponsors (Smooth Scrolling Banner) */}
        <section className="bg-gray-800 rounded-lg shadow-lg p-4 mb-8 overflow-hidden">
          <h3 className="text-lg font-semibold text-gold mb-2">Featured Sponsors</h3>
          <div className="relative w-full h-32 overflow-hidden">
            <div className="absolute flex space-x-4 animate-scroll">
              {[1, 2, 3, 4, 5].map((i) => (
                <img
                  key={i}
                  src={`/ads/sample-banner${i}.jpg`}
                  alt={`Sample Banner ${i}`}
                  className="h-24 w-auto object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        </section>

        {/* Main Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[
            {
              title: "Sponsored Businesses",
              href: "/business-directory/sponsored-business",
              description: "Premium featured business with more visibility.",
            },
            { title: "Marketplace", href: "/marketplace", description: "Buy & sell Black-owned products securely." },
            { title: "BWES Social", href: "/social", description: "Engage with the Black business community." },
            {
              title: "Investment & Wealth",
              href: "/investment",
              description: "Invest in Black businesses & secure your future.",
            },
            {
              title: "Jobs & Careers",
              href: "/jobs",
              description: "Discover jobs, internships & networking opportunities.",
            },
            { title: "Entertainment&News", href: "/black-entertainment-news", description: "Learn about Blabk entertainment and News." },
          ].map((item, index) => (
            <div
              key={index}
              className="p-4 bg-gray-800 bg-opacity-80 shadow-lg hover:scale-105 transition transform rounded-lg border border-gray-700"
            >
              <Link href={item.href}>
                <h2 className="text-xl font-semibold text-gold hover:text-white cursor-pointer">{item.title}</h2>
              </Link>
              <p className="text-sm text-gray-400 mt-2">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Advertise with Us Section */}
        <section className="bg-gray-800 rounded-lg shadow-lg p-6 text-center mb-8">
          <h2 className="text-2xl font-semibold text-gold mb-2">Advertise with Us</h2>
          <p className="text-gray-300 mb-4">
            Want to increase visibility for your business? Check out our advertising options!
          </p>
          <Link href="/advertise-with-us">
            <button className="px-6 py-2 bg-gold text-black rounded-lg hover:bg-yellow-500 transition">
              Learn More About Advertising
            </button>
          </Link>
        </section>
      </main>

      {/* Explore Other Black-Owned Websites Section */}
      <section className="relative z-10 py-8 bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-semibold text-gold mb-4">Explore Other Black-Owned Websites</h2>
          <p className="text-sm text-gray-300 mb-4">Discover and support platforms that list Black-owned businesses across the nation.</p>
          <Link href="/black-business-websites">
            <button className="px-4 py-2 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
              Explore Websites
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 border-t border-gold mt-8 relative z-10">
        <Image src="/bwe-logo.png" alt="BWE Logo" width={60} height={60} className="mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-300">Join the BWE Community & Build Wealth</h2>
        <p className="mt-4">
          <Link href="/pricing" className="text-gold font-semibold hover:underline">
            View Pricing Plans
          </Link>
        </p>
        <p className="mt-2 text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} Black Wealth Exchange. All Rights Reserved.
        </p>
        <p className="mt-2 text-gray-500 text-sm">
          <Link href="/black-business-websites" className="text-gold font-semibold hover:underline">
            Other Black-Owned Websites
          </Link>
        </p>
      </footer>

      {/* Login/Signup Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
          <div className="bg-white text-black p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-semibold text-center">Sign Up / Login</h2>
            <p className="mt-2 text-center">Join the Black Wealth Exchange community.</p>

            <input
              type="email"
              placeholder="Enter your email"
              className="mt-4 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />
            <input
              type="password"
              placeholder="Enter your password"
              className="mt-4 w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gold"
            />

            <div className="mt-6 flex justify-between">
              <button
                className="px-4 py-2 bg-gold text-black rounded-lg font-semibold hover:bg-yellow-500 transition"
                onClick={() => handleLoginSuccess("user")}
              >
                Sign Up
              </button>
              <button
                className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-600 transition"
                onClick={() => handleLoginSuccess("business")}
              >
                Login
              </button>
            </div>

            <button
              onClick={() => setShowModal(false)}
              className="mt-4 w-full py-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
