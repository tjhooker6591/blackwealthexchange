import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

const COURSE_DATA = {
  name: "Building Generational Wealth: Create, Protect & Transfer Lasting Legacy",
  price: 49,
  overview: (
    <>
      <p>
        This course teaches you{" "}
        <b>how to build, protect, and transfer wealth</b> using practical,
        culturally aware strategies. You’ll get tools, action steps, and
        resources for every stage of the journey.
      </p>
      <ul className="list-disc ml-6 mt-3">
        <li>
          Understand key wealth-building assets: real estate, stocks, insurance,
          and businesses
        </li>
        <li>Develop strong saving, investing, and spending habits</li>
        <li>Start a family legacy plan and estate documents</li>
        <li>Protect wealth with trusts, insurance, and tax strategies</li>
        <li>Teach the next generation how to manage and grow wealth</li>
      </ul>
      <p className="mt-3">
        Break cycles of struggle and create lasting opportunity for your family
        and community.
      </p>
    </>
  ),
  learningOutcomes: [
    "Build wealth through real estate, stocks, business ownership, and insurance.",
    "Develop saving, investing, and smart spending habits.",
    "Create a family legacy plan and simple estate documents.",
    "Protect your wealth with proper legal tools.",
    "Transfer knowledge and assets to future generations.",
    "Join a supportive community of wealth builders.",
  ],
  modules: [
    "Module 1: Mindset for Wealth – Vision, goals, and generational thinking",
    "Module 2: Financial Literacy Fundamentals – Budgeting, credit, debt, and banking",
    "Module 3: Homeownership – Building equity, buying wisely, family legacy",
    "Module 4: Investing 101 – Stocks, bonds, mutual funds, and real estate",
    "Module 5: Business Ownership – Starting/acquiring a business, succession planning",
    "Module 6: Life Insurance & Protection – Using insurance to build and transfer wealth",
    "Module 7: Estate Planning – Wills, trusts, beneficiaries, and protecting assets",
    "Module 8: Teaching the Next Generation – Family education and community impact",
    "Module 9: Community Wealth – Group investing, buying back the block",
  ],
};

const GenerationalWealthCourse: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Clear "isLoggedIn" for testing, REMOVE this line in production!
    // localStorage.removeItem("isLoggedIn");

    const userLoggedIn = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(!!userLoggedIn);
    setLoading(false);
  }, []);

  const handleBackClick = () => router.back();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Navigation Buttons */}
        <div className="flex gap-4 mb-4">
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
          <h1 className="text-3xl font-bold text-gold">{COURSE_DATA.name}</h1>
          <p className="text-gray-300 mt-2">
            Unlock step-by-step strategies to build real wealth, transfer it to
            your family, and uplift your community.
          </p>
        </header>

        {/* Course Overview */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Course Overview
          </h2>
          <div className="mt-4 text-gray-300">{COURSE_DATA.overview}</div>
        </section>

        {/* Learning Outcomes */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Learning Outcomes
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            {COURSE_DATA.learningOutcomes.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Course Modules */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Course Modules
          </h2>
          <ul className="list-decimal ml-6 mt-4 text-gray-300">
            {COURSE_DATA.modules.map((mod, i) => (
              <li key={i}>{mod}</li>
            ))}
          </ul>
        </section>

        {/* Payment & Enrollment */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Course Access
          </h2>
          <p className="mt-4 text-gray-300">
            <span className="font-bold text-gold">
              One-time Fee: ${COURSE_DATA.price}
            </span>
            <br />
            Secure your seat and get lifetime access to all content & updates!
          </p>
          <div className="mt-4">
            {isLoggedIn ? (
              <button
                onClick={() => router.push("/course-dashboard")}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition"
              >
                Go to Course Dashboard
              </button>
            ) : (
              <button
                type="button"
                className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
                // No onClick for now—payment integration later
              >
                Buy & Enroll
              </button>
            )}
          </div>
        </section>

        {/* Why Enroll? */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Why Enroll?</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Lifetime access to all course materials and updates.</li>
            <li>Learn at your own pace, from any device.</li>
            <li>Access downloadable resources and wealth planning tools.</li>
            <li>
              Exclusive tips and community support from Black Wealth Exchange.
            </li>
          </ul>
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

        {/* FAQ Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Frequently Asked Questions
          </h2>
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
              <strong>Q: Will I need to buy anything else?</strong>
              <br />
              A: No, all tools and resources are included with your course fee.
            </li>
            <li>
              <strong>Q: How long do I have access?</strong>
              <br />
              A: Lifetime access, including all updates.
            </li>
          </ul>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p>
            <Link
              href="/courses/investing-for-beginners"
              className="text-gold hover:underline"
            >
              Investing for Beginners
            </Link>{" "}
            |{" "}
            <Link
              href="/courses/personal-finance-101"
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
