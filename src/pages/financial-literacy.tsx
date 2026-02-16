import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/legacy/image";
import BuyNowButton from "@/components/BuyNowButton";

type MeUser = {
  _id?: string;
  id?: string;
  email?: string;
  accountType?: string;
};

const PRICE_CENTS = 4900; // $49.00
const ITEM_ID = "financial-literacy-premium";

const FinancialLiteracy = () => {
  const [user, setUser] = useState<MeUser | null>(null);
  const [meChecked, setMeChecked] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          setMeChecked(true);
          return;
        }
        const data = await res.json().catch(() => null);
        setUser(data?.user || null);
      } catch {
        // ignore
      } finally {
        setMeChecked(true);
      }
    })();
  }, []);

  const userId = useMemo(() => user?._id || user?.id || "", [user]);

  const modules = useMemo(
    () => [
      {
        title: "1. Breaking Financial Myths",
        text: "Unlearn the lies we’ve been taught about money. Build a mindset designed for legacy, not survival.",
        bullets: [
          "Your money story + breaking scarcity patterns",
          "The real math behind “getting ahead”",
          "How wealth is actually built: time, systems, and ownership",
        ],
      },
      {
        title: "2. Budgeting for Real Life",
        text: "A simple budgeting system you can actually stick to—even with unpredictable income.",
        bullets: [
          "Zero-based vs. priority budgeting (what works best for you)",
          "Emergency fund plan (fast + realistic)",
          "Spending categories that protect your future",
        ],
      },
      {
        title: "3. Credit Repair & Power",
        text: "Improve your score with a step-by-step system plus templates and dispute strategies.",
        bullets: [
          "What impacts your score (and what doesn’t)",
          "Dispute letters + tracking process",
          "Building positive credit without new debt traps",
        ],
      },
      {
        title: "4. Building Wealth with Investments",
        text: "Learn the basics of stocks, index funds, real estate, and passive income—starting small.",
        bullets: [
          "Investing terms in plain English",
          "How to avoid common mistakes and scams",
          "Creating an investing plan that matches your risk level",
        ],
      },
      {
        title: "5. Side Hustles & Business Basics",
        text: "Turn skills into income. Build a simple business foundation and scale step-by-step.",
        bullets: [
          "Choosing a profitable offer (without guessing)",
          "Pricing + packaging your services/products",
          "Basic business setup checklist (clean + legit)",
        ],
      },
      {
        title: "6. Debt Management & Elimination",
        text: "Eliminate debt using proven strategies while still building savings and credit.",
        bullets: [
          "Snowball vs. avalanche methods",
          "Negotiating interest + payment plans",
          "Avoiding re-debt cycles (the trap most people miss)",
        ],
      },
      {
        title: "7. Retirement Planning",
        text: "Build retirement security whether you’re early, late, or restarting—without stress.",
        bullets: [
          "401(k), IRA, Roth IRA—what they are and when to use them",
          "Catch-up strategies if you’re behind",
          "Long-term plan that doesn’t require perfection",
        ],
      },
      {
        title: "8. Building Legacy & Asset Protection",
        text: "Learn the basics of wills, trusts, beneficiaries, and protecting assets for your family.",
        bullets: [
          "Wills vs. trusts (and when each makes sense)",
          "Beneficiaries and avoiding probate mistakes",
          "Legacy planning checklist for families",
        ],
      },
    ],
    [],
  );

  const bonuses = useMemo(
    () => [
      {
        title: "Downloadable Worksheets + Checklists",
        text: "Budget templates, goal trackers, debt payoff planners, and spending tools.",
      },
      {
        title: "Credit Repair Letter Pack",
        text: "Dispute templates + tracking sheet to keep the process organized.",
      },
      {
        title: "Investment Starter Guide",
        text: "Plain-English guide to getting started with a safe foundation.",
      },
      {
        title: "Optional Certificate of Completion",
        text: "Earn a completion certificate after finishing the course.",
      },
    ],
    [],
  );

  const faqs = useMemo(
    () => [
      {
        q: "Is this course beginner-friendly?",
        a: "Yes. It’s built for people starting from scratch and for those who need a clean system to get organized and level up.",
      },
      {
        q: "Do I need a lot of money to get value from this?",
        a: "No. The course is designed to help you build stability first—then growth—using real tools and realistic steps.",
      },
      {
        q: "Is this a monthly subscription?",
        a: "No. It’s a one-time payment for lifetime access (including updates).",
      },
      {
        q: "How do I access the course after purchase?",
        a: "After checkout, your account will be granted access and you’ll be able to view the modules from your dashboard/course area.",
      },
      {
        q: "Can I buy it without creating an account?",
        a: "You can browse the page without an account, but we recommend creating a free account so your access can be linked to you automatically.",
      },
    ],
    [],
  );

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Background Effects */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35 z-0"
        style={{ backgroundImage: "url('/black-wealth-bg.jpg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-60 z-0" />

      {/* subtle glow */}
      <div className="pointer-events-none absolute inset-0 z-0 opacity-40">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl bg-yellow-500/20" />
        <div className="absolute top-24 right-[-120px] h-[420px] w-[420px] rounded-full blur-3xl bg-yellow-400/10" />
      </div>

      {/* Hero */}
      <header className="text-center pt-24 pb-14 relative z-10 px-6">
        <div className="mx-auto max-w-5xl">
          <Image
            src="/favicon.png"
            alt="BWE Logo"
            width={110}
            height={110}
            className="mx-auto mb-5"
          />
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-wide text-gold neon-text">
            Premium Financial Literacy Course
          </h1>
          <p className="text-lg md:text-2xl mt-4 font-light text-gray-200 max-w-3xl mx-auto">
            Lifetime access to the tools, knowledge, and confidence to build real Black wealth.
            Pay once. Own it forever.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-300">
            <Badge>✅ Lifetime access</Badge>
            <Badge>✅ Templates & worksheets</Badge>
            <Badge>✅ Beginner-friendly</Badge>
            <Badge>✅ Built for real life</Badge>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#pricing">
              <button className="px-7 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-yellow-500 transition">
                Get Lifetime Access
              </button>
            </a>
            <a href="#modules">
              <button className="px-7 py-3 border border-gold text-gold font-semibold rounded-lg hover:bg-gold hover:text-black transition">
                View Modules
              </button>
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-6 pb-20 relative z-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-8 space-y-10">
            {/* Offer */}
            <section id="pricing" className="bg-gray-900/80 border border-gold/20 p-8 rounded-2xl shadow-xl">
              <h2 className="text-3xl font-semibold text-gold mb-3">
                Unlock the Full Premium Course — $49 (One Time)
              </h2>
              <p className="text-gray-200 text-lg mb-6 max-w-3xl">
                Learn how to budget, fix credit, invest, and build legacy wealth with step-by-step guidance.
                This is more than education — it’s transformation.
              </p>

              <div className="grid md:grid-cols-2 gap-8 text-left text-gray-200">
                <div>
                  <h3 className="text-xl text-gold font-semibold mb-2">✅ What You’ll Learn</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-300">
                    <li>Budgeting and goal-setting on any income</li>
                    <li>How to build and repair your credit</li>
                    <li>Investing basics: stocks, real estate, and passive income</li>
                    <li>Debt elimination strategies that actually work</li>
                    <li>How to protect assets and build generational wealth</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl text-gold font-semibold mb-2">✅ What’s Included</h3>
                  <ul className="list-disc pl-6 space-y-1 text-gray-300">
                    <li>8 full modules + bonus content</li>
                    <li>Downloadable worksheets, templates, and credit letters</li>
                    <li>Lifetime access with free updates</li>
                    <li>Optional certificate of completion</li>
                  </ul>
                </div>
              </div>

              <div className="mt-7 rounded-xl bg-black/40 border border-gray-800 p-5">
                <p className="text-gray-300 text-sm">
                  <span className="text-gold font-semibold">No subscription.</span> One-time payment.
                  Your access stays active forever.
                </p>
              </div>
            </section>

            {/* Modules */}
            <section id="modules" className="space-y-5">
              <h2 className="text-3xl font-bold text-gold text-center">
                Course Modules
              </h2>

              <div className="grid md:grid-cols-2 gap-6">
                {modules.map((mod, i) => (
                  <div key={i} className="bg-gray-900/70 border border-gray-800 p-6 rounded-2xl shadow-lg">
                    <h4 className="text-xl font-semibold text-gold mb-2">{mod.title}</h4>
                    <p className="text-gray-300">{mod.text}</p>
                    <ul className="mt-3 space-y-1 text-sm text-gray-300 list-disc pl-6">
                      {mod.bullets.map((b, idx) => (
                        <li key={idx}>{b}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            {/* Bonuses */}
            <section className="bg-gray-900/70 border border-gray-800 p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold text-gold mb-4">Bonus Resources</h2>
              <div className="grid md:grid-cols-2 gap-5">
                {bonuses.map((b, i) => (
                  <div key={i} className="rounded-xl border border-gray-800 bg-black/30 p-5">
                    <h3 className="font-semibold text-gold">{b.title}</h3>
                    <p className="text-gray-300 mt-2 text-sm">{b.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Who this is for */}
            <section className="bg-gray-900/70 border border-gray-800 p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold text-gold mb-3">Who This Is For</h2>
              <div className="grid md:grid-cols-2 gap-4 text-gray-300">
                <CardLine>People who want a clear, simple money system</CardLine>
                <CardLine>Anyone rebuilding credit or learning investing basics</CardLine>
                <CardLine>Families building a legacy and protecting assets</CardLine>
                <CardLine>Entrepreneurs who need financial fundamentals</CardLine>
              </div>

              <div className="mt-5 text-sm text-gray-400">
                Not financial advice — educational content built to improve your decision-making and confidence.
              </div>
            </section>

            {/* FAQs */}
            <section className="bg-gray-900/70 border border-gray-800 p-8 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-bold text-gold mb-4">FAQ</h2>
              <div className="space-y-4">
                {faqs.map((f, i) => (
                  <div key={i} className="rounded-xl border border-gray-800 bg-black/30 p-5">
                    <p className="font-semibold text-gray-200">{f.q}</p>
                    <p className="text-gray-300 mt-2 text-sm">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Back */}
            <section className="text-center mt-10">
              <Link href="/">
                <button className="px-6 py-3 bg-gold text-black font-semibold text-lg rounded-lg hover:bg-yellow-500 transition">
                  Back to Home
                </button>
              </Link>
            </section>
          </div>

          {/* Right Column: Sticky checkout */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-6 space-y-4">
              <div className="bg-gray-900/80 border border-gold/20 rounded-2xl shadow-xl p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-300">Premium Course Access</p>
                    <h3 className="text-2xl font-bold text-gold">$49</h3>
                    <p className="text-xs text-gray-400 mt-1">One-time payment • Lifetime access</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-gold/15 text-gold border border-gold/20">
                    Best Value
                  </span>
                </div>

                <div className="mt-5 space-y-2 text-sm text-gray-300">
                  <CheckLine>8 modules + free updates</CheckLine>
                  <CheckLine>Worksheets + templates</CheckLine>
                  <CheckLine>Credit letters pack</CheckLine>
                  <CheckLine>Optional completion certificate</CheckLine>
                </div>

                <div className="mt-6">
                  {meChecked && !userId ? (
                    <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
                      <p className="text-sm text-gray-300">
                        Create a free account to link your purchase to your profile.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Link href="/signup">
                          <button className="px-4 py-2 rounded bg-gold text-black font-semibold hover:bg-yellow-500 transition">
                            Sign Up
                          </button>
                        </Link>
                        <Link href="/login">
                          <button className="px-4 py-2 rounded border border-gold text-gold hover:bg-gold hover:text-black transition">
                            Login
                          </button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <BuyNowButton
                      userId={userId || "guest"}
                      itemId={ITEM_ID}
                      amount={PRICE_CENTS}
                      type="course"
                      label="Get Lifetime Access"
                    />
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    Secure checkout • Instant access after purchase
                  </p>
                </div>
              </div>

              <div className="bg-gray-900/70 border border-gray-800 rounded-2xl p-5">
                <p className="text-sm text-gray-300">
                  <span className="text-gold font-semibold">Built for our community.</span>{" "}
                  Clear steps, practical tools, and a system you can repeat for life.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-gray-800 bg-black/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <p className="text-sm text-gray-300">
            Premium Financial Literacy Course — <span className="text-gold font-semibold">$49</span> one-time
          </p>
          <a href="#pricing">
            <button className="px-5 py-2 rounded bg-gold text-black font-semibold hover:bg-yellow-500 transition">
              Enroll Now
            </button>
          </a>
        </div>
      </div>
    </div>
  );
};

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1 rounded-full bg-gray-900/70 border border-gray-800 text-gray-200">
      {children}
    </span>
  );
}

function CheckLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-gold">✓</span>
      <span>{children}</span>
    </div>
  );
}

function CardLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-black/30 p-4">
      <p className="text-gray-200">{children}</p>
    </div>
  );
}

export default FinancialLiteracy;
