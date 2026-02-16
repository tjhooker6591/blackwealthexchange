// src/pages/intern/welcome.tsx
"use client";

import React from "react";
import Link from "next/link";
import {
  CheckCircle,
  CalendarDays,
  Shield,
  Laptop,
  Users,
  FileText,
} from "lucide-react";

export default function InternWelcomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="mx-auto max-w-6xl px-6 md:px-10 py-10">
        <div className="rounded-2xl border border-yellow-400/30 bg-gradient-to-b from-black via-black to-yellow-400/5 p-8 shadow-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-yellow-300">
                Welcome to Black Wealth Exchange 🎉
              </h1>
              <p className="mt-2 text-white/70 max-w-2xl">
                You’re officially part of the mission. This page is your home
                base for onboarding, expectations, tools, and your first-week
                checklist.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/intern-applications"
                className="rounded-xl border border-yellow-400/40 bg-yellow-400 text-black px-5 py-2.5 font-semibold hover:bg-yellow-300 transition"
              >
                View Applications
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-yellow-400/30 bg-black px-5 py-2.5 font-semibold text-yellow-200 hover:bg-yellow-400/10 transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>

          {/* Quick badges */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Badge
              icon={<Users className="h-5 w-5" />}
              title="Mission-first"
              desc="Build tools that create economic opportunity."
            />
            <Badge
              icon={<Laptop className="h-5 w-5" />}
              title="Remote-ready"
              desc="Clear updates, solid documentation, strong ownership."
            />
            <Badge
              icon={<Shield className="h-5 w-5" />}
              title="Security-aware"
              desc="Protect user data and platform integrity always."
            />
          </div>
        </div>

        {/* 2-column layout */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Getting started */}
          <div className="lg:col-span-2 space-y-6">
            <Card
              title="Your First 24 Hours"
              icon={<CheckCircle className="h-5 w-5 text-yellow-300" />}
            >
              <Checklist
                items={[
                  "Read the mission + platform overview (below).",
                  "Confirm your role + focus area with the lead.",
                  "Set up your dev environment and run the app locally.",
                  "Join the communication channel(s) for daily updates.",
                  "Submit your first ‘End of Day’ update (template below).",
                ]}
              />
            </Card>

            <Card
              title="Week 1 Goals"
              icon={<CalendarDays className="h-5 w-5 text-yellow-300" />}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Goal
                  title="Day 1–2"
                  points={[
                    "Environment set up (build succeeds).",
                    "Understand the site sections + admin flow.",
                    "Pick one small starter ticket.",
                  ]}
                />
                <Goal
                  title="Day 3–5"
                  points={[
                    "Ship 1–2 meaningful improvements.",
                    "Write clean notes + PR summary.",
                    "Demo progress in a short walkthrough.",
                  ]}
                />
              </div>
            </Card>

            <Card
              title="Platform Overview"
              icon={<FileText className="h-5 w-5 text-yellow-300" />}
            >
              <p className="text-white/75 leading-relaxed">
                Black Wealth Exchange is building a modern platform that
                connects Black-owned businesses, jobs, marketplace products,
                education, and investment opportunities — all with a clean,
                high-trust user experience. Your work helps increase visibility,
                access, and economic power.
              </p>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <MiniCard title="What good looks like">
                  <ul className="list-disc pl-5 text-white/70 space-y-1">
                    <li>Simple UI, fast load, no clutter.</li>
                    <li>Role-based access that feels smooth.</li>
                    <li>Clear data + reliable admin tools.</li>
                  </ul>
                </MiniCard>

                <MiniCard title="How we ship">
                  <ul className="list-disc pl-5 text-white/70 space-y-1">
                    <li>Small changes, frequent commits.</li>
                    <li>Readable code + reusable components.</li>
                    <li>Security + validation everywhere.</li>
                  </ul>
                </MiniCard>
              </div>
            </Card>

            <Card
              title="End-of-Day Update Template"
              icon={<FileText className="h-5 w-5 text-yellow-300" />}
            >
              <div className="rounded-xl border border-yellow-400/20 bg-black p-4 text-sm text-white/80">
                <p className="text-yellow-200 font-semibold mb-2">
                  Copy/paste this:
                </p>
                <pre className="whitespace-pre-wrap text-white/80">
                  {`EOD Update — (Your Name)
- What I worked on:
- What I completed:
- What I am blocked on (if any):
- Next steps for tomorrow:
- Links (PRs / screenshots / notes):`}
                </pre>
              </div>
            </Card>
          </div>

          {/* Right: Quick links + expectations */}
          <div className="space-y-6">
            <Card
              title="Quick Links"
              icon={<FileText className="h-5 w-5 text-yellow-300" />}
            >
              <div className="flex flex-col gap-3">
                <QuickLink href="/admin/dashboard" label="Admin Dashboard" />
                <QuickLink
                  href="/admin/intern-applications"
                  label="Intern Applications"
                />
                <QuickLink href="/marketplace" label="Marketplace" />
                <QuickLink
                  href="/business-directory"
                  label="Business Directory"
                />
                <QuickLink href="/intern/tasks" label="Intern Tasks" />
              </div>
            </Card>

            <Card
              title="Expectations"
              icon={<CheckCircle className="h-5 w-5 text-yellow-300" />}
            >
              <ul className="space-y-2 text-white/75">
                <li>✅ Communicate clearly and early.</li>
                <li>✅ Keep code clean and documented.</li>
                <li>✅ Ask questions, then take ownership.</li>
                <li>✅ Protect user data at all times.</li>
              </ul>
            </Card>

            <Card
              title="Support"
              icon={<Users className="h-5 w-5 text-yellow-300" />}
            >
              <p className="text-white/75">
                If you hit a blocker, capture:
                <span className="text-yellow-200 font-semibold">
                  {" "}
                  what you tried
                </span>
                , the
                <span className="text-yellow-200 font-semibold">
                  {" "}
                  exact error
                </span>
                , and a
                <span className="text-yellow-200 font-semibold">
                  {" "}
                  screenshot/log snippet
                </span>
                .
              </p>
            </Card>
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-12 pb-10 text-center text-white/50 text-sm">
          © {new Date().getFullYear()} Black Wealth Exchange — Intern Onboarding
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-yellow-400/20 bg-black/60 backdrop-blur p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-xl font-bold text-yellow-200">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Badge({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-yellow-400/20 bg-black/60 p-4">
      <div className="flex items-center gap-2 text-yellow-200 font-semibold">
        {icon}
        <span>{title}</span>
      </div>
      <p className="mt-2 text-white/70 text-sm">{desc}</p>
    </div>
  );
}

function Checklist({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-2 text-white/75">
          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-yellow-300/80" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

function Goal({ title, points }: { title: string; points: string[] }) {
  return (
    <div className="rounded-2xl border border-yellow-400/15 bg-black p-4">
      <h3 className="text-yellow-200 font-semibold">{title}</h3>
      <ul className="mt-2 list-disc pl-5 text-white/70 space-y-1">
        {points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
}

function MiniCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-yellow-400/15 bg-black p-4">
      <h3 className="text-yellow-200 font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-yellow-400/25 bg-black px-4 py-3 text-yellow-200 font-semibold hover:bg-yellow-400/10 hover:border-yellow-400/40 transition"
    >
      {label}
    </Link>
  );
}
