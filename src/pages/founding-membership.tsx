import { useEffect, useMemo, useRef, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

type ResumeState = {
  selectedBusinessId: string;
  confirmedBusinessId: string;
  resumeCheckoutRequested: boolean;
  resumeBusinessName: string;
  error: string;
};

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
  publicStatus: string;
  claimable: boolean;
  currentClaimState: string | null;
  unavailableReason: string | null;
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

function normalizeResumeState(args: {
  requestedBusinessId: string;
  resumeParam: string;
  business: BusinessOption | null;
}): ResumeState {
  const requestedBusinessId = String(args.requestedBusinessId || "").trim();
  const resumeParam = String(args.resumeParam || "")
    .trim()
    .toLowerCase();
  const resumeCheckoutRequested = resumeParam === "checkout";

  if (!requestedBusinessId) {
    return {
      selectedBusinessId: "",
      confirmedBusinessId: "",
      resumeCheckoutRequested: false,
      resumeBusinessName: "",
      error: "",
    };
  }

  if (!args.business) {
    return {
      selectedBusinessId: "",
      confirmedBusinessId: "",
      resumeCheckoutRequested: false,
      resumeBusinessName: "",
      error:
        "The requested business could not be confirmed as a current public claimable listing. Please choose one from the list below.",
    };
  }

  return {
    selectedBusinessId: args.business.id,
    confirmedBusinessId: args.business.id,
    resumeCheckoutRequested,
    resumeBusinessName: args.business.businessName,
    error: "",
  };
}

function shouldAutoResumeCheckout(args: {
  confirmedBusinessId: string;
  resumeCheckoutRequested: boolean;
  checkoutInFlight: boolean;
  autoResumeConsumed: boolean;
}) {
  return Boolean(
    args.confirmedBusinessId &&
    args.resumeCheckoutRequested &&
    !args.checkoutInFlight &&
    !args.autoResumeConsumed,
  );
}

function buildCheckoutPayload(businessId: string) {
  return {
    type: "plan",
    itemId: "founding-verified-business-growth-membership",
    businessId,
    metadata: {
      businessId,
      checkoutContext: "founding_membership",
    },
  };
}

function getUnavailableLabel(business: BusinessOption) {
  return business.unavailableReason === "already_verified"
    ? "Already Verified"
    : business.unavailableReason === "claim_already_initiated"
      ? "Claim Already Initiated"
      : business.unavailableReason === "ownership_review_pending"
        ? "Ownership Verification Pending"
        : business.unavailableReason === "membership_already_active"
          ? "Membership Already Active"
          : "Unavailable";
}

export default function FoundingMembershipPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<OptionsPayload | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [confirmedBusinessId, setConfirmedBusinessId] = useState("");
  const [checkoutState, setCheckoutState] = useState<
    "idle" | "validating" | "redirecting" | "auth_required" | "checkout_error"
  >("idle");
  const [checkoutMessage, setCheckoutMessage] = useState("");
  const [resumeCheckoutRequested, setResumeCheckoutRequested] = useState(false);
  const [resumeBusinessName, setResumeBusinessName] = useState("");
  const checkoutInFlightRef = useRef(false);
  const autoResumeConsumedRef = useRef(false);

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
      }
    })();
  }, []);

  useEffect(() => {
    if (!router.isReady || !data?.businesses?.length) return;

    const requestedBusinessId =
      typeof router.query.businessId === "string"
        ? router.query.businessId.trim()
        : "";
    const resumeParam =
      typeof router.query.resume === "string" ? router.query.resume.trim() : "";

    if (!requestedBusinessId) {
      setResumeCheckoutRequested(false);
      setResumeBusinessName("");
      return;
    }

    const found = data.businesses.find(
      (business) => business.id === requestedBusinessId,
    );

    const normalized = normalizeResumeState({
      requestedBusinessId,
      resumeParam,
      business: found || null,
    });

    setSelectedBusinessId(normalized.selectedBusinessId);
    setConfirmedBusinessId(normalized.confirmedBusinessId);
    setResumeCheckoutRequested(normalized.resumeCheckoutRequested);
    setResumeBusinessName(normalized.resumeBusinessName);
    setError(normalized.error);
    setCheckoutState("idle");
    setCheckoutMessage("");
    checkoutInFlightRef.current = false;
    autoResumeConsumedRef.current = false;

    if (!normalized.resumeCheckoutRequested && typeof window !== "undefined") {
      const cleanPath = normalized.selectedBusinessId
        ? `/founding-membership?businessId=${encodeURIComponent(
            normalized.selectedBusinessId,
          )}`
        : "/founding-membership";
      window.history.replaceState(null, "", cleanPath);
    }
  }, [router.isReady, router.query.businessId, router.query.resume, data]);

  const businesses = useMemo(() => data?.businesses || [], [data?.businesses]);
  const selectedBusiness = useMemo(
    () =>
      businesses.find((business) => business.id === selectedBusinessId) || null,
    [businesses, selectedBusinessId],
  );
  const confirmedBusiness = useMemo(
    () =>
      businesses.find((business) => business.id === confirmedBusinessId) ||
      null,
    [businesses, confirmedBusinessId],
  );

  const activeBusiness = confirmedBusiness || selectedBusiness;
  const offer = data?.offer;
  const hasRemainingSlots = (offer?.remainingSlots ?? 0) > 0;
  const checkoutUnavailable =
    checkoutState === "checkout_error" && !confirmedBusinessId;

  const consumeResumeIntent = (businessIdOverride?: string) => {
    setResumeCheckoutRequested(false);
    if (typeof window !== "undefined") {
      const activeBusinessId =
        businessIdOverride || confirmedBusinessId || selectedBusinessId;
      const cleanPath = activeBusinessId
        ? `/founding-membership?businessId=${encodeURIComponent(activeBusinessId)}`
        : "/founding-membership";
      window.history.replaceState(null, "", cleanPath);
    }
  };

  const clearBusinessSelection = () => {
    setSelectedBusinessId("");
    setConfirmedBusinessId("");
    setResumeCheckoutRequested(false);
    setResumeBusinessName("");
    setError("");
    setCheckoutState("idle");
    setCheckoutMessage("");
    autoResumeConsumedRef.current = false;
    checkoutInFlightRef.current = false;
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", "/founding-membership");
    }
  };

  const beginCheckout = async () => {
    if (checkoutInFlightRef.current) {
      return;
    }

    if (!confirmedBusinessId) {
      setError("Confirm the selected business before starting membership.");
      setCheckoutState("checkout_error");
      setCheckoutMessage("Confirm your business first.");
      return;
    }

    try {
      checkoutInFlightRef.current = true;
      setSubmitting(true);
      setError("");
      setCheckoutState("validating");
      setCheckoutMessage("Opening secure checkout…");
      consumeResumeIntent(confirmedBusinessId);

      const meRes = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });
      const meJson = await meRes.json().catch(() => ({}));
      if (!meRes.ok || !meJson?.user) {
        setCheckoutState("auth_required");
        setCheckoutMessage("Please sign in to continue to secure checkout.");
        setSubmitting(false);
        checkoutInFlightRef.current = false;
        const resume = `/founding-membership?businessId=${encodeURIComponent(confirmedBusinessId)}&resume=checkout`;
        await router.push(`/login?redirect=${encodeURIComponent(resume)}`);
        return;
      }

      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(buildCheckoutPayload(confirmedBusinessId)),
      });

      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setCheckoutState("auth_required");
        setCheckoutMessage(
          "Authentication required. Please sign in and continue checkout.",
        );
        setSubmitting(false);
        checkoutInFlightRef.current = false;
        const resume = `/founding-membership?businessId=${encodeURIComponent(confirmedBusinessId)}&resume=checkout`;
        await router.push(`/login?redirect=${encodeURIComponent(resume)}`);
        return;
      }

      if (!res.ok || !json?.url) {
        const apiMessage =
          typeof json?.error === "string"
            ? json.error
            : "Unable to create the Stripe Checkout Session";
        throw new Error(apiMessage);
      }

      setCheckoutState("redirecting");
      setCheckoutMessage("Opening secure checkout…");
      window.location.assign(json.url);
    } catch (e: any) {
      const message = e?.message || "Unable to start checkout";
      setError(message);
      setCheckoutState("checkout_error");
      setCheckoutMessage(message);
      setSubmitting(false);
      checkoutInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (
      !shouldAutoResumeCheckout({
        confirmedBusinessId,
        resumeCheckoutRequested,
        checkoutInFlight: checkoutInFlightRef.current,
        autoResumeConsumed: autoResumeConsumedRef.current,
      })
    ) {
      return;
    }

    autoResumeConsumedRef.current = true;
    void beginCheckout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmedBusinessId, resumeCheckoutRequested]);

  const buttonReason = !confirmedBusinessId
    ? activeBusiness && !activeBusiness.claimable
      ? "Business is unavailable"
      : "Confirm your business first"
    : !hasRemainingSlots
      ? "No pilot positions remain"
      : checkoutUnavailable
        ? "Checkout is temporarily unavailable"
        : "";

  const checkoutDisabled =
    submitting || !confirmedBusinessId || !hasRemainingSlots;

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
                  Claim your Black-owned business. Strengthen your profile.
                  Measure your visibility and growth. This pilot starts with one
                  offer, one price, and one customer path for existing public
                  BWE business listings.
                </p>
              </div>
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                <div>
                  {offer ? money(offer.amountCents) : "$49.00"} per month
                </div>
                <div>Monthly billing only</div>
                <div>
                  {offer
                    ? `${offer.remainingSlots} of ${offer.pilotLimit} pilot positions available`
                    : "10 pilot positions total"}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-white/5 to-black/40 p-6 shadow-xl">
            {activeBusiness ? (
              <div className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.12em] text-yellow-200/80">
                      Selected business
                    </div>
                    <h2 className="mt-2 text-2xl font-black text-white">
                      {resumeBusinessName || activeBusiness.businessName}
                    </h2>
                    <div className="mt-2 text-sm text-white/75">
                      {[
                        activeBusiness.category,
                        [activeBusiness.city, activeBusiness.state]
                          .filter(Boolean)
                          .join(", "),
                      ]
                        .filter(Boolean)
                        .join(" • ") || "Business details recorded"}
                    </div>
                    {activeBusiness.address ? (
                      <div className="mt-1 text-sm text-white/55">
                        {activeBusiness.address}
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/75">
                    <div>
                      Claimability:{" "}
                      {activeBusiness.claimable
                        ? "Claimable"
                        : getUnavailableLabel(activeBusiness)}
                    </div>
                    <div className="mt-1 text-white/55">
                      Canonical ID: {activeBusiness.id}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <button
                    type="button"
                    disabled={checkoutDisabled}
                    onClick={beginCheckout}
                    className="inline-flex w-full items-center justify-center rounded-xl bg-yellow-500 px-5 py-3 text-base font-black text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60 lg:w-auto lg:min-w-[320px]"
                  >
                    {checkoutState === "validating"
                      ? "Validating secure checkout…"
                      : checkoutState === "redirecting"
                        ? "Opening secure checkout…"
                        : checkoutState === "auth_required"
                          ? "Continue to Login"
                          : resumeCheckoutRequested || confirmedBusinessId
                            ? "Continue to Secure Checkout"
                            : "Start Membership and Claim Process"}
                  </button>
                  {buttonReason ? (
                    <div className="text-sm font-semibold text-yellow-100">
                      {buttonReason}
                    </div>
                  ) : (
                    <div className="text-sm text-white/65">
                      Membership details and ownership-verification terms remain
                      below for review.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      if (activeBusiness.claimable) {
                        setConfirmedBusinessId(activeBusiness.id);
                        setSelectedBusinessId(activeBusiness.id);
                        setCheckoutState("idle");
                        setCheckoutMessage("");
                        setError("");
                      }
                      document
                        .getElementById("membership-review")
                        ?.scrollIntoView({
                          behavior: "smooth",
                          block: "start",
                        });
                    }}
                    className="rounded-xl border border-white/15 px-4 py-2 font-bold text-white/85 transition hover:bg-white/10"
                  >
                    Review membership details
                  </button>
                  <Link
                    href="/business-directory?mode=claim"
                    className="rounded-xl border border-white/15 px-4 py-2 font-bold text-white/85 transition hover:bg-white/10"
                  >
                    Find another business
                  </Link>
                  <button
                    type="button"
                    onClick={clearBusinessSelection}
                    className="rounded-xl border border-white/15 px-4 py-2 font-bold text-white/60 transition hover:bg-white/10"
                  >
                    Clear selection
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.12em] text-yellow-200/80">
                    Start with your listing
                  </div>
                  <h2 className="mt-2 text-2xl font-black text-white">
                    Find your public business first
                  </h2>
                  <p className="mt-2 max-w-3xl text-sm text-white/75">
                    Search the BWE directory in claim mode, open your existing
                    listing, and return here with the canonical business
                    selected automatically.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/business-directory?mode=claim"
                    className="inline-flex items-center justify-center rounded-xl bg-yellow-500 px-5 py-3 text-base font-black text-black transition hover:bg-yellow-400"
                  >
                    Find My Business
                  </Link>
                  <Link
                    href="/business-directory/add-business"
                    className="inline-flex items-center justify-center rounded-xl border border-white/15 px-5 py-3 text-base font-bold text-white/85 transition hover:bg-white/10"
                  >
                    My business is not listed
                  </Link>
                </div>
              </div>
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            {!activeBusiness ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-bold text-white">
                  1. Select your public business
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  Search for your business in claim mode first, then return here
                  with the business already selected.
                </p>
                <div className="mt-5">
                  <Link
                    href="/business-directory?mode=claim"
                    className="inline-flex items-center justify-center rounded-xl bg-yellow-500 px-4 py-3 font-bold text-black transition hover:bg-yellow-400"
                  >
                    Find My Business
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-bold text-white">
                  1. Selected public business
                </h2>
                <p className="mt-2 text-sm text-white/70">
                  This membership only applies to an existing public, claimable
                  BWE business. Availability is shown here and rechecked again
                  during checkout.
                </p>

                {error ? (
                  <p className="mt-4 text-sm text-red-300">{error}</p>
                ) : null}

                <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <div className="space-y-2 text-sm text-white/80">
                    <div className="font-semibold text-white">
                      {activeBusiness.businessName}
                    </div>
                    <div>
                      {[
                        activeBusiness.category,
                        [activeBusiness.city, activeBusiness.state]
                          .filter(Boolean)
                          .join(", "),
                      ]
                        .filter(Boolean)
                        .join(" • ") || "Business details recorded"}
                    </div>
                    <div className="text-white/55">
                      {activeBusiness.claimable
                        ? "This business is confirmed for secure checkout."
                        : `${activeBusiness.businessName} is not currently available for a new founding membership claim.`}
                    </div>
                    <div className="text-xs text-white/45">
                      Canonical business ID: {activeBusiness.id}
                    </div>
                    <div className="text-xs text-white/45">
                      Server availability:{" "}
                      {activeBusiness.claimable
                        ? "Claimable"
                        : getUnavailableLabel(activeBusiness)}
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/business-directory?mode=claim"
                      className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-3 font-bold text-white/85 transition hover:bg-white/10"
                    >
                      Choose a different business
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              <section
                id="membership-review"
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <h2 className="text-xl font-bold text-white">
                  2. Confirm business and membership
                </h2>
                <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-black/20 p-4">
                  <div className="text-3xl font-black text-yellow-300">
                    {offer ? money(offer.amountCents) : "$49.00"}
                  </div>
                  <div className="text-sm text-white/65">
                    per month, monthly billing only
                  </div>
                </div>
                <div className="mt-4 grid gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-white">
                      This membership includes
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
                      <li>
                        Business claim initiation tied to the selected public
                        listing
                      </li>
                      <li>
                        Ownership-review intake and manual review handling
                      </li>
                      <li>Professional review of the existing BWE profile</li>
                      <li>
                        Profile-enhancement setup using verified business
                        information
                      </li>
                      <li>Initial profile-performance baseline</li>
                      <li>
                        Recurring monthly activity report and member support
                        access
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      What happens after payment
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-white/75">
                      <li>
                        Your membership is activated through the canonical
                        checkout and webhook flow
                      </li>
                      <li>
                        Your claim is initiated and ownership verification moves
                        to pending
                      </li>
                      <li>
                        BWE opens onboarding, fulfillment, and baseline records
                      </li>
                      <li>
                        You follow the ownership-verification steps before owner
                        verification is approved
                      </li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-white">
                      This membership does not guarantee
                    </div>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-white/65">
                      <li>
                        Automatic ownership verification based on payment alone
                      </li>
                      <li>
                        Leads, sales, revenue growth, or visibility outcomes
                      </li>
                      <li>
                        Grants, loans, investment, contracts, or introductions
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/25 p-4 text-white/70">
                    Cancellation and billing changes continue through the
                    existing canonical billing process after checkout.
                  </div>
                </div>
              </section>

              <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-xl font-bold text-white">
                  3. Start membership and claim process
                </h2>
                {confirmedBusiness ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/75 space-y-3">
                    <div>
                      <div className="font-semibold text-white">
                        Selected business
                      </div>
                      <div className="mt-1">
                        {resumeBusinessName || confirmedBusiness.businessName}
                      </div>
                      <div className="mt-1 text-white/55">
                        {[
                          confirmedBusiness.category,
                          [confirmedBusiness.city, confirmedBusiness.state]
                            .filter(Boolean)
                            .join(", "),
                        ]
                          .filter(Boolean)
                          .join(" • ")}
                      </div>
                      <div className="mt-1 text-white/50">
                        Confirmed business ID: {confirmedBusiness.id}
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-white">Membership</div>
                      <div className="mt-1">
                        Founding Verified Business Growth Membership
                      </div>
                      <div className="mt-1 text-white/55">
                        {offer ? money(offer.amountCents) : "$49.00"} per month,
                        monthly only
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        Included services
                      </div>
                      <div className="mt-1 text-white/65">
                        Claim initiation, ownership verification intake, profile
                        review, fulfillment setup, baseline creation, and
                        monthly reporting.
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        Ownership-review requirement
                      </div>
                      <div className="mt-1 text-white/65">
                        Payment activates the membership and opens ownership
                        review, but does not verify ownership automatically.
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        Next steps after payment
                      </div>
                      <div className="mt-1 text-white/65">
                        Payment confirmation, claim initiated, ownership
                        verification pending, profile review queued, baseline
                        created, and monthly reporting scheduled.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-white/65">
                    Find your listing first, then return here to continue to
                    secure checkout.
                  </div>
                )}

                {checkoutState !== "idle" ? (
                  <div
                    className={`mt-4 rounded-2xl border p-4 text-sm ${
                      checkoutState === "checkout_error"
                        ? "border-red-500/30 bg-red-500/10 text-red-200"
                        : checkoutState === "auth_required"
                          ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-100"
                          : "border-white/10 bg-black/20 text-white/80"
                    }`}
                  >
                    <div className="font-semibold">
                      {checkoutState === "validating"
                        ? "Validating checkout"
                        : checkoutState === "redirecting"
                          ? "Redirecting to Stripe"
                          : checkoutState === "auth_required"
                            ? "Authentication required"
                            : "Checkout error"}
                    </div>
                    <div className="mt-1">{checkoutMessage}</div>
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={checkoutDisabled}
                  onClick={beginCheckout}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-yellow-500 px-4 py-3 font-bold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {checkoutState === "validating"
                    ? "Validating secure checkout…"
                    : checkoutState === "redirecting"
                      ? "Opening secure checkout…"
                      : checkoutState === "auth_required"
                        ? "Continue to Login"
                        : submitting
                          ? "Opening secure checkout…"
                          : confirmedBusinessId || resumeCheckoutRequested
                            ? "Continue to Secure Checkout"
                            : "Find My Business First"}
                </button>

                {buttonReason ? (
                  <div className="mt-2 text-sm font-semibold text-yellow-100">
                    {buttonReason}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/50">
                  <span>
                    Need a different path?{" "}
                    <Link
                      href="/business-directory?mode=claim"
                      className="text-yellow-300 underline"
                    >
                      Return to claim mode directory
                    </Link>
                  </span>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
