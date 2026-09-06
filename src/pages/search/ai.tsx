// src/pages/search/ai.tsx
//
// Phase 7 -- BWE AI Mode. Was previously an orphaned page (nothing linked
// to it) that faked "AI Summary" copy on top of a plain directory search
// and never actually called any AI system. Rebuilt as the real BWE AI
// Mode: every query is parsed (src/lib/ai/intent.ts), grounded in real
// BWE data (src/lib/ai/grounding.ts), and answered
// (src/lib/ai/answer.ts) via /api/v1/ai/mode.ts. Results are always real
// BWE records linking to their real pages -- nothing here is invented.

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Head from "next/head";
import UseMyLocationButton from "@/components/location/UseMyLocationButton";

type SearchResult = {
  domain: string;
  id: string;
  title: string;
  description: string;
  url: string;
  location?: string | null;
  price?: number | null;
  deadline?: string | null;
};

type EconomicMetric = {
  key: string;
  label: string;
  status: "measured" | "attributed" | "estimated" | "insufficient_data";
  value: number | null;
  unit: "usd_cents" | "count" | "ratio";
};

type Capability = {
  id: string;
  label: string;
  description: string;
  href: string;
};

type Grounded =
  | { kind: "search"; results: SearchResult[] }
  | { kind: "economic"; metrics: EconomicMetric[] }
  | { kind: "capability"; capabilities: Capability[] }
  | {
      kind: "saved";
      businesses: Array<{
        businessId: string;
        displayName: string;
        href: string | null;
      }>;
      requiresAuth: boolean;
    };

type AiModeResponse = {
  intent: { domain: string; keyword: string; location: string | null };
  grounded: Grounded;
  answer: string;
  answerSource: "ai" | "structured";
  aiConfigured: boolean;
};

const EXAMPLE_QUERIES = [
  "Find Black-owned restaurants near Atlanta",
  "Show products under $50",
  "What jobs match technology leadership?",
  "Show scholarships closing soon",
  "How much verified economic activity has BWE measured?",
];

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function AiModePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [response, setResponse] = useState<AiModeResponse | null>(null);

  const runQuery = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/v1/ai/mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(
          data?.error?.message || "AI Mode could not process this query.",
        );
      }
      setResponse(data.data);
    } catch (e: any) {
      setError(e?.message || "AI Mode could not process this query.");
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = typeof router.query.q === "string" ? router.query.q : "";
    if (q) {
      setQuery(q);
      runQuery(q);
    }
  }, [router.query.q]);

  return (
    <>
      <Head>
        <title>AI Mode | Black Wealth Exchange</title>
        <meta
          name="description"
          content="Ask BWE AI Mode to find real businesses, products, jobs, scholarships, and measured economic impact."
        />
      </Head>
      <div className="min-h-screen bg-neutral-950 text-white px-4 py-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-3xl font-extrabold tracking-tight">
              BWE <span className="text-[#D4AF37]">AI Mode</span>
            </h1>
            <Link
              href="/"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold hover:bg-white/10 transition"
            >
              Back Home
            </Link>
          </div>
          <p className="mt-2 text-white/65 text-sm">
            Ask in plain English. Every answer is grounded in real BWE data --
            nothing is invented.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              runQuery(query);
            }}
            className="mt-6 flex gap-2"
          >
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find Black-owned restaurants near Atlanta"
              className="bwe-input flex-1"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="rounded-xl bg-[#D4AF37] px-5 py-2.5 text-sm font-extrabold text-black hover:bg-yellow-500 transition disabled:opacity-50"
            >
              {loading ? "Asking…" : "Ask"}
            </button>
          </form>

          <div className="mt-3 flex items-center gap-2">
            <UseMyLocationButton
              label="📍 Add my location"
              onResolved={({ city }) => {
                if (!city) return;
                setQuery((prev) =>
                  prev.trim()
                    ? `${prev.trim()} near ${city}`
                    : `businesses near ${city}`,
                );
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => {
                  setQuery(example);
                  runQuery(example);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 hover:bg-white/10"
              >
                {example}
              </button>
            ))}
          </div>

          {error ? (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {response ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold uppercase tracking-wide text-[#D4AF37]">
                    Answer
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-white/50">
                    {response.answerSource === "ai"
                      ? "AI-written, grounded"
                      : "Structured -- no AI provider configured"}
                  </span>
                </div>
                <p className="mt-2 text-white/90">{response.answer}</p>
              </div>

              {response.grounded.kind === "search" &&
              response.grounded.results.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {response.grounded.results.map((r) => (
                    <Link
                      key={`${r.domain}-${r.id}`}
                      href={r.url}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition"
                    >
                      <div className="text-xs uppercase tracking-wide text-white/40">
                        {r.domain}
                      </div>
                      <div className="mt-1 font-bold text-white">{r.title}</div>
                      {r.location ? (
                        <div className="mt-1 text-xs text-white/55">
                          {r.location}
                        </div>
                      ) : null}
                      {typeof r.price === "number" ? (
                        <div className="mt-1 text-sm text-white/70">
                          ${r.price.toFixed(2)}
                        </div>
                      ) : null}
                      {r.deadline ? (
                        <div className="mt-1 text-xs text-white/50">
                          Deadline: {new Date(r.deadline).toLocaleDateString()}
                        </div>
                      ) : null}
                      <p className="mt-2 text-sm text-white/65 line-clamp-3">
                        {r.description}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : null}

              {response.grounded.kind === "economic" ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {response.grounded.metrics
                    .filter((m) => m.status !== "insufficient_data")
                    .map((m) => (
                      <div
                        key={m.key}
                        className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="text-xl font-extrabold text-white">
                          {m.unit === "usd_cents" && m.value !== null
                            ? formatCents(m.value)
                            : m.value}
                        </div>
                        <div className="mt-1 text-xs text-white/55">
                          {m.label}
                        </div>
                      </div>
                    ))}
                </div>
              ) : null}

              {response.grounded.kind === "capability" ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {response.grounded.capabilities.map((c) => (
                    <Link
                      key={c.id}
                      href={c.href}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition"
                    >
                      <div className="font-bold text-white">{c.label}</div>
                      <p className="mt-1 text-sm text-white/65">
                        {c.description}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : null}

              {response.grounded.kind === "saved" &&
              response.grounded.requiresAuth ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/70">
                  <Link
                    href="/login?next=/search/ai"
                    className="text-[#D4AF37] underline"
                  >
                    Log in
                  </Link>{" "}
                  to ask about your saved and followed businesses.
                </div>
              ) : null}
              {response.grounded.kind === "saved" &&
              !response.grounded.requiresAuth ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {response.grounded.businesses.map((b) => (
                    <Link
                      key={b.businessId}
                      href={b.href || "/business-directory"}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/[0.06] transition"
                    >
                      <div className="font-bold text-white">
                        {b.displayName}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="mt-10 text-xs text-white/40">
            BWE AI Mode only answers from real BWE data -- businesses, products,
            jobs, student opportunities, and measured economic activity. It
            never invents a listing or a number.
          </div>
        </div>
      </div>
    </>
  );
}
