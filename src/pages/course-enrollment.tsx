import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

// Course config (expandable later)
const COURSE_DATA = {
  slug: "personal-finance-101",
  name: "Personal Finance 101: Mastering Budgeting, Saving, and Money Management",
  price: 49,
  overview: (
    <>
      <p>
        Personal Finance 101 is designed to help you build a rock-solid foundation for financial wellness, no matter your starting point. This course provides clear, actionable steps to master your money, avoid common pitfalls, and set yourself up for long-term success. You will discover proven strategies for:
      </p>
      <ul className="list-disc ml-6 mt-3">
        <li>Setting realistic and achievable financial goals</li>
        <li>Designing a personalized budget that actually works for you</li>
        <li>Building savings for both emergencies and future dreams</li>
        <li>Managing, reducing, and eliminating debt with confidence</li>
        <li>Developing habits that support lasting financial well-being</li>
      </ul>
      <p className="mt-3">
        Whether you are new to managing money or want a refresher, this course will empower you to take control of your financial future!
      </p>
    </>
  ),
  learningOutcomes: [
    "Understand how to set and achieve your financial goals",
    "Create and stick to a practical budget",
    "Develop strong saving habits for short- and long-term needs",
    "Implement proven strategies to manage and reduce debt",
    "Build lasting, healthy financial habits for every stage of life",
    "Gain confidence in making everyday money decisions",
  ],
  modules: [
    "Module 1: Introduction to Personal Finance",
    "Module 2: Setting Financial Goals",
    "Module 3: Creating a Budget",
    "Module 4: Saving for the Future",
    "Module 5: Debt Management Strategies",
    "Module 6: Smart Spending and Avoiding Pitfalls",
    "Module 7: Building Healthy Financial Habits",
    "Module 8: The Power of Compound Interest",
  ],
};

const CourseEnrollmentPage: React.FC = () => {
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
        .then(res => res.json())
        .then(data => {
          if (data.paid) {
            setHasPurchased(true);
            router.replace(router.pathname, undefined, { shallow: true });
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [router.query.session_id]);

  // Simple local login/signup mock handlers
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
        body: JSON.stringify({ courseSlug: COURSE_DATA.slug }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Unable to start checkout session.");
      }
    } catch (error) {
      // This will NOT break the build
      alert("Something went wrong with payment.");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoBack = () => router.back();

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Navigation Buttons */}
        <div className="flex gap-4 mb-4">
          <button
            onClick={handleGoBack}
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
        </header>

        {/* Course Overview */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Course Overview</h2>
          <div className="mt-4 text-gray-300">{COURSE_DATA.overview}</div>
        </section>

        {/* Learning Outcomes */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Learning Outcomes</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            {COURSE_DATA.learningOutcomes.map((outcome, idx) => (
              <li key={idx}>{outcome}</li>
            ))}
          </ul>
        </section>

        {/* Course Modules */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Course Modules</h2>
          <ul className="list-decimal ml-6 mt-4 text-gray-300">
            {COURSE_DATA.modules.map((mod, i) => (
              <li key={i}>{mod}</li>
            ))}
          </ul>
        </section>

        {/* Payment & Enrollment */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Course Access</h2>
          <p className="mt-4 text-gray-300">
            <span className="font-bold text-gold">
              One-time Fee: ${COURSE_DATA.price}
            </span>
            <br />
            Secure your seat and get lifetime access to all content & updates!
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
                {isProcessing ? "Redirecting to Payment..." : `Buy & Enroll for $${COURSE_DATA.price}`}
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
            <li>Access downloadable resources (budget templates, trackers, and more).</li>
            <li>Exclusive Black Wealth Exchange tips and support.</li>
          </ul>
        </section>

        {/* Testimonials */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            What Students Are Saying
          </h2>
          <blockquote className="mt-4 text-gray-300">
            &quot;This course helped me finally take control of my finances. I am now confidently budgeting, saving, and planning for the future!&quot; – Sarah M.
          </blockquote>
          <blockquote className="mt-4 text-gray-300">
            &quot;I have learned so much about managing debt and setting realistic financial goals. It is practical and easy to follow!&quot; – James T.
          </blockquote>
        </section>

        {/* FAQ Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Frequently Asked Questions</h2>
          <ul className="mt-4 space-y-2 text-gray-300">
            <li>
              <strong>Q: Do I need prior experience to take this course?</strong>
              <br />
              A: No, this course is designed for beginners and everyone interested in mastering their finances.
            </li>
            <li>
              <strong>Q: How long do I have access to the course?</strong>
              <br />
              A: Lifetime access, including all future updates.
            </li>
            <li>
              <strong>Q: Can I download the course materials?</strong>
              <br />
              A: Yes! You will be able to download worksheets, templates, and more.
            </li>
            <li>
              <strong>Q: Do I have to pay a monthly fee?</strong>
              <br />
              A: No, just a one-time payment for unlimited access.
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
              href="/courses/generational-wealth"
              className="text-gold hover:underline"
            >
              Building Generational Wealth
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

export default CourseEnrollmentPage;
