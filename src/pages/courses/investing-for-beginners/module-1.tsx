import React from "react";
import Link from "next/link";

export default function Module1() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto bg-gray-800 p-6 md:p-10 rounded-xl shadow-xl">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-5 text-gold drop-shadow">
          Module 1: Introduction to Investing & Why It Matters
        </h1>

        <p className="mb-6 text-lg text-gray-200">
          Welcome to <span className="text-gold font-semibold">Investing for Beginners</span>! This first module is your doorway into the world of building wealth, changing your family’s story, and fueling Black excellence. Here’s why investing is the key to true financial power—especially for our community.
        </p>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">What is Investing?</h2>
          <p>
            <span className="text-gold font-bold">Investing</span> means using your money to buy assets—like stocks, real estate, or businesses—with the goal of growing your wealth over time. Unlike just saving, investing makes your money work for you, generating income and multiplying value.
          </p>
          <ul className="list-disc ml-6 my-3">
            <li>Investing involves risk, but offers far greater long-term rewards than saving alone.</li>
            <li>Examples: Owning a rental property, buying shares in a company, or funding a local business.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Why Invest?</h2>
          <div className="bg-gray-900 bg-opacity-80 border-l-4 border-gold p-4 mb-4 rounded-lg shadow">
            <span className="block text-gold font-semibold mb-2">Did You Know?</span>
            <ul className="list-disc ml-6 text-gray-200">
              <li>$10,000 in a savings account at 0.05% interest for 20 years ≈ <span className="font-bold text-gold">$10,100</span></li>
              <li>$10,000 invested at 7% for 20 years ≈ <span className="font-bold text-gold">$38,700</span></li>
            </ul>
            <span className="block mt-2 text-gray-300 text-sm">*Investing is how everyday people become millionaires over time.</span>
          </div>
          <p>
            If you only save, inflation (rising prices) slowly erodes your money’s value. Investing grows your money faster than inflation, lets you earn more, and puts your dreams—like buying a home or sending your kids to college—within reach.
          </p>
          <p className="mt-2">
            Investing is <span className="text-gold font-semibold">the foundation of financial freedom</span>. It’s how you break cycles and create options for yourself and your family.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Why Investing is Crucial for Black Wealth</h2>
          <p>
            <span className="text-gold font-bold">Generational wealth</span> in America has often been built through investing—real estate, businesses, and stocks. Systemic barriers have blocked Black families from these opportunities for generations.
          </p>
          <ul className="list-disc ml-6 my-2">
            <li>Median Black family wealth is less than 15% of that of white families.</li>
            <li>Ownership = Power. Every Black investor is a pioneer for our community’s future.</li>
          </ul>
          <div className="bg-black bg-opacity-60 rounded-lg shadow-md p-4 my-4">
            <strong>Real-life Example:</strong> <br />
            A Black family invests together for 15 years, using their returns to buy their first home and fund a child’s education. This creates generational progress that multiplies in the next generation.
          </div>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Change Your Mindset: Ownership & Legacy</h2>
          <ul className="list-disc ml-6 text-gray-200">
            <li>Investing is about <span className="text-gold font-semibold">ownership</span>—not just making money.</li>
            <li>Your dollars are a vote: every time you invest, you claim your piece of the future.</li>
            <li>Supporting Black-owned businesses multiplies wealth and power in our community.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Action Steps for You</h2>
          <ul className="list-disc ml-6">
            <li>
              <span className="text-gold">Reflect:</span> Why do you want to invest? (Financial freedom, family legacy, giving back?)
            </li>
            <li>
              Write a personal <span className="text-blue-300">Investing Vision Statement</span>: “I invest because…”
            </li>
            <li>
              Talk with a family member or friend about their experiences (or fears) with investing. Break the silence!
            </li>
          </ul>
        </section>

        <section className="mb-14">
          <h2 className="text-xl font-bold mb-2 text-gold">Key Takeaways</h2>
          <ul className="list-disc ml-6 text-gray-100">
            <li>Investing is essential for building wealth and financial freedom.</li>
            <li>The earlier you start, the more compounding works for you.</li>
            <li>Investing is the key to closing the racial wealth gap and building generational power.</li>
            <li>Ownership creates legacy—start now, even if it’s small!</li>
          </ul>
        </section>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-10">
          <Link href="/courses/investing-for-beginners">
            <span className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white cursor-pointer shadow">
              ← Back to Course Home
            </span>
          </Link>
          <Link href="/courses/investing-for-beginners/module-2">
            <span className="px-4 py-2 rounded bg-gold hover:bg-yellow-400 text-black font-bold shadow transition">
              Next: Types of Investments →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
