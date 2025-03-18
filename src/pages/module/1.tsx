// src/pages/module/1.tsx
import React, { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

// Module 1: Introduction to Personal Finance Page
const Module1: React.FC = () => {
  const router = useRouter();
  const [quizCompleted, setQuizCompleted] = useState(false); // Track if quiz is completed

  // Handle quiz completion
  const handleQuizCompletion = () => {
    setQuizCompleted(true);
    // You can store completion in localStorage or a backend
    const completedModules = JSON.parse(
      localStorage.getItem("completedModules") || "[]",
    );
    completedModules.push("1");
    localStorage.setItem("completedModules", JSON.stringify(completedModules));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.push("/course-dashboard")}
            aria-label="Go Back"
            className="px-4 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Module Content */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gold">
            Module 1: Introduction to Personal Finance
          </h1>
          <p className="text-gray-300 mt-2">
            Learn the core concepts of personal finance and why it is important
            for a secure future.
          </p>
        </header>

        {/* Lesson Content */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Overview</h2>
          <p className="mt-4 text-gray-300">
            In this module, we&rsquo;ll introduce the basics of personal finance
            and explain why managing your finances is crucial for building a
            secure and successful future. By the end of this module, you&rsquo;
            understand the fundamental concepts that will guide you through the
            rest of the course.
          </p>
        </section>

        {/* Key Lessons */}
        <section className="mt-8">
          <h3 className="text-xl font-semibold text-blue-400">
            What is Personal Finance and Why is it Important?
          </h3>
          <p className="mt-4 text-gray-300">
            Personal finance is the process of managing your money, budgeting,
            saving, investing, and planning for future financial goals. It
            involves making informed decisions about how to use your income,
            manage your debts, and save for things like emergencies, retirement,
            or large purchases.
          </p>
          <p className="mt-4 text-gray-300">
            Why is personal finance important?
          </p>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              <strong>Financial Security:</strong> By understanding and
              controlling your finances, you can avoid unnecessary debt, build
              savings, and feel confident about your future.
            </li>
            <li>
              <strong>Control Over Your Life:</strong> Proper money management
              gives you the ability to make decisions based on your values,
              without the constant stress of living paycheck to paycheck.
            </li>
            <li>
              <strong>Wealth Building:</strong> Knowing how to save, invest, and
              plan long-term is essential for building wealth over time and
              ensuring a comfortable future.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h3 className="text-xl font-semibold text-blue-400">
            How Personal Finance Impacts Your Life and Future
          </h3>
          <p className="mt-4 text-gray-300">
            Understanding personal finance will not only help you in the short
            term but also set you up for long-term success.
          </p>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              <strong>Immediate Impact:</strong>
              <ul className="ml-6">
                <li>
                  <strong>Living Within Your Means:</strong> Effective
                  management allows you to spend wisely and avoid the trap of
                  debt.
                </li>
                <li>
                  <strong>Building Savings:</strong> With a good strategy, you
                  can start putting money aside for both short-term and
                  long-term goals.
                </li>
                <li>
                  <strong>Avoiding Unnecessary Debt:</strong> You&rsquo;ll learn
                  to avoid falling into the trap of using credit to pay for
                  things that you don&rsquo;t need.
                </li>
              </ul>
            </li>
            <li>
              <strong>Long-Term Impact:</strong>
              <ul className="ml-6">
                <li>
                  <strong>Planning Major Life Events:</strong> Personal finance
                  enables you to plan for significant life events such as buying
                  a home, starting a family, or retiring comfortably.
                </li>
                <li>
                  <strong>Financial Independence:</strong> As you grow your
                  savings and investments, you&rsquo;ll work towards financial
                  independence, where you no longer rely solely on a paycheck to
                  support your lifestyle.
                </li>
              </ul>
            </li>
          </ul>
        </section>

        {/* Key Takeaways */}
        <section className="mt-8">
          <h3 className="text-xl font-semibold text-blue-400">Key Takeaways</h3>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>
              <strong>Financial Security:</strong> A clear understanding of
              personal finance will give you peace of mind.
            </li>
            <li>
              <strong>Control Over Your Finances:</strong> Learning how to
              manage your finances is the key to living stress-free and
              achieving your financial goals.
            </li>
            <li>
              <strong>Wealth Building:</strong> With good financial management,
              you can make your money work for you, enabling you to build wealth
              over time.
            </li>
          </ul>
        </section>

        {/* Quiz Prompt */}
        {!quizCompleted && (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-blue-500">
              Quiz (Optional)
            </h2>
            <p className="mt-4 text-gray-300">
              Test your knowledge to proceed further in the course. Would you
              like to take the quiz?
            </p>
            <button
              onClick={handleQuizCompletion}
              className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
            >
              Take Quiz
            </button>
          </section>
        )}

        {/* Next Steps / Call to Action */}
        {quizCompleted && (
          <section className="mt-8">
            <h2 className="text-2xl font-semibold text-blue-500">Next Steps</h2>
            <p className="mt-4 text-gray-300">
              Great job! You&rsquo;ve completed this module.
            </p>
            <Link href="/module/2">
              <button className="mt-4 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition">
                Continue to Module 2
              </button>
            </Link>
          </section>
        )}

        {/* Next Steps and Downloadable Resource */}
        <section className="mt-8">
          <p className="text-gray-300">
            Continue to the next module where we&rsquo;ll teach you how to set
            financial goals, a crucial first step to successfully managing your
            money.
          </p>

          <div className="mt-4">
            <Link href="https://open.umn.edu/opentextbooks/textbooks/31">
              <button className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition">
                Download Personal Finance Overview PDF
              </button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Module1;
