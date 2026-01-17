import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import CourseTOC from "@/components/CourseTOC";

const COURSE = {
  slug: "investing-for-beginners",
  name: "Investing for Beginners: Build Wealth, Support Black-Owned Businesses, and Grow Your Future",
  price: 39,
  overview: (
    <>
      <p>
        This in-depth course introduces you to the fundamentals of
        investing—from stocks and bonds to real estate and gold. Learn proven
        steps to start investing, manage your portfolio, avoid costly mistakes,
        and make your money work for you. Discover unique ways to invest that
        empower Black excellence and support Black-owned businesses. This is
        more than just stocks: you will learn to build a future of wealth,
        freedom, and community impact!
      </p>
      <ul className="list-disc ml-6 mt-3">
        <li>Build and diversify your portfolio with confidence</li>
        <li>
          Master the basics of stocks, bonds, mutual funds, and alternative
          assets
        </li>
        <li>
          Understand risk, return, and how to align your investments with your
          goals
        </li>
        <li>
          Access unique Black-owned investment opportunities—including gold &
          silver
        </li>
        <li>Learn how to avoid the most common beginner mistakes</li>
      </ul>
      <p className="mt-3">
        Whether you are starting with $10 or $10,000, this course makes
        investing accessible and impactful for you and your community!
      </p>
    </>
  ),
  learningOutcomes: [
    "Confidently explain stocks, bonds, mutual funds, ETFs, and real estate",
    "Set and pursue clear investment goals that support your life dreams",
    "Understand and manage investment risk for your situation",
    "Diversify and rebalance your portfolio like a pro",
    "Spot and access Black-owned companies, real estate, and alternative investments",
    "Begin investing in gold & silver with guidance from Black-owned firms",
    "Develop habits for lifelong investing success and wealth-building",
  ],
  modules: [
    "Module 1: Introduction to Investing & Why It Matters",
    "Module 2: Types of Investments (Stocks, Bonds, Funds, Real Estate, Alternatives)",
    "Module 3: The Power of Compound Growth",
    "Module 4: Risk, Return, and Building a Diversified Portfolio",
    "Module 5: How to Get Started Step-by-Step",
    "Module 6: Supporting Black-Owned Businesses & Black Wealth",
    "Module 7: Investing in Gold, Silver & Alternative Assets",
    "Module 8: Avoiding Common Mistakes",
    "Module 9: Tools & Resources for Black Investors",
  ],
};

const InvestingForBeginners: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const userLoggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(!!userLoggedIn);

    const sessionId = router.query.session_id as string | undefined;
    if (userLoggedIn && sessionId) {
      fetch(`/api/courses/verify-session?session_id=${sessionId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.paid) {
            setHasPurchased(true);
            router.replace(router.pathname, undefined, { shallow: true });
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [router, router.query.session_id]);

  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
  };

  const handleSignUp = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
  };

  // Stripe payment handler
  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/courses/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug: COURSE.slug }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Unable to start checkout session.");
      }
    } catch {
      alert("Something went wrong with payment.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Nav Buttons */}
        <div className="mb-4 flex gap-3">
          <Link href="/investment">
            <button
              aria-label="Go Back"
              className="px-4 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
            >
              Go Back
            </button>
          </Link>
          <Link href="/">
            <button
              aria-label="Go to Home"
              className="px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition"
            >
              Home
            </button>
          </Link>
        </div>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gold">
            {COURSE.name}
          </h1>
        </header>

        <p className="mb-4 text-lg">
          Welcome! This course is your step-by-step guide to building wealth
          through investing—no prior experience required. We focus on real
          strategies for beginners, and on closing the wealth gap in the Black
          community by providing the tools, knowledge, and motivation you need
          to invest confidently.
        </p>

        {/* Course Overview */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Course Overview
          </h2>
          <div className="mt-4 text-gray-300">{COURSE.overview}</div>
        </section>

        {/* Learning Outcomes */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Learning Outcomes
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            {COURSE.learningOutcomes.map((outcome, idx) => (
              <li key={idx}>{outcome}</li>
            ))}
          </ul>
        </section>

        {/* Table of Contents - direct access to modules */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Jump To a Module
          </h2>
          <CourseTOC />
        </section>

        {/* Enrollment Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Course Access
          </h2>
          <p className="mt-4 text-gray-300">
            <span className="font-bold text-gold">
              One-time Fee: ${COURSE.price}
            </span>
            <br />
            Pay once for lifetime access and future updates.
          </p>
          <div className="mt-4">
            {!isLoggedIn ? (
              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleSignUp}
                  className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
                >
                  Sign Up to Enroll
                </button>
                <button
                  onClick={handleLogin}
                  className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
                >
                  Log In to Continue
                </button>
              </div>
            ) : !hasPurchased ? (
              <button
                onClick={handlePurchase}
                disabled={isProcessing}
                className="bg-gold text-black py-2 px-6 rounded font-bold hover:bg-yellow-500 transition disabled:opacity-60"
              >
                {isProcessing
                  ? "Redirecting to Payment..."
                  : `Buy & Enroll for $${COURSE.price}`}
              </button>
            ) : (
              <button
                onClick={() => router.push("/course-dashboard")}
                className="bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition"
              >
                Go to Course Dashboard
              </button>
            )}
          </div>
        </section>

        {/* Why Enroll? */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Why Enroll?</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Lifetime access to all course materials and updates.</li>
            <li>Self-paced: return anytime, from any device.</li>
            <li>
              Access downloadable resources (investment trackers, templates, and
              more).
            </li>
            <li>Exclusive Black Wealth Exchange strategies and support.</li>
          </ul>
        </section>

        {/* Testimonials */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            What Students Are Saying
          </h2>
          <blockquote className="mt-4 text-gray-300">
            &quot;I started with no investing knowledge and now I feel empowered
            to build my wealth. This course is clear, practical, and focused on
            our community!&quot; – Malik W.
          </blockquote>
          <blockquote className="mt-4 text-gray-300">
            &quot;Great value and actionable steps. I love the emphasis on
            Black-owned investments and real community impact.&quot; – Alicia D.
          </blockquote>
        </section>

        {/* FAQ Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Frequently Asked Questions
          </h2>
          <ul className="mt-4 space-y-2 text-gray-300">
            <li>
              <strong>Q: Do I need any prior investing experience?</strong>
              <br />
              A: No, this course is designed for total beginners and those who
              want a practical path to building wealth.
            </li>
            <li>
              <strong>
                Q: Will I learn how to invest in Black-owned businesses?
              </strong>
              <br />
              A: Absolutely! There is a focus on Black-owned public and private
              investment opportunities, as well as community wealth building.
            </li>
            <li>
              <strong>Q: Do I have to pay a monthly fee?</strong>
              <br />
              A: No, you only pay a one-time enrollment for lifetime access.
            </li>
            <li>
              <strong>Q: Can I access the course on my phone?</strong>
              <br />
              A: Yes! The course is fully mobile responsive.
            </li>
          </ul>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p>
            <Link
              href="/courses/personal-finance-101"
              className="text-gold hover:underline"
            >
              Personal Finance 101
            </Link>
            {" | "}
            <Link
              href="/courses/generational-wealth"
              className="text-gold hover:underline"
            >
              Building Generational Wealth
            </Link>
          </p>
          <p className="mt-4">
            <Link href="/contact" className="text-gold hover:underline">
              Contact Us
            </Link>
            {" | "}
            <Link href="/privacy-policy" className="text-gold hover:underline">
              Privacy Policy
            </Link>
            {" | "}
            <Link href="/terms-of-use" className="text-gold hover:underline">
              Terms of Use
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default InvestingForBeginners;
