import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

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
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<OptionsPayload | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [confirmedBusinessId, setConfirmedBusinessId] = useState("");

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
      } catch (e: any) {
        setError(e?.message || "Unable to load membership offer");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!router.isReady || !data?.businesses?.length) return;

    const requestedBusinessId =
      typeof router.query.businessId === "string" ? router.query.businessId.trim() : "";

    if (requestedBusinessId) {
      const found = data.businesses.find((business) => business.id === requestedBusinessId);
      if (found) {
        setSelectedBusinessId((current) => current || found.id);
        setConfirmedBusinessId((current) => current || found.id);
        return;
      }
    }

    if (!selectedBusinessId) {
      setSelectedBusinessId(data.businesses[0]?.id || "");
    }
  }, [router.isReady, router.query.businessId, data, selectedBusinessId]);

  const selectedBusiness = useMemo(
    () =>
      (data?.businesses || []).find((business) => business.id === selectedBusinessId) ||
      null,
    [data, selectedBusinessId],
  );

  const confirmedBusiness = useMemo(
    () =>
      (data?.businesses || []).find((business) => business.id === confirmedBusinessId) ||
      null,
    [data, confirmedBusinessId],
  );

  const offer = data?.offer;

  const confirmBusinessSelection = () => {
    if (!selectedBusinessId) {
      setError("Select a public claimable business first.");
      return;
    }

    setConfirmedBusinessId(selectedBusinessId);
    setError("");

    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        `/founding-membership?businessId=${encodeURIComponent(selectedBusinessId)}`,
      );
      const reviewSection = document.getElementById("membership-review");
      reviewSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const beginCheckout = async () => {
    if (!confirmedBusinessId) {
      setError("Confirm the selected business before starting membership.");
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
          businessId: confirmedBusinessId,
          metadata: {
            businessId: confirmedBusinessId,
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
                  Founding pilot offer
                </p>
                <h1 className="mt-2 text-3xl font-black text-yellow-300">
                  Founding Verified Business Growth Membership
                </h1>
                <p className="mt-3 max-w-3xl text-white/75">
                  Claim your Black-owned business. Strengthen your profile. Measure your visibility and growth. This pilot starts with one offer, one price, and one customer path for existing public BWE business listings.
                </p>
              </div>
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                <div>{offer ? money(offer.amountCents) : "$49.00"} per month</div>
                <div>Monthly billing only</div>
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
                      onClick={() => {
                        setSelectedBusinessId(business.id);
                        setError("");
                      }}
                      className={`rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-2 focus:ring-yellow-400/40 ${
                        active
                          ? "border-yellow-400/60 bg-yellow-500/10"
                          : "border-white/10 bg-black/20 hover:bg-white/10"
                      }`}
                      aria-pressed={active}
                      aria-describedby={active ? `selected-business-${business.id}` : undefined}
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
                          <span
                            id={`selected-business-${business.id}`}
                            className="rounded-full border border-yellow-400/40 bg-yellow-400/15 px-2 py-1 text-xs font-bold text-yellow-200"
                          >
                            Selected
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                <div className="text-xs font-bold uppercase tracking-[0.12em] text-yellow-200/80">
                  Selected business confirmation
                </div>
                {selectedBusiness ? (
                  <div className="mt-2 space-y-2 text-sm text-white/80">
                    <div className="font-semibold text-white">{selectedBusiness.businessName}</div>
                    <div>
                      {[selectedBusiness.category, [selectedBusiness.city, selectedBusiness.state].filter(Boolean).join(", ")]
                        .filter(Boolean)
                        .join(" • ") || "Business details recorded"}
                    </div>
                    <div className="text-white/55">
                      {confirmedBusinessId === selectedBusiness.id
                        ? "This business is confirmed for the next step."
                        : "Confirm this business to continue into membership review."}
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-sm text-white/65">Choose one public business to continue.</div>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={confirmBusinessSelection}
                    disabled={!selectedBusinessId}
                    className="inline-flex items-center justify-center rounded-xl bg-yellow-500 px-4 py-3 font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Continue With This Business
                  </button>
                  {confirmedBusiness && confirmedBusinessId !== selectedBusinessId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmedBusinessId("");
                        setError("");
                      }}
                      className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 font-bold text-white/85 transition hover:bg-white/10"
                    >
                      Change Confirmed Business
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <section id="membership-review" className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-bold text-white">2. Confirm business and membership</h2>
                <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-black/20 p-4">
                  <div className="text-3xl font-black text-yellow-300">{offer ? money(offer.amountCents) : "$49.00"}</div>
                  <div className="text-sm text-white/65">per month, monthly billing only</div>
                </div>
                <div className="mt-4 grid gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-white">This membership includes</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
                      <li>Business claim initiation tied to the selected public listing</li>
                      <li>Ownership-review intake and manual review handling</li>
                      <li>Professional review of the existing BWE profile</li>
                      <li>Profile-enhancement setup using verified business information</li>
                      <li>Initial profile-performance baseline</li>
                      <li>Recurring monthly activity report and member support access</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-white">What happens after payment</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
                      <li>Your membership is activated through the canonical checkout and webhook flow</li>
                      <li>Your claim is initiated and ownership review moves to pending</li>
                      <li>BWE opens onboarding, fulfillment, and baseline records</li>
                      <li>You follow the ownership-review steps before owner verification is approved</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-white">This membership does not guarantee</div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-white/65">
                      <li>Automatic ownership verification based on payment alone</li>
                      <li>Leads, sales, revenue growth, or visibility outcomes</li>
                      <li>Grants, loans, investment, contracts, or introductions</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-white/70">
                    Cancellation and billing changes continue through the existing canonical billing process after checkout.
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-bold text-white">3. Start membership and claim process</h2>
                {confirmedBusiness ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75 space-y-3">
                    <div>
                      <div className="font-semibold text-white">Selected business</div>
                      <div className="mt-1">{confirmedBusiness.businessName}</div>
                      <div className="mt-1 text-white/55">
                        {[confirmedBusiness.category, [confirmedBusiness.city, confirmedBusiness.state].filter(Boolean).join(", ")]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-white">Membership</div>
                      <div className="mt-1">Founding Verified Business Growth Membership</div>
                      <div className="mt-1 text-white/55">{offer ? money(offer.amountCents) : "$49.00"} per month, monthly only</div>
                    </div>
                    <div>
                      <div className="font-semibold text-white">Included services</div>
                      <div className="mt-1 text-white/65">Claim initiation, ownership review intake, profile review, fulfillment setup, baseline creation, and monthly reporting.</div>
                    </div>
                    <div>
                      <div className="font-semibold text-white">Ownership-review requirement</div>
                      <div className="mt-1 text-white/65">Payment activates the membership and opens ownership review, but does not verify ownership automatically.</div>
                    </div>
                    <div>
                      <div className="font-semibold text-white">Next steps after payment</div>
                      <div className="mt-1 text-white/65">Payment confirmation, claim initiated, ownership review pending, profile review queued, baseline created, and monthly reporting scheduled.</div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                    Confirm one selected business above before checkout is enabled.
                  </div>
                )}

                <button
                  type="button"
                  disabled={submitting || !confirmedBusinessId || (offer?.remainingSlots || 0) <= 0}
                  onClick={beginCheckout}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-yellow-500 px-4 py-3 font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Redirecting to secure checkout…" : "Start Membership and Claim Process"}
                </button>

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/50">
                  <span>
                    Need a different path? <Link href="/business-directory" className="text-yellow-300 underline">Return to the business directory</Link>
                  </span>
                  {confirmedBusiness ? (
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmedBusinessId("");
                        setError("");
                        document.getElementById("membership-review")?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className="text-yellow-300 underline"
                    >
                      Change selected business
                    </button>
                  ) : null}
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
