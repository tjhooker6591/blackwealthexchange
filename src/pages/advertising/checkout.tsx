import type { GetServerSideProps } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { getAdQuote } from "@/lib/advertising/pricing";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";

const CHECKOUT_LOCK_PREFIX = "bwe:ad-checkout-lock:";
const CHECKOUT_LOCK_TTL_MS = 20_000;

type InvalidParsed = {
  invalid: true;
  error: string;
  detailsHref?: string;
};

type ValidParsed = {
  invalid: false;
  option: string;
  label: string;
  durationDays: number;
  amountDollars: number;
  businessId: string;
  campaignId: string;
  placement: string;
};

type ParsedCheckout = InvalidParsed | ValidParsed;

function qStr(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

function parseOptionalPositiveInt(v: unknown): number | undefined {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
}

function normalizeAdOption(raw: string) {
  const option = raw.trim();
  const aliases: Record<string, string> = {
    "featured-sponsor-ad": "featured-sponsor",
    "sponsor-featured": "featured-sponsor",
    "banner-homepage-top": "banner-ad",
    "banner-sidebar": "banner-ad",
    "banner-footer": "banner-ad",
    "banner-dashboard": "banner-ad",
  };
  return aliases[option] || option;
}

function normalizeFromLegacyQuery(query: Record<string, any>) {
  const type = qStr(query.type).toLowerCase();
  const plan = qStr(query.plan).toLowerCase();

  if (type === "directory") {
    if (plan === "featured") return "directory-featured";
    if (plan === "standard") return "directory-standard";
  }

  return "";
}

function optionToDetailsHref(option: string) {
  if (option === "featured-sponsor") return "/advertise/featured-sponsor";
  if (option === "directory-standard" || option === "directory-featured") {
    return "/advertise/business-directory";
  }
  if (option === "banner-ad") return "/advertise/banner-ads";
  if (option === "custom-solution-deposit") return "/advertise/custom";
  return "/advertising";
}

function buildAttemptKey(input: {
  option: string;
  durationDays: number;
  businessId: string;
  campaignId: string;
  placement: string;
}) {
  return [
    input.option,
    String(input.durationDays),
    input.businessId || "",
    input.campaignId || "",
    input.placement || "",
  ].join("|");
}

function getLockStorageKey(attemptKey: string) {
  return `${CHECKOUT_LOCK_PREFIX}${attemptKey}`;
}

function acquireCheckoutLock(attemptKey: string) {
  if (typeof window === "undefined") return true;
  const storageKey = getLockStorageKey(attemptKey);
  const now = Date.now();

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (raw) {
      const ts = Number(raw);
      if (Number.isFinite(ts) && now - ts < CHECKOUT_LOCK_TTL_MS) return false;
    }

    window.sessionStorage.setItem(storageKey, String(now));
    return true;
  } catch {
    return true;
  }
}

function releaseCheckoutLock(attemptKey: string) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(getLockStorageKey(attemptKey));
  } catch {
    // ignore
  }
}

type AdvertisingCheckoutPageProps = {
  initialOption: string;
  initialDuration: string;
  initialBusinessId: string;
  initialCampaignId: string;
  initialPlacement: string;
  initialType: string;
  initialPlan: string;
};

export default function AdvertisingCheckoutPage({
  initialOption,
  initialDuration,
  initialBusinessId,
  initialCampaignId,
  initialPlacement,
  initialType,
  initialPlan,
}: AdvertisingCheckoutPageProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [retryHint, setRetryHint] = useState(false);

  const trackAdCheckoutEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/advertising/checkout",
      section: "advertising_checkout",
      ...extras,
    });
  };
  const [loading, setLoading] = useState(false);
  const startedAttemptRef = useRef<string | null>(null);

  const parsed = useMemo<ParsedCheckout | null>(() => {
    const queryLike = {
      option:
        typeof router.query.option === "string"
          ? router.query.option
          : initialOption,
      duration:
        typeof router.query.duration === "string"
          ? router.query.duration
          : initialDuration,
      businessId:
        typeof router.query.businessId === "string"
          ? router.query.businessId
          : initialBusinessId,
      campaignId:
        typeof router.query.campaignId === "string"
          ? router.query.campaignId
          : initialCampaignId,
      placement:
        typeof router.query.placement === "string"
          ? router.query.placement
          : initialPlacement,
      type:
        typeof router.query.type === "string" ? router.query.type : initialType,
      plan:
        typeof router.query.plan === "string" ? router.query.plan : initialPlan,
    };

    const rawOption =
      qStr(queryLike.option) || normalizeFromLegacyQuery(queryLike);
    const option = normalizeAdOption(rawOption);
    const durationDays = parseOptionalPositiveInt(queryLike.duration);

    const businessId = qStr(queryLike.businessId);
    const campaignId = qStr(queryLike.campaignId);
    const placement = qStr(queryLike.placement);

    const quote = getAdQuote({ option, durationDays });
    if (!quote) {
      return {
        invalid: true,
        error: "Invalid advertising option or duration.",
      };
    }

    if (!campaignId) {
      return {
        invalid: true,
        error:
          "Campaign details are required before checkout. Please complete the details form first.",
        detailsHref: optionToDetailsHref(quote.option),
      };
    }

    if (option === "featured-sponsor" && !businessId) {
      return {
        invalid: true,
        error:
          "Featured sponsorship requires a linked BWE business listing before checkout.",
        detailsHref: optionToDetailsHref(quote.option),
      };
    }

    return {
      invalid: false,
      option: quote.option,
      label: quote.label,
      durationDays: quote.durationDays,
      amountDollars: quote.amountDollars,
      businessId,
      campaignId,
      placement,
    };
  }, [
    initialBusinessId,
    initialCampaignId,
    initialDuration,
    initialOption,
    initialPlacement,
    initialPlan,
    initialType,
    router.query,
  ]);

  useEffect(() => {
    if (!parsed || parsed.invalid) return;
    trackAdCheckoutEvent("advertising_landing_viewed", {
      ad_option: parsed.option,
      ad_type: parsed.option,
      package_type: parsed.option,
      checkout_variant: "unified_advertising_checkout",
      source_variant: "advertising_checkout",
      duration_days: parsed.durationDays,
      placement: parsed.placement || null,
      campaignId: parsed.campaignId || null,
    });
  }, [parsed]);

  const handleStartCheckout = async () => {
    if (!parsed || parsed.invalid) return;

    const attemptKey = buildAttemptKey({
      option: parsed.option,
      durationDays: parsed.durationDays,
      businessId: parsed.businessId,
      campaignId: parsed.campaignId,
      placement: parsed.placement,
    });

    if (startedAttemptRef.current === attemptKey) return;
    if (!acquireCheckoutLock(attemptKey)) {
      setMessage("Checkout is already being prepared. Please wait a moment.");
      return;
    }

    startedAttemptRef.current = attemptKey;
    setLoading(true);
    setRetryHint(false);
    setMessage("Preparing secure checkout…");

    trackAdCheckoutEvent("advertising_checkout_started", {
      ad_option: parsed.option,
      ad_type: parsed.option,
      package_type: parsed.option,
      checkout_variant: "unified_advertising_checkout",
      source_variant: "advertising_checkout",
      duration_days: parsed.durationDays,
      placement: parsed.placement || null,
      campaignId: parsed.campaignId || null,
      destination: "/api/stripe/checkout",
    });

    try {
      const origin = window.location.origin;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          itemId: parsed.option,
          type: "ad",
          amount: parsed.amountDollars,
          durationDays: parsed.durationDays,
          businessId: parsed.businessId || undefined,
          campaignId: parsed.campaignId || undefined,
          placement: parsed.placement || undefined,
          metadata: {
            option: parsed.option,
            durationDays: String(parsed.durationDays),
            businessId: parsed.businessId || "",
            campaignId: parsed.campaignId || "",
            placement: parsed.placement || "",
          },
          successUrl: `${origin}/advertising?success=1&option=${encodeURIComponent(parsed.option)}`,
          cancelUrl: `${origin}/advertising?canceled=1&option=${encodeURIComponent(parsed.option)}`,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 401) {
        releaseCheckoutLock(attemptKey);
        startedAttemptRef.current = null;
        router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`);
        return;
      }

      if (res.status === 409) {
        setMessage(
          data?.error ||
            "A checkout session is already in progress. Please wait and retry.",
        );
        setLoading(false);
        return;
      }

      if (!res.ok || !data?.url) {
        throw new Error(data?.error || "Checkout failed");
      }

      window.location.href = data.url;
    } catch (err: any) {
      releaseCheckoutLock(attemptKey);
      startedAttemptRef.current = null;
      setMessage(err?.message || "Unable to start checkout.");
      setRetryHint(true);
      setLoading(false);
    }
  };

  if (!parsed) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-neutral-950 p-6 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="bwe-hero-panel relative w-full max-w-md rounded-[30px] p-6 text-center">
          <div className="bwe-eyebrow">Advertising checkout</div>
          <h1 className="bwe-section-title mt-3">Loading checkout details</h1>
          <p className="mt-3 text-sm text-white/68">
            Preparing your pricing and campaign review state.
          </p>
        </div>
      </main>
    );
  }

  if (parsed.invalid) {
    const detailsHref = parsed.detailsHref || "";

    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-neutral-950 p-6 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[640px] w-[640px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />
        <div className="bwe-hero-panel relative w-full max-w-md rounded-[30px] border border-red-500/30 p-6 text-center">
          <div className="bwe-eyebrow">Advertising checkout</div>
          <h1 className="bwe-section-title mt-3">Checkout details required</h1>
          <p className="mt-3 text-sm text-red-200">{parsed.error}</p>
          <button
            onClick={() => router.replace(detailsHref || "/advertising")}
            className="bwe-cta-primary bwe-focus-ring mt-5 px-6"
          >
            {detailsHref
              ? "Complete Campaign Details"
              : "Back to Advertising Options"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
      <div className="absolute inset-0 bg-neutral-950" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[680px] w-[680px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />

      <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
        <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
          <div className="relative max-w-3xl">
            <div className="bwe-eyebrow">Advertising checkout</div>
            <h1 className="bwe-display-title mt-3 max-w-[11ch]">
              Review your campaign before secure payment.
            </h1>
            <p className="bwe-lead mt-4 max-w-2xl">
              This page confirms option, duration, placement, and campaign
              linkage before the secure Stripe handoff.
            </p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
            <div className="rounded-2xl border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)] px-4 py-3 text-xs text-white/82">
              You are reviewing your transaction before secure payment handoff.
            </div>

            <div className="mt-4 grid gap-3 text-sm">
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.12em] text-white/45">
                  Option
                </div>
                <div className="mt-1 font-semibold text-white">
                  {parsed.label}
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.12em] text-white/45">
                  Duration
                </div>
                <div className="mt-1 text-white">
                  {parsed.durationDays} days
                </div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.12em] text-white/45">
                  Price
                </div>
                <div className="mt-1 font-semibold text-[var(--accent)]">
                  ${parsed.amountDollars}
                </div>
              </div>
              {parsed.placement ? (
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.12em] text-white/45">
                    Placement
                  </div>
                  <div className="mt-1 text-white">{parsed.placement}</div>
                </div>
              ) : null}
              {parsed.campaignId ? (
                <div className="rounded-2xl border border-white/8 bg-black/20 px-4 py-4">
                  <div className="text-xs uppercase tracking-[0.12em] text-white/45">
                    Campaign request
                  </div>
                  <div className="mt-1 break-all text-white">
                    {parsed.campaignId}
                  </div>
                </div>
              ) : null}
              <div className="rounded-2xl border border-[rgba(212,175,55,0.24)] bg-[rgba(212,175,55,0.08)] px-4 py-4">
                <div className="text-xs uppercase tracking-[0.12em] text-white/45">
                  Estimated total
                </div>
                <div className="mt-1 font-semibold text-[var(--accent)]">
                  ${parsed.amountDollars}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 sm:p-6">
              <div className="bwe-eyebrow">What happens next</div>
              <div className="mt-4 space-y-2 text-sm leading-6 text-white/68">
                <p>1. Complete secure payment.</p>
                <p>2. Campaign enters review and approval workflow.</p>
                <p>
                  3. Approved campaigns are scheduled and activated by placement
                  rules.
                </p>
                <p>
                  Need help? Visit{" "}
                  <span className="text-[var(--accent)]">/support</span> or
                  review{" "}
                  <span className="text-[var(--accent)]">
                    /legal/advertising-guidelines
                  </span>
                  .
                </p>
              </div>
            </section>

            {message ? (
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 text-sm text-white/72">
                {message}
              </div>
            ) : null}
            {retryHint ? (
              <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-4 text-xs text-yellow-100">
                Retry checkout, or go back to confirm details before trying
                again.
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => router.back()}
                className="bwe-cta-secondary bwe-focus-ring flex-1 px-6"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleStartCheckout}
                className="bwe-cta-primary bwe-focus-ring flex-1 px-6 disabled:opacity-60"
                disabled={loading}
              >
                {loading ? "Starting..." : "Continue to Secure Checkout"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps<
  AdvertisingCheckoutPageProps
> = async ({ query }) => ({
  props: {
    initialOption: typeof query.option === "string" ? query.option : "",
    initialDuration: typeof query.duration === "string" ? query.duration : "",
    initialBusinessId:
      typeof query.businessId === "string" ? query.businessId : "",
    initialCampaignId:
      typeof query.campaignId === "string" ? query.campaignId : "",
    initialPlacement:
      typeof query.placement === "string" ? query.placement : "",
    initialType: typeof query.type === "string" ? query.type : "",
    initialPlan: typeof query.plan === "string" ? query.plan : "",
  },
});
