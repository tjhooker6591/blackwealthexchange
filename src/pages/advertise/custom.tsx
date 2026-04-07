// src/pages/advertise/custom.tsx

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { emitFlowEvent } from "@/lib/analytics/flowEvents";

type SaveResponse =
  | { success: true; requestId: string; message: string }
  | { success: false; error: string };

const CUSTOM_OPTIONS = [
  {
    id: "homepage-feature",
    title: "Homepage Feature",
    description:
      "Prominent homepage placement to spotlight your brand, campaign, or offer.",
  },
  {
    id: "homepage-highlight-section",
    title: "Sponsored Homepage Highlight Section",
    description:
      "A featured section on the homepage dedicated to your business or promotion.",
  },
  {
    id: "newsletter-feature",
    title: "Newsletter Feature",
    description:
      "Placement inside a promotional email or newsletter spotlight.",
  },
  {
    id: "custom-landing-page",
    title: "Custom Landing Page",
    description:
      "A dedicated campaign page built around your message, product, event, or offer.",
  },
  {
    id: "event-webinar-promotion",
    title: "Event / Webinar Promotion",
    description:
      "Promotion for webinars, live events, launches, community events, or speaking engagements.",
  },
  {
    id: "product-launch-campaign",
    title: "Product Launch Campaign",
    description:
      "A custom campaign designed to support a new product, service, or major announcement.",
  },
  {
    id: "long-term-brand-partnership",
    title: "Long-Term Brand Partnership",
    description:
      "Extended collaboration opportunities for businesses seeking ongoing visibility.",
  },
  {
    id: "other",
    title: "Other",
    description:
      "Something custom that does not fit the options above. Tell us what you need.",
  },
];

export default function CustomAd() {
  const [userId, setUserId] = useState("guest");

  const trackAdEvent = (
    eventType: string,
    extras: Record<string, unknown> = {},
  ) => {
    emitFlowEvent({
      eventType,
      pageRoute: "/advertise/custom",
      section: "advertise_custom",
      ...extras,
    });
  };
  const [name, setName] = useState("");
  const [business, setBusiness] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  const [submitted, setSubmitted] = useState(false);
  const [requestId, setRequestId] = useState("");
  const [error, setError] = useState("");

  const [savingRequest, setSavingRequest] = useState(false);
  const [startingCheckout, setStartingCheckout] = useState(false);

  useEffect(() => {
    trackAdEvent("advertising_landing_viewed");

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          credentials: "include",
        });

        if (!res.ok) return;

        const data = await res.json();
        if (data?.user?._id) {
          setUserId(data.user._id);
        }
        if (data?.user?.email) {
          setEmail(data.user.email);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };

    fetchUser();
  }, []);

  const toggleOption = (optionId: string) => {
    setSelectedOptions((prev) =>
      prev.includes(optionId)
        ? prev.filter((item) => item !== optionId)
        : [...prev, optionId],
    );

    trackAdEvent("advertising_option_selected", {
      ctaId: `custom_option_${optionId}`,
      ctaLabel: optionId,
      ad_option: "custom-solution",
      selected_option: optionId,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (selectedOptions.length === 0) {
      setError("Please select at least one custom advertising option.");
      return;
    }

    setSavingRequest(true);

    trackAdEvent("advertising_submission_started", {
      ctaId: "custom_submit_request",
      ad_option: "custom-solution",
      ad_type: "custom-solution",
      package_type: "custom",
      source_variant: "custom_ad_page",
      selected_count: selectedOptions.length,
    });

    try {
      const res = await fetch("/api/advertising/custom-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          userId,
          name,
          business,
          email,
          details,
          budget,
          timeline,
          selectedOptions,
        }),
      });

      const data: SaveResponse = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          "error" in data ? data.error : "Failed to save custom request.",
        );
      }

      setRequestId(data.requestId);
      setSubmitted(true);


    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save custom request.";
      setError(message);
    } finally {
      setSavingRequest(false);
    }
  };

  const handleReserveDeposit = async () => {
    if (!requestId) {
      setError("Please submit your custom request before paying the deposit.");
      return;
    }

    setError("");
    setStartingCheckout(true);

    try {
      const next = `/advertising/checkout?option=custom-solution-deposit&duration=30&placement=custom-solution&campaignId=${encodeURIComponent(requestId)}`;

      trackAdEvent("advertising_checkout_started", {
        ad_option: "custom-solution",
        ad_type: "custom-solution",
        package_type: "custom",
        checkout_variant: "unified_advertising_checkout",
        source_variant: "custom_ad_page",
        campaignId: requestId,
        destination: "/advertising/checkout",
      });

      window.location.href = next;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start checkout.";
      setError(message);
    } finally {
      setStartingCheckout(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 flex flex-col items-center text-center">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-gold mb-4">
          Custom Advertising Solutions
        </h1>

        <p className="text-lg text-gray-400 mb-6">
          Want something more tailored than a standard ad placement? Build a
          campaign around your goals with flexible promotional options designed
          for your brand.
        </p>

        <div className="bg-gray-800 p-6 rounded-lg text-left mb-10">
          <h2 className="text-2xl text-gold font-semibold mb-4">
            Available Custom Advertising Options
          </h2>
          <p className="text-gray-300 mb-4">
            Select one or more options below when submitting your request.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CUSTOM_OPTIONS.map((option) => {
              const selected = selectedOptions.includes(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleOption(option.id)}
                  className={`rounded-lg border p-4 text-left transition ${
                    selected
                      ? "border-gold bg-gold/10 shadow-md"
                      : "border-gray-700 bg-gray-900 hover:border-gold/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gold">
                        {option.title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-300">
                        {option.description}
                      </p>
                    </div>
                    <div
                      className={`mt-1 h-5 w-5 rounded border flex items-center justify-center text-xs font-bold ${
                        selected
                          ? "border-gold bg-gold text-black"
                          : "border-gray-500 text-transparent"
                      }`}
                    >
                      ✓
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-700 text-left p-6 rounded-lg mb-10">
          <h3 className="text-xl font-bold text-gold mb-2">Starting at $100</h3>
          <p className="text-gray-300 text-sm">
            Custom campaigns start at $100. Pricing varies based on scope,
            duration, placement, creative needs, and campaign complexity. Submit
            your request first, and if you are ready, you can reserve your
            campaign with the $100 deposit after submission.
          </p>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-500 bg-red-950/60 p-4 text-left text-red-200">
            {error}
          </div>
        ) : null}

        {!submitted ? (
          <form
            onSubmit={handleSubmit}
            className="bg-gray-900 p-6 rounded-lg shadow-md text-left space-y-5"
          >
            <h3 className="text-xl text-gold font-bold mb-2 text-center">
              Submit Your Custom Advertising Request
            </h3>

            <div>
              <label className="block mb-1 text-sm">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm">Business Name</label>
              <input
                type="text"
                required
                value={business}
                onChange={(e) => setBusiness(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block mb-1 text-sm">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 text-white"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm">
                Selected Advertising Options
              </label>
              <div className="flex flex-wrap gap-2">
                {selectedOptions.length > 0 ? (
                  selectedOptions.map((optionId) => {
                    const match = CUSTOM_OPTIONS.find((o) => o.id === optionId);
                    if (!match) return null;

                    return (
                      <span
                        key={optionId}
                        className="px-3 py-1 rounded-full bg-gold text-black text-sm font-medium"
                      >
                        {match.title}
                      </span>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400">
                    No options selected yet.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block mb-1 text-sm">Estimated Budget</label>
              <select
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 text-white"
              >
                <option value="">Select a budget range</option>
                <option value="under-250">Under $250</option>
                <option value="250-500">$250 - $500</option>
                <option value="500-1000">$500 - $1,000</option>
                <option value="1000-2500">$1,000 - $2,500</option>
                <option value="2500-plus">$2,500+</option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm">Preferred Timeline</label>
              <select
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 text-white"
              >
                <option value="">Select a timeline</option>
                <option value="asap">As Soon As Possible</option>
                <option value="within-2-weeks">Within 2 Weeks</option>
                <option value="within-30-days">Within 30 Days</option>
                <option value="next-60-days">Within 60 Days</option>
                <option value="planning-ahead">
                  Planning Ahead / Future Campaign
                </option>
              </select>
            </div>

            <div>
              <label className="block mb-1 text-sm">
                Tell Us About Your Campaign
              </label>
              <textarea
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full p-3 rounded bg-gray-700 text-white min-h-[160px]"
                placeholder="Describe your campaign goals, audience, preferred placement, message, timing, and anything else you want us to know."
              />
            </div>

            <button
              type="submit"
              disabled={savingRequest}
              className="w-full mt-4 py-3 px-4 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition disabled:opacity-60"
            >
              {savingRequest ? "Submitting..." : "Submit Custom Request"}
            </button>
          </form>
        ) : (
          <div className="bg-green-600 text-white p-6 rounded-lg text-left">
            <h3 className="text-2xl font-semibold mb-2">Request Received</h3>
            <p className="mb-3">
              Your custom advertising request has been saved successfully.
            </p>

            <p className="mb-3 text-green-100">
              A member of our team will review your request and follow up with
              next steps.
            </p>

            <p className="text-sm text-green-100 break-all">
              Request ID: {requestId}
            </p>

            <div className="mt-5 rounded-lg border border-green-400/30 bg-black/20 p-4 text-sm text-green-100">
              <div className="font-semibold">Review Before Checkout</div>
              <div className="mt-1">Option: Custom Solution Deposit</div>
              <div>Duration: 30 days</div>
              <div>Price: $100 deposit</div>
              <div className="text-xs mt-1 opacity-90">
                Next step: continue to advertising checkout review, then secure
                payment.
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleReserveDeposit}
                disabled={startingCheckout}
                className="w-full py-3 px-4 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition disabled:opacity-60"
              >
                {startingCheckout
                  ? "Starting checkout..."
                  : "Continue to Checkout Review ($100 Deposit)"}
              </button>
            </div>
          </div>
        )}

        <div className="mt-10">
          <Link href="/advertise-with-us">
            <button className="px-6 py-2 bg-gold text-black font-semibold rounded hover:bg-yellow-400 transition">
              Back to Ad Options
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
