import React from "react";
import { useRouter } from "next/router";
import Link from "next/link";

const Module4: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto bg-gray-800 p-6 rounded-lg shadow-lg">
        {/* Back Button */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/course-dashboard')}
            className="px-4 py-2 bg-gray-600 text-white font-bold rounded hover:bg-gray-700 transition"
          >
            Back to Course Dashboard
          </button>
        </div>

        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gold">Module 4: Saving for the Future</h1>
          <p className="text-gray-300 mt-2">
            Learn the importance of saving for future needs and how to create specific savings goals.
          </p>
        </header>

        {/* Overview Section */}
        <section className="mt-8">
          <h2 className="text-2xl font-semibold text-blue-500">Overview</h2>
          <p className="text-gray-300">
            In this module, you will learn the importance of saving for future needs and how to create specific savings goals.
          </p>
        </section>

        {/* The Importance of Building an Emergency Fund */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">The Importance of Building an Emergency Fund</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>An emergency fund is essential for handling unexpected expenses without going into debt.</li>
            <li>Aim to save 3-6 months' worth of living expenses in a high-yield savings account to cover emergencies like medical bills or car repairs.</li>
          </ul>
        </section>

        {/* Different Types of Savings Accounts */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Different Types of Savings Accounts</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li><strong>Traditional Savings Account:</strong> Offers low interest, but it’s easily accessible in emergencies.</li>
            <li><strong>High-Yield Savings Account:</strong> Offers higher interest rates, allowing your savings to grow faster.</li>
            <li><strong>Certificates of Deposit (CDs):</strong> Fixed-term accounts that offer higher interest rates but lock your money for a set period.</li>
          </ul>
        </section>

        {/* Saving for Specific Goals */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Saving for Specific Goals</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li><strong>Vacation Fund:</strong> Set a target amount based on your destination, and break it down into monthly savings goals.</li>
            <li><strong>Home Fund:</strong> Save for a down payment on a home—aim for at least 20% of the home’s purchase price.</li>
            <li><strong>Education Fund:</strong> Consider starting a 529 College Savings Plan or a custodial account for your children’s education.</li>
          </ul>
        </section>

        {/* Key Takeaways */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Key Takeaways</h2>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>An emergency fund is essential for financial stability and avoiding debt during tough times.</li>
            <li>Different types of savings accounts serve different purposes, so choose based on your needs.</li>
            <li>Setting specific savings goals will keep you motivated and on track to achieve them.</li>
          </ul>
        </section>

        {/* Next Steps */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Next Steps</h2>
          <p className="text-gray-300">
            Move on to the next module, where we will explore debt management strategies.
          </p>
          <Link href="/module/5">
            <button className="mt-4 py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">
              Continue To Module 5
            </button>
          </Link>
        </section>

        {/* Downloadable Resource */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Downloadable Resource</h2>
          <p className="text-gray-300">
            Download the <strong>Emergency Fund Savings Plan</strong> to help you create a savings strategy for emergencies and future goals.
          </p>
          <a
            href="https://www.example.com/emergency-fund-savings-plan"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Download Emergency Fund Savings Plan
          </a>
        </section>

        {/* Quiz */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-blue-500">Quiz</h2>
          <p className="text-gray-300">Test your understanding of emergency funds:</p>
          <ul className="list-disc ml-6 mt-4 text-gray-300">
            <li>Question 1: What is the primary purpose of an emergency fund?</li>
            <li>A) To pay for luxury items</li>
            <li>B) To cover unexpected expenses without going into debt</li>
            <li>C) To invest in stocks</li>
            <p className="text-green-500">Answer: B</p>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Module4;