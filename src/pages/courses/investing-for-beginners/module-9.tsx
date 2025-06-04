import React from "react";
import Link from "next/link";

export default function Module9() {
  return (
    <div className="min-h-screen bg-gray-900 text-white px-4 py-12">
      <div className="max-w-3xl mx-auto bg-gray-800 p-6 md:p-10 rounded-xl shadow-xl">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gold">
          Module 9: Tools & Resources for Black Investors
        </h1>
        <p className="mb-7 text-lg text-gray-200">
          Building wealth is a journey—don’t walk it alone. The right tools and a strong community can help you make smarter decisions, stay motivated, and keep learning. Here you’ll find apps, resources, and networks made to empower Black investors at every stage.
        </p>

        {/* Investment Apps & Platforms */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Best Investment Apps & Platforms</h2>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>
              <span className="text-gold font-bold">Fidelity, Charles Schwab, Vanguard:</span> Full-featured, trusted brokerages with education and low fees.
            </li>
            <li>
              <span className="text-gold font-bold">Public, Robinhood, Stash, Acorns:</span> User-friendly, easy for beginners—start with small amounts.
            </li>
            <li>
              <span className="text-gold font-bold">Fundrise, Buy The Block, Seed At The Table:</span> Real estate/business crowdfunding with a community focus.
            </li>
          </ul>
        </section>

        {/* News, Education, Inspiration */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Financial News, Education, & Inspiration</h2>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>
              <b>Podcasts:</b>{" "}
              <a href="https://www.earnyourleisure.com/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Earn Your Leisure</a>,{" "}
              <a href="https://www.millionairemindsetspod.com/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Millionaire Mindsets</a>,{" "}
              <a href="https://www.instagram.com/thebudgetnista/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">The Budgetnista</a>
            </li>
            <li>
              <b>Websites:</b>{" "}
              <a href="https://www.investor.gov/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Investor.gov</a> (calculators & basics),{" "}
              <a href="https://www.blackwealthexchange.com/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Black Wealth Exchange</a> (directory, resources, community)
            </li>
            <li>
              <b>Social Media:</b> Follow #BlackInvestors, #BuyBlack, and influencers like{" "}
              <a href="https://www.instagram.com/myleik/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">@myleik</a>,{" "}
              <a href="https://www.instagram.com/jeweltankard/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">@jeweltankard</a>,{" "}
              <a href="https://www.instagram.com/earnyourleisure/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">@earnyourleisure</a>
            </li>
          </ul>
        </section>

        {/* Books */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Books Every Investor Should Read</h2>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li><span className="text-gold font-bold">The Wealth Choice</span> by Dr. Dennis Kimbro</li>
            <li><span className="text-gold font-bold">I Will Teach You to Be Rich</span> by Ramit Sethi</li>
            <li><span className="text-gold font-bold">Rich Dad Poor Dad</span> by Robert Kiyosaki</li>
            <li><span className="text-gold font-bold">Everyday Millionaires</span> by Chris Hogan</li>
          </ul>
        </section>

        {/* Community & Mentorship */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Community & Mentorship</h2>
          <p>Learning and building together is powerful. Connect with:</p>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>Online Black investor groups (Facebook, Reddit, LinkedIn)</li>
            <li>
              National Association of Black Accountants (
              <a href="https://www.nabainc.org/" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">NABA</a>
              ) for networking & mentorship
            </li>
            <li>Local investment clubs or Black business expos—search your city for events!</li>
          </ul>
        </section>

        {/* Tools & Calculators */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-2 text-blue-400">Practical Tools & Calculators</h2>
          <ul className="list-disc ml-6 my-2 text-gray-100">
            <li>
              <a href="https://www.investor.gov/financial-tools-calculators" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Investor.gov Calculators</a> – retirement, compounding, and more
            </li>
            <li>
              <a href="https://nerdwallet.com" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">Nerdwallet</a> – compare credit cards, investing, and loans
            </li>
            <li>Most brokerage apps have calculators for goals & asset allocation built in</li>
          </ul>
        </section>

        {/* Bonus Pro Tips */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-2 text-gold">💡 Bonus Pro Tips for Building Black Wealth</h2>
          <ul className="list-disc ml-6 text-gray-100 space-y-2">
            <li>
              <span className="text-gold font-bold">Build your “Circle of Wealth”:</span> Connect with Black investors, entrepreneurs, and mentors—share wins, lessons, and opportunities regularly.
            </li>
            <li>
              <span className="text-gold font-bold">Set reminders for growth:</span> Review your finances and goals every 3–6 months. Adjust and celebrate progress.
            </li>
            <li>
              <span className="text-gold font-bold">Support and amplify Black voices:</span> Follow, share, and review Black-owned brands and financial educators. Your network is your net worth!
            </li>
            <li>
              <span className="text-gold font-bold">Invest with intention:</span> Make sure your investments align with your values—build wealth and uplift your community.
            </li>
            <li>
              <span className="text-gold font-bold">Never stop learning:</span> Markets change and new opportunities appear every year. Each book, podcast, or connection brings new insights.
            </li>
            <li>
              <span className="text-gold font-bold">Teach the next generation:</span> Share what you learn with children, friends, and family. Wealth multiplies when shared!
            </li>
          </ul>
        </section>

        {/* Action Steps */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2 text-gold">Action Steps</h2>
          <ul className="list-disc ml-6 text-gray-200">
            <li>Pick one app, book, or podcast from this list to try this week.</li>
            <li>Follow two Black investor influencers or join a group to stay inspired.</li>
            <li>Bookmark a calculator/tool to use for your next financial move.</li>
          </ul>
        </section>

        {/* Key Takeaways */}
        <section className="mb-14">
          <h2 className="text-xl font-bold mb-2 text-blue-400">Key Takeaways</h2>
          <ul className="list-disc ml-6 text-gray-100">
            <li>You have powerful tools, apps, and networks—use them to build wealth!</li>
            <li>Learning from the Black investing community multiplies your impact.</li>
            <li>Your journey never stops. Stay connected and keep building!</li>
          </ul>
        </section>

        {/* Navigation */}
        <div className="flex justify-between mt-10">
          <Link href="/courses/investing-for-beginners/module-8">
            <span className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-800 text-white cursor-pointer shadow">
              ← Previous
            </span>
          </Link>
          <Link href="/courses/investing-for-beginners">
            <span className="px-4 py-2 rounded bg-gold hover:bg-yellow-400 text-black font-bold shadow transition">
              Course Home
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
