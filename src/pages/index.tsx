"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, GraduationCap, Users, Briefcase } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

const EconomicImpactSimulator: React.FC = () => {
  const currentYear = 2025;
  const maxSpending = 1980000000000;
  const initialValue = 300000000000;
  const monthlyGrowth = 150000000000;
  const [totalSpending, setTotalSpending] = useState(initialValue);

  useEffect(() => {
    const dailyGrowth = monthlyGrowth / 30.44;
    if (totalSpending >= maxSpending) return;
    const timer = setInterval(() => {
      setTotalSpending((prev) => {
        if (prev >= maxSpending) return maxSpending;
        const newTotal = prev + dailyGrowth / 24;
        return newTotal > maxSpending ? maxSpending : newTotal;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [totalSpending]);

  const formatNumber = (num: number) =>
    num.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <div className="space-y-6 p-6 bg-gray-900 rounded-lg shadow-lg border border-gold text-white">
      <h2 className="text-2xl sm:text-3xl font-bold text-center text-gold">
        African American Spending Power in {currentYear}
      </h2>
      <div className="text-3xl md:text-4xl font-bold text-green-500 text-center">
        {formatNumber(Math.floor(totalSpending))}
      </div>
      <p className="text-center text-sm text-gray-400">
        {totalSpending >= maxSpending
          ? "Estimated total reached for 2025."
          : "Growing at approximately $150 billion per month"}
      </p>
      <div className="text-center">
        <Link
          href="/1.8trillionimpact"
          className="text-gold font-bold hover:underline text-lg"
        >
          KNOWLEDGE IS POWER – Select Here to &quot;SEE WHERE YOUR MONEY
          GOES&quot;
        </Link>
      </div>
      <div className="text-center mt-4">
        <Link
          href="/economic-freedom"
          className="text-gold font-bold hover:underline text-lg"
        >
          Modern Economic Slavery - Click Here To Learn
        </Link>
      </div>
    </div>
  );
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: session } = useSession();
  const router = useRouter();

  const handleProtectedClick = (path: string, requiredRole?: string) => {
    if (!session) {
      router.push(`/login?redirect=${path}`);
      return;
    }
    const userRole = session.user?.accountType;
    if (requiredRole && userRole !== requiredRole) {
      alert(`You need a ${requiredRole} account to access this feature.`);
      return;
    }
    router.push(path);
  };

  const studentOpportunities = [
    {
      title: "Scholarships",
      icon: BookOpen,
      href: "/black-student-opportunities/scholarships",
    },
    {
      title: "Grants",
      icon: GraduationCap,
      href: "/black-student-opportunities/grants",
    },
    {
      title: "Mentorship",
      icon: Users,
      href: "/black-student-opportunities/mentorship",
    },
    {
      title: "Internships",
      icon: Briefcase,
      href: "/black-student-opportunities/internships",
    },
  ];
  const keySections = [
    {
      title: "Our Marketplace",
      href: "/marketplace",
      description: "Buy & sell Black-owned products securely.",
    },
    {
      title: "Sponsored Businesses",
      href: "/business-directory/sponsored-business",
      description: "Premium featured business with more visibility.",
    },
    {
      title: "Affiliate & Partnership",
      href: "/affiliate",
      description:
        "Explore our curated affiliate offers and partnership opportunities.",
    },
    {
      title: "Entertainment&News",
      href: "/black-entertainment-news",
      description: "Learn about Black entertainment and news.",
    },
    {
      title: "Jobs & Careers",
      href: "/jobs",
      description: "Discover jobs, internships & networking opportunities.",
    },
    {
      title: "Investment & Wealth",
      href: "/investment",
      description: "Invest in Black businesses & secure your future.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
    {/* Solid black background layer */}
    <div className="absolute inset-0 bg-black opacity-100" />
  
    {/* Top-to-bottom black gradient overlay for visual depth */}
    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-50" />
  

      <header className="text-center py-24 relative z-10">
        <p className="text-lg md:text-xl mt-4 font-light text-gray-300 animate-fadeIn">
          &quot;The Future of Black Wealth Starts Here.&quot;
        </p>

        <div className="mt-6 flex justify-center space-x-4">
          <Link href="/login">
            <button className="px-6 py-2 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-yellow-500 transition">
              Login
            </button>
          </Link>
          <Link href="/signup">
            <button className="px-6 py-2 bg-transparent border border-gold text-gold font-semibold text-lg rounded-lg hover:bg-gold hover:text-black transition">
              Sign Up
            </button>
          </Link>
        </div>

        <section className="relative z-10 py-12">
          <div className="container mx-auto px-4">
            <EconomicImpactSimulator />
          </div>
        </section>

        <div className="mt-8 flex flex-col items-center space-y-4 w-full max-w-xl mx-auto">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Find Black-Owned Businesses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  router.push(`/business-directory?search=${searchQuery}`);
                }
              }}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:ring-2 focus:ring-gold focus:outline-none transition-all"
            />
            <button
              onClick={() =>
                router.push(`/business-directory?search=${searchQuery}`)
              }
              className="absolute right-2 top-1 px-3 py-1 bg-gold text-black rounded-lg font-semibold hover:bg-yellow-500 transition"
            >
              Search
            </button>
          </div>

          <button
            onClick={() =>
              handleProtectedClick("/marketplace/add-products", "seller")
            }
            className="mt-4 bg-gold text-black text-center py-2 px-4 rounded-lg font-semibold shadow hover:bg-yellow-500 transition animate-pulseGlow"
          >
            Start Selling on the Marketplace – Join as a Seller!
          </button>

          <div className="mt-2">
            <Link href="/library-of-black-history">
              <span className="text-gold font-bold hover:underline text-lg">
                Library of Black History (Facts. No Fiction)
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Student Opportunities */}
      <section className="relative z-10 py-12 bg-gray-900">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gold mb-8">
            Student Opportunities - Free Resource Information
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {studentOpportunities.map((item, index) => (
              <Link key={index} href={item.href}>
                <div className="flex flex-col items-center p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition duration-300 cursor-pointer">
                  <item.icon className="w-12 h-12 text-gold mb-2" />
                  <span className="text-lg font-semibold text-center">
                    {item.title}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Real Estate & Investment Section */}
      <main className="container mx-auto px-4 relative z-10">
        <section className="bg-gray-800 rounded-lg shadow-lg p-4 mb-8 mt-12">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gold">
                Real Estate & Investment
              </h2>
              <p className="text-sm text-gray-300 mt-1">
                Explore Black-owned real estate options and investments
              </p>
            </div>
            <Link href="/real-estate-investment">
              <button className="px-4 py-2 bg-gold text-black font-semibold text-sm rounded-lg hover:bg-yellow-500 transition">
                Learn More
              </button>
            </Link>
          </div>
        </section>

        {/* Featured Sponsors */}
        <section className="bg-gray-800 rounded-lg shadow-lg p-4 mb-8 overflow-hidden">
          <h3 className="text-lg font-semibold text-gold mb-2">
            Featured Sponsors
          </h3>
          <div className="relative w-full h-32 overflow-hidden">
            <div className="absolute flex space-x-4 animate-scroll">
              {[1, 2, 3, 4, 5, 1, 2, 3, 4, 5].map((i, index) => (
                <div key={index} className="relative h-24 w-40">
                  <Image
                    src={`/ads/sample-banner${(i % 5) + 1}.jpg`}
                    alt={`Sample Banner ${i}`}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {keySections.map((item, index) => (
            <div
              key={index}
              className={`p-4 shadow-lg hover:scale-105 transition transform rounded-lg ${
                item.title === "Our Marketplace"
                  ? "bg-gradient-to-br from-yellow-700 to-yellow-500 text-black border-2 border-yellow-400 ring-2 ring-yellow-500"
                  : "bg-gray-800 bg-opacity-80 text-white border border-gray-700"
              }`}
            >
              {item.title === "Our Marketplace" && (
                <span className="inline-block bg-black text-yellow-400 text-xs font-bold px-2 py-1 rounded-full mb-2 animate-pulse">
                  🔥 Popular
                </span>
              )}
              <Link href={item.href}>
                <h2 className="text-xl font-semibold hover:underline cursor-pointer">
                  {item.title}
                </h2>
              </Link>
              <p className="text-sm mt-2">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Advertise Section */}
        <section className="bg-gray-900 border border-gold rounded-lg shadow p-4 text-center my-6 animate-fadeIn">
          <h2 className="text-xl font-semibold text-gold flex items-center justify-center gap-2 mb-1">
            📢 Advertise with Us
          </h2>
          <p className="text-sm text-gray-400 mb-2">
            Promote your business today to thousands of engaged users across our
            platform.
          </p>
          <Link href="/advertise-with-us">
            <button className="px-4 py-1.5 bg-gold text-black text-sm rounded hover:bg-yellow-500 transition">
              View Ad Options
            </button>
          </Link>
        </section>
      </main>

      {/* Footer */}
    
<footer className="text-center py-8 border-t border-gold mt-8 relative z-10">
  <div className="mx-auto mb-4 w-[60px] h-[60px] relative">
    <Image
      src="/bwe-logo.png"
      alt="BWE Logo"
      fill
      style={{ objectFit: "contain" }}
      priority
    />
  </div>
  <h2 className="text-lg font-bold text-gray-300">
    Join the BWE Community & Build Wealth
  </h2>
</footer>


      <style jsx>{`
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-pulseGlow {
          animation: pulseGlow 2s infinite;
        }

        @keyframes pulseGlow {
          0%,
          100% {
            box-shadow:
              0 0 5px #ffd700,
              0 0 10px #ffd700;
          }
          50% {
            box-shadow:
              0 0 20px #ffd700,
              0 0 30px #ffd700;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 1s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
