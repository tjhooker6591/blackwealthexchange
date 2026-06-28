import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";

type BusinessOption = {
  id: string;
  businessName: string;
  slug: string;
  category: string;
  city: string;
  state: string;
  address: string;
  website?: string | null;
  phone?: string | null;
  description: string;
};

type OptionsPayload = {
  ok: boolean;
  offer?: {
    name: string;
    amountCents: number;
    currency: string;
    billing: string;
    pilotLimit: number;
    activeCount: number;
    remainingSlots: number;
  };
  businesses?: BusinessOption[];
};

function money(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((cents || 0) / 100);
}

export default function FoundingMembershipPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<OptionsPayload | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/founding-membership/options", {
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "Unable to load membership offer");
        }
        setData(json);
        if (Array.isArray(json?.businesses) && json.businesses[0]?.id) {
          setSelectedBusinessId(json.businesses[0].id);
        }
      } catch (e: any) {
        setError(e?.message || "Unable to load membership offer");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedBusiness = useMemo(
    () =>
      (data?.businesses || []).find((business) => business.id === selectedBusinessId) ||
      null,
    [data, selectedBusinessId],
  );

  const offer = data?.offer;

  const beginCheckout = async () => {
    if (!selectedBusinessId) {
      setError("Select a public claimable business first.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "plan",
          itemId: "founding-verified-business-growth-membership",
          businessId: selectedBusinessId,
          metadata: {
            businessId: selectedBusinessId,
            checkoutContext: "founding_membership",
          },
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.url) {
        throw new Error(json?.error || "Unable to start checkout");
      }

      window.location.assign(json.url);
    } catch (e: any) {
      setError(e?.message || "Unable to start checkout");
      setSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Founding Verified Business Growth Membership | BWE</title>
        <meta
          name="description"
          content="Claim your existing public BWE business profile and start the Founding Verified Business Growth Membership pilot."
        />
      </Head>
      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-6xl space-y-6">
          <section className="rounded-3xl border border-yellow-500/20 bg-white/5 p-6 shadow-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-300/80">
                  First revenue engine
                </p>
                <h1 className="mt-2 text-3xl font-black text-yellow-300">
                  Founding Verified Business Growth Membership
                </h1>
                <p className="mt-3 max-w-3xl text-white/75">
                  Claim your existing public BWE business listing, start ownership review,
                  and activate the pilot membership for {money(4900)} monthly.
                </p>
              </div>
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                <div>Monthly only</div>
                <div>{offer ? `${offer.remainingSlots} of ${offer.pilotLimit} pilot positions available` : "10 pilot positions total"}</div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-bold text-white">1. Select your public business</h2>
              <p className="mt-2 text-sm text-white/70">
                This membership only applies to an existing public, claimable BWE business.
              </p>

              {loading ? <p className="mt-4 text-white/60">Loading businesses…</p> : null}
              {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}

              <div className="mt-4 grid gap-3">
                {(data?.businesses || []).map((business) => {
                  const active = business.id === selectedBusinessId;
                  return (
                    <button
                      key={business.id}
                      type="button"
                      onClick={() => setSelectedBusinessId(business.id)}
                      className={`rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-yellow-400/60 bg-yellow-500/10"
                          : "border-white/10 bg-black/20 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold text-white">{business.businessName}</div>
                          <div className="mt-1 text-sm text-white/60">
                            {[business.category, [business.city, business.state].filter(Boolean).join(", ")]
                              .filter(Boolean)
                              .join(" • ")}
                          </div>
                          {business.address ? (
                            <div className="mt-1 text-xs text-white/45">{business.address}</div>
                          ) : null}
                        </div>
                        {active ? (
                          <span className="rounded-full border border-yellow-400/40 bg-yellow-400/15 px-2 py-1 text-xs font-bold text-yellow-200">
                            Selected
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-bold text-white">2. Review the offer</h2>
                <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-black/20 p-4">
                  <div className="text-3xl font-black text-yellow-300">{offer ? money(offer.amountCents) : "$49.00"}</div>
                  <div className="text-sm text-white/65">per month, monthly only</div>
                </div>
                <div className="mt-4 grid gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-white">This membership includes</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
                      <li>Business claim and ownership-review processing</li>
                      <li>Professional review of the existing BWE profile</li>
                      <li>Profile-enhancement setup using verified business information</li>
                      <li>Initial profile-performance baseline</li>
                      <li>Recurring monthly activity report</li>
                      <li>Access to the BWE member-support process</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-white">This membership does not guarantee</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-white/65">
                      <li>Leads, sales, revenue growth, or visibility outcomes</li>
                      <li>Grants, loans, investment, contracts, or introductions</li>
                      <li>Sponsorship selection or owner verification approval</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-bold text-white">3. Start claim + membership</h2>
                {selectedBusiness ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75">
                    <div className="font-semibold text-white">Selected business</div>
                    <div className="mt-1">{selectedBusiness.businessName}</div>
                    <div className="mt-1 text-white/55">
                      {[selectedBusiness.category, [selectedBusiness.city, selectedBusiness.state].filter(Boolean).join(", ")]
                        .filter(Boolean)
                        .join(" • ")}
                    </div>
                    <div className="mt-3 text-white/70">
                      Payment activates the membership and opens ownership review, but does not auto-verify ownership.
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={submitting || !selectedBusinessId || (offer?.remainingSlots || 0) <= 0}
                  onClick={beginCheckout}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-yellow-500 px-4 py-3 font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Redirecting to secure checkout…" : "Continue to secure $49 monthly checkout"}
                </button>

                <div className="mt-3 text-xs text-white/50">
                  Need a different path? <Link href="/business-directory" className="text-yellow-300 underline">Return to the business directory</Link>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
