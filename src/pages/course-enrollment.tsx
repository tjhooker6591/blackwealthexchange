import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router"; // Import useRouter hook

const CourseEnrollmentPage: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true); // State to handle loading while checking login status
  const router = useRouter(); // Instantiate useRouter hook

  // Check if the user is logged in by accessing localStorage
  useEffect(() => {
    const userLoggedIn = localStorage.getItem("isLoggedIn");
    if (userLoggedIn) {
      setIsLoggedIn(true);
    }
    setLoading(false); // Stop loading once the login check is done
  }, []);

  // Simulate the login process
  const handleLogin = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
    router.push("/course-dashboard"); // Redirect to Course Dashboard after login
  };

  // Simulate the sign-up process
  const handleSignUp = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
    router.push("/course-dashboard"); // Redirect to Course Dashboard after sign-up
  };

  // Function to handle the back button
  const handleBackClick = () => {
    router.back(); // Go back to the previous page in history
  };

  // If loading, show a loading state
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={handleBackClick} // Call handleBackClick on button click
            aria-label="Go Back"
            className="px-4 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
          >
            Go Back
          </button>
        </div>

        {/* Home Button */}
        <div className="mb-4">
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
          <h1 className="text-3xl font-bold text-gold">
            Personal Finance 101: Mastering Budgeting, Saving, and Money
            Management
          </h1>
          <p className="text-gray-300 mt-2">
            Learn the basics of budgeting, saving, and managing money
            effectively.
          </p>
        </header>

        {/* Course Overview */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Course Overview
          </h2>
          <p className="mt-4 text-gray-300">
            Personal Finance 101 is designed to help you get a solid grasp on
            managing your money. Whether you&rsquo;rsquo;rsquo;rsquo;re new to
            managing your finances or just need a refresher, this course will
            teach you essential skills such as creating a budget, saving for the
            future, and managing debt. Get started today and take control of
            your financial future!
          </p>
        </section>

        {/* Learning Outcomes */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Learning Outcomes
          </h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              Understand the Basics of Budgeting: Learn how to create a budget
              that works for you.
            </li>
            <li>
              Develop Effective Saving Habits: Save for both short-term and
              long-term goals.
            </li>
            <li>
              Manage and Reduce Debt: Gain strategies for tackling debt and
              improving your financial situation.
            </li>
            <li>
              Build Healthy Financial Habits: Learn how to stay disciplined and
              consistent in your financial journey.
            </li>
          </ul>
        </section>

        {/* Course Content Overview */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Course Content Overview
          </h2>
          <ul className="list-decimal ml-6 mt-4 text-gray-300">
            <li>Module 1: Introduction to Personal Finance</li>
            <li>Module 2: Setting Financial Goals</li>
            <li>Module 3: Creating a Budget</li>
            <li>Module 4: Saving for the Future</li>
            <li>Module 5: Debt Management Strategies</li>
            <li>Module 6: Smart Spending and Avoiding Pitfalls</li>
            <li>Module 7: Building Healthy Financial Habits</li>
            <li>Module 8: The Power of Compound Interest</li>
          </ul>
          <p className="mt-4 text-blue-500">
            <Link href="#learn-more">Learn more about each module</Link>
          </p>
        </section>

        {/* Enrollment Instructions */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            How to Enroll
          </h2>
          <p className="mt-4 text-gray-300">
            To begin the course, please sign up or log in if you already have an
            account. It&rsquo;rsquo;rsquo;rsquo;s free and will only take a few
            moments! Once you'apos;re enrolled, you&rsquo;rsquo;rsquo;rsquo;ll
            have access to all course materials and can start learning
            immediately at your own pace.
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
              <>
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
              </>
            )}
          </div>
        </section>

        {/* Benefits of Enrolling */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Why Enroll?</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              No cost to you! This course is 100% free to help you take charge
              of your financial future.
            </li>
            <li>
              Enroll once and get lifetime access to the course materials,
              including any future updates.
            </li>
            <li>Learn at your own pace with on-demand content and quizzes.</li>
            <li>
              Get access to downloadable resources like budgeting templates and
              debt trackers.
            </li>
          </ul>
        </section>

        {/* Testimonials */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            What Students Are Saying
          </h2>
          <blockquote className="mt-4 text-gray-300">
            "This course helped me finally take control of my finances.
            I&rsquo;rsquo;rsquo;rsquo;m now confidently budgeting, saving, and
            planning for the future!" – Sarah M.
          </blockquote>
          <blockquote className="mt-4 text-gray-300">
            "I&rsquo;rsquo;rsquo;rsquo;ve learned so much about managing debt
            and setting realistic financial goals. It&rsquo;rsquo;rsquo;rsquo;s
            practical and easy to follow!" – James T.
          </blockquote>
        </section>

        {/* FAQ Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">
            Frequently Asked Questions
          </h2>
          <ul className="mt-4 space-y-2 text-gray-300">
            <li>
              <strong>
                Q: Do I need prior experience to take this course?
              </strong>
              <br />
              A: No, this course is designed for beginners.
            </li>
            <li>
              <strong>Q: How long do I have access to the course?</strong>
              <br />
              A: You have lifetime access to all course materials.
            </li>
            <li>
              <strong>Q: Can I download the course materials?</strong>
              <br />
              A: Yes! You'apos;ll be able to download worksheets, templates, and
              other resources.
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
              href="/building-generational-wealth"
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
