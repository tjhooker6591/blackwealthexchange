// src/pages/preview/[token].tsx
//
// Public (no-auth) private preview page. Token-gated, expiring, revocable.
// Shows the current live listing alongside the proposed profile, with
// proposed text and missing facts clearly marked -- never presented as
// already live. This page never writes anything; it can only read via
// /api/preview/[token].

import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

export default function PreviewPage() {
  const router = useRouter();
  const { token } = router.query;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [interestedState, setInterestedState] = useState<
    "idle" | "sending" | "sent" | "failed"
  >("idle");

  async function markInterested() {
    if (typeof token !== "string") return;
    setInterestedState("sending");
    try {
      const res = await fetch(`/api/preview/${token}/interested`, {
        method: "POST",
      });
      const json = await res.json();
      setInterestedState(res.ok && json.ok ? "sent" : "failed");
    } catch {
      setInterestedState("failed");
    }
  }

  useEffect(() => {
    if (!router.isReady || typeof token !== "string") return;
    (async () => {
      try {
        const res = await fetch(`/api/preview/${token}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setError(
            json.code === "EXPIRED"
              ? "This preview link has expired."
              : json.code === "REVOKED"
                ? "This preview link has been revoked."
                : "This preview link is not valid.",
          );
          return;
        }
        setData(json);
      } catch {
        setError("We couldn't load this preview right now.");
      }
    })();
  }, [router.isReady, token]);

  return (
    <>
      <Head>
        <title>BWE Business Preview</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div className="min-h-screen bg-black text-white px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-yellow-400">
              Private preview
            </p>
            <h1 className="text-2xl font-bold">
              {data?.current?.name || "BWE Business Preview"}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              This is a private draft, not your live listing. Nothing here is
              public until you confirm it and BWE publishes it.
            </p>
          </div>

          {error ? (
            <div className="rounded border border-red-900 bg-red-950/40 p-4 text-sm text-red-300">
              {error}
            </div>
          ) : !data ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="font-semibold text-yellow-300 mb-2">
                  Proposed profile
                </h2>
                <dl className="space-y-2 text-sm">
                  {data.preview.proposedFields.map((f: any) => (
                    <div
                      key={f.field}
                      className="flex flex-col sm:flex-row sm:gap-2"
                    >
                      <dt className="text-zinc-500 sm:w-40 shrink-0">
                        {f.field}
                      </dt>
                      <dd className="text-zinc-100">
                        {f.value}
                        {f.isProposed ? (
                          <span className="ml-2 rounded bg-yellow-500/20 text-yellow-300 text-[10px] px-1.5 py-0.5 align-middle">
                            proposed
                          </span>
                        ) : null}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>

              {data.preview.missingFacts.length ? (
                <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                  <h2 className="font-semibold text-yellow-300 mb-2">
                    Missing facts
                  </h2>
                  <ul className="list-disc list-inside text-sm text-zinc-400">
                    {data.preview.missingFacts.map((m: string) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {data.current?.routeId ? (
                <p className="text-sm text-zinc-500">
                  Current live listing:{" "}
                  <Link
                    href={`/business/${data.current.routeId}`}
                    className="text-yellow-300 hover:underline"
                  >
                    view it here
                  </Link>
                </p>
              ) : null}

              <div className="rounded border border-yellow-900/40 bg-yellow-500/5 p-4">
                {interestedState === "sent" ? (
                  <p className="text-sm text-yellow-300">
                    Thanks -- we&apos;ll be in touch shortly.
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-zinc-300 mb-3">
                      Want to talk about getting{" "}
                      {data?.current?.name || "your business"} listed?
                    </p>
                    <button
                      onClick={markInterested}
                      disabled={interestedState === "sending"}
                      className="rounded bg-yellow-500 text-black text-sm font-semibold px-4 py-2 disabled:opacity-60"
                    >
                      {interestedState === "sending"
                        ? "Sending..."
                        : "I'm interested -- let's talk"}
                    </button>
                    {interestedState === "failed" ? (
                      <p className="text-xs text-red-400 mt-2">
                        Something went wrong. Please try again.
                      </p>
                    ) : null}
                  </>
                )}
              </div>

              <p className="text-xs text-zinc-600">
                This preview expires{" "}
                {new Date(data.preview.expiresAt).toLocaleDateString()}. Nothing
                on this page publishes automatically -- publishing requires your
                explicit confirmation.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
