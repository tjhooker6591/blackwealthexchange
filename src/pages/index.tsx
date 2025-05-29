"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, GraduationCap, Users, Briefcase } from "lucide-react";
import { useRouter } from "next/router";

// MODAL COMPONENT
function ConsultingInterestModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/consulting-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setName("");
        setEmail("");
        onClose();
      }, 1600);
    } catch {
      setError("Could not submit. Please try again.");
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-lg p-8 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-400 hover:text-gold text-2xl font-bold"
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-xl font-bold text-gold mb-3">Notify Me: Consulting Interest</h2>
        {submitted ? (
          <div className="text-green-400 text-center font-semibold">
            Thank you! We’ll notify you at launch.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Your Name"
              required
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="email"
              placeholder="Your Email"
              required
              className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <div className="text-red-400 text-center text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-gold text-black font-semibold rounded py-2 hover:bg-yellow-500 transition"
            >
              Notify Me
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

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
          KNOWLEDGE IS POWER – Select Here to &quot;SEE WHERE YOUR MONEY GOES&quot;
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
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();

  const sponsors = [
    { img: "/ads/sample-banner1.jpg", name: "Pamfa Hoodies" },
    { img: "/ads/sample-banner2.jpg", name: "Titan Era" },
    { img: "/ads/sample-banner3.jpg", name: "Legacy FoodMart" },
    { img: "/ads/sample-banner4.jpg", name: "Ujamaa Eats" },
    { img: "/ads/sample-banner5.jpg", name: "Pamfa United Citizens" },
    { img: "/ads/sample-banner6.jpg", name: "Harlem Apparel" },
    { img: "/ads/sample-banner7.jpg", name: "Ebony Roots" },
    { img: "/ads/sample-banner8.jpg", name: "Coco and Breezy Eyewear" },
  ];

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
      title: "Stay Black Informed",
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
      <div className="absolute inset-0 bg-black opacity-100" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-50" />

      <header className="text-center py-24 relative z-10">
        <p className="text-lg md:text-xl mt-4 font-light text-gray-300 animate-fadeIn flex justify-center items-center">
          <Image
            src="/black-wealth-future.png"
            alt="Black Wealth Emoji"
            width={58}
            height={58}
            className="inline-block mr-2"
          />
          The Future of Black Wealth Starts Here
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

          <Link href="/marketplace/become-a-seller">
            <button className="mt-4 bg-gold text-black text-center py-2 px-4 rounded-lg font-semibold shadow hover:bg-yellow-500 transition animate-pulseGlow">
              Start Selling on the Marketplace – Join as a Seller!
            </button>
          </Link>

          <div className="mt-2">
            <Link href="/library-of-black-history">
              <span className="text-gold font-bold hover:underline text-lg">
                📚 Explore the Library of Black History 🏛️
              </span>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 py-12 bg-gray-900">
        <div className="container mx-auto px-4">
          <h3 className="text-3xl font-bold text-center text-gold mb-8">
            Student Opportunities - Free Resource Information
          </h3>
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

      <main className="container mx-auto px-4 relative z-10">
        {/* Real Estate & Investment Section */}
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
              {[...sponsors, ...sponsors].map((sponsor, index) => (
                <div key={index} className="relative h-24 w-40">
                  <Image
                    src={sponsor.img}
                    alt={sponsor.name}
                    width={160}
                    height={96}
                    className="object-cover rounded-lg"
                    priority
                  />
                  {/* Sponsor Name Overlay */}
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-gold text-xs font-semibold px-2 py-1 rounded">
                    {sponsor.name}
                  </div>
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

        {/* Recruiting & Consulting Services (Coming Soon) */}
        <section className="container mx-auto px-4 bg-yellow-600 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
            {/* Text block */}
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold">
                  BWE Recruiting & Consulting Services
                </h3>
                <span className="inline-block bg-black text-yellow-400 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                  Coming Soon
                </span>
              </div>
              <p className="text-sm">
                We will soon launch a full talent-consulting service connecting
                you with rigorously vetted Black professionals. Employers hire
                top talent confidently, and students, job seekers & overlooked
                candidates secure meaningful opportunities.
              </p>
            </div>
            {/* Notify button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-black text-yellow-400 text-sm font-semibold rounded hover:bg-gray-900 transition"
              >
                Notify Me
              </button>
            </div>
          </div>
        </section>

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

      {/* Modal for Consulting Interest */}
      <ConsultingInterestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />

      {/* Footer */}
      <footer className="text-center py-8 border-t border-gold mt-8 relative z-10">
        <div className="mx-auto mb-4 w-[60px] h-[60px] relative">
          <Image
            src="/favicon.png"
            alt="BWE Logo"
            width={60}
            height={60}
            className="object-contain"
            priority
          />
        </div>
        <h2 className="text-lg font-bold text-gray-300">
          Join the BWE Community & Build Wealth
        </h2>
      </footer>

      {/* Animations */}
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
