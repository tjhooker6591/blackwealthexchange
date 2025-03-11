"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { BookOpen, GraduationCap, Users, Briefcase } from "lucide-react"

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
  }, [totalSpending]); // Depend on totalSpending to stop updates

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
      <h2 className="text-3xl font-bold text-center text-gold">
        African American Spending Power in {currentYear}
      </h2>
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
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false); // Track if user is logged in

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const studentOpportunities = [
    { title: "Scholarships", icon: BookOpen, href: "/black-student-opportunities/scholarships" },
    { title: "Grants", icon: GraduationCap, href: "/black-student-opportunities/grants" },
    { title: "Mentorship", icon: Users, href: "/black-student-opportunities/mentorship" },
    { title: "Internships", icon: Briefcase, href: "/black-student-opportunities/internships" },
  ];

  const handleLoginPrompt = () => {
    // Handle the logic to prompt user to login or signup for the restricted content
    setIsLoggedIn(false);
    setShowModal(true);  // Display login modal
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}
      ></div>
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
        <p className="text-lg md:text-xl mt-4 font-light text-gray-300 animate-fadeIn">
          "The Future of Black Wealth Starts Here."
        </p>

        {/* ✅ Add the Economic Impact Counter Here */}
        <section className="relative z-10 py-12">
          <div className="container mx-auto px-4">
            <EconomicImpactSimulator />
          </div>
        </section>

        {/* Call to Action & Search Bar */}
        <div className="mt-8 flex flex-col items-center space-y-4 w-full max-w-xl mx-auto">
          <button
            onClick={() => window.location.href = '/signup'} // Navigates to the signup page
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  // Trigger the search when 'Enter' is pressed
                  window.location.href = `/business-directory?search=${searchQuery}`;
                }
              }}
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

      {/* Sections After Login - Show login prompt if not logged in */}
      <section className="relative z-10 py-12 bg-gray-900">
        {!isLoggedIn && (
          <div className="text-center text-white">
            <p className="text-lg">Please log in to view more content</p>
            <button
              onClick={handleLoginPrompt}
              className="mt-4 px-6 py-2 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-yellow-500 transition"
            >
              Login to Continue
            </button>
          </div>
        )}
        {/* More Content Only Visible After Login */}
        {isLoggedIn && (
          <>
            {/* Your additional content goes here */}
          </>
        )}
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
        {/* Add the link to other Black-Owned websites here */}
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
              <button className="px-4 py-2 bg-gold text-black rounded-lg font-semibold hover:bg-yellow-500 transition">
                Sign Up
              </button>
              <button className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-600 transition">
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

      {/* Styles */}
      <style jsx>{`
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
        .neon-text {
          text-shadow: 0 0 5px #ffd700, 0 0 10px #ffd700, 0 0 15px #ffd700, 0 0 20px #ffd700;
        }
      `}</style>
    </div>
  );
}
