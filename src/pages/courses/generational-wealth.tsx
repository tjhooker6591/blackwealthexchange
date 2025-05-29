import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const GenerationalWealthCourse: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const userLoggedIn = localStorage.getItem("isLoggedIn");
    if (userLoggedIn) setIsLoggedIn(true);
    setLoading(false);
  }, []);

  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
    router.push("/course-dashboard");
  };

  const handleSignUp = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
    router.push("/course-dashboard");
  };

  const handleBackClick = () => {
    router.back();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Back and Home Buttons */}
        <div className="flex justify-between mb-6">
          <button
            onClick={handleBackClick}
            aria-label="Go Back"
            className="px-4 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
          >
            Go Back
          </button>
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
          <h1 className="text-3xl md:text-4xl font-bold text-gold mb-2">
            Building Generational Wealth:
            <span className="block text-blue-500 mt-2 text-2xl">
              Create, Protect & Transfer Lasting Legacy
            </span>
          </h1>
          <p className="text-gray-300 mt-2">
            Unlock step-by-step strategies to build real wealth, transfer it to
            your family, and uplift your community.
          </p>
        </header>

        {/* What is Generational Wealth? */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            What is Generational Wealth?
          </h2>
          <p className="mt-4 text-gray-300">
            Generational wealth means assets and knowledge passed from one
            generation to the next. It’s homeownership, investments, family
            businesses, insurance, estate plans, and—most important—**financial
            wisdom**. This is how you break cycles of struggle and create
            lasting opportunity.
          </p>
        </section>

        {/* Why It Matters */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Why Is This So Important for Black Families?
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300 space-y-1">
            <li>Combat historic wealth gaps caused by discrimination.</li>
            <li>Protect your family from financial emergencies.</li>
            <li>
              Provide children with better education, security, and freedom.
            </li>
            <li>Enable business investment and home ownership.</li>
            <li>Empower future generations to start further ahead.</li>
          </ul>
        </section>

        {/* Course Overview */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gold">Course Overview</h2>
          <p className="mt-4 text-gray-300">
            This course teaches you **how to build, protect, and transfer
            wealth** using practical, culturally aware strategies. You’ll get
            tools, action steps, and resources for every stage of the journey.
          </p>
        </section>

        {/* Learning Outcomes */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Learning Outcomes
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300 space-y-1">
            <li>
              Understand key wealth-building assets: real estate, stocks, life
              insurance, and businesses.
            </li>
            <li>Develop strong saving, investing, and spending habits.</li>
            <li>Start a family legacy plan and estate documents.</li>
            <li>Protect wealth with trusts, insurance, and tax strategies.</li>
            <li>Teach the next generation how to manage and grow wealth.</li>
            <li>Connect with a supportive, like-minded community.</li>
          </ul>
        </section>

        {/* Course Content Modules */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gold">Course Modules</h2>
          <ol className="list-decimal ml-6 mt-4 text-gray-300 space-y-1">
            <li>
              <strong>Mindset for Wealth:</strong> Building vision and goals.
              Understanding the impact of generational thinking.
            </li>
            <li>
              <strong>Financial Literacy Fundamentals:</strong> Budgeting,
              credit, banking, and debt management for generational planning.
            </li>
            <li>
              <strong>Homeownership:</strong> Building equity, buying wisely,
              and keeping your home in the family.
            </li>
            <li>
              <strong>Investing 101:</strong> Stocks, bonds, mutual funds, and
              real estate explained for beginners.
            </li>
            <li>
              <strong>Business Ownership:</strong> Starting or acquiring
              businesses, succession planning, and legacy entrepreneurship.
            </li>
            <li>
              <strong>Life Insurance & Protection:</strong> Types, uses, and
              leveraging insurance as a wealth-building and transfer tool.
            </li>
            <li>
              <strong>Estate Planning:</strong> Wills, living trusts, power of
              attorney, and beneficiary designations made simple.
            </li>
            <li>
              <strong>Teaching the Next Generation:</strong> Tools and
              conversation starters for parents and mentors.
            </li>
            <li>
              <strong>Community Wealth:</strong> Group investing, buying back
              the block, and supporting Black-owned ventures.
            </li>
          </ol>
          <p className="mt-4 text-blue-500">
            <Link href="#details">See module details below</Link>
          </p>
        </section>

        {/* Action Steps */}
        <section className="mt-8" id="details">
          <h2 className="text-2xl font-semibold text-blue-500">
            Action Steps for Building Generational Wealth
          </h2>
          <ol className="list-decimal ml-6 mt-4 text-gray-300 space-y-1">
            <li>
              **Track your net worth and set specific family wealth goals.**
            </li>
            <li>
              **Establish an emergency fund and pay down high-interest debt.**
            </li>
            <li>
              **Open investment accounts for yourself and your children.**
            </li>
            <li>**Start or invest in a business with succession planning.**</li>
            <li>
              **Buy life insurance to cover final expenses and transfer
              wealth.**
            </li>
            <li>
              **Create a will and/or living trust with clear beneficiaries.**
            </li>
            <li>
              **Educate your family about wealth, responsibility, and
              stewardship.**
            </li>
          </ol>
        </section>

        {/* Resource Library */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gold">
            Downloadable Resources
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300 space-y-1">
            <li>
              <Link
                href="/downloads/family-wealth-plan.pdf"
                className="text-blue-400 underline"
              >
                Family Wealth Planning Worksheet
              </Link>
            </li>
            <li>
              <Link
                href="/downloads/legacy-checklist.pdf"
                className="text-blue-400 underline"
              >
                Legacy Transfer Checklist
              </Link>
            </li>
            <li>
              <Link
                href="/downloads/black-owned-business-directory.pdf"
                className="text-blue-400 underline"
              >
                Black-Owned Business Directory
              </Link>
            </li>
            <li>
              <Link
                href="/downloads/kids-money-guide.pdf"
                className="text-blue-400 underline"
              >
                Kids’ Guide to Money
              </Link>
            </li>
          </ul>
        </section>

        {/* Enrollment Instructions */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            How to Enroll
          </h2>
          <p className="mt-4 text-gray-300">
            Enroll for free by signing up or logging in! Once enrolled, you’ll
            unlock full access to all modules, downloads, and community
            discussions.
          </p>
        </section>

        {/* Sign Up / Log In Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Sign Up / Log In
          </h2>
          <div className="mt-4">
            {isLoggedIn ? (
              <button
                onClick={() => router.push("/course-dashboard")}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Start Course
              </button>
            ) : (
              <div className="space-y-4">
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
            )}
          </div>
        </section>

        {/* Benefits of Enrolling */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-gold">Why Enroll?</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300 space-y-1">
            <li>
              100% free: open to everyone looking to break the cycle and build a
              legacy.
            </li>
            <li>
              Lifetime access, updates, and new resources as they’re added.
            </li>
            <li>
              Connect with others on the same journey in our private community.
            </li>
            <li>Tools and downloads you can use with your whole family.</li>
          </ul>
        </section>

        {/* FAQ Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">FAQ</h2>
          <ul className="mt-4 space-y-2 text-gray-300">
            <li>
              <strong>
                Q: Can I take this course if I’m a complete beginner?
              </strong>
              <br />
              A: Absolutely! All concepts are explained step by step, with real
              examples.
            </li>
            <li>
              <strong>Q: Will I need to buy anything?</strong>
              <br />
              A: No, all tools and resources are included for free.
            </li>
            <li>
              <strong>Q: How do I keep my information safe?</strong>
              <br />
              A: The course includes guides on privacy, asset protection, and
              security.
            </li>
          </ul>
        </section>

        {/* Footer Section */}
        <footer className="mt-12 text-center">
          <p>
            <Link
              href="/investing-for-beginners"
              className="text-gold hover:underline"
            >
              Investing for Beginners
            </Link>{" "}
            |{" "}
            <Link
              href="/personal-finance-101"
              className="text-gold hover:underline"
            >
              Personal Finance 101
            </Link>
          </p>
          <p className="mt-4">
            <Link href="/contact" className="text-gold hover:underline">
              Contact Us
            </Link>{" "}
            |{" "}
            <Link href="/privacy-policy" className="text-gold hover:underline">
              Privacy Policy
            </Link>{" "}
            |{" "}
            <Link href="/terms-of-use" className="text-gold hover:underline">
              Terms of Use
            </Link>
          </p>
        </footer>
      </div>
    </div>
  );
};

export default GenerationalWealthCourse;
