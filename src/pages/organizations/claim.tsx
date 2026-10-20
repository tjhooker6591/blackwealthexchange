// src/pages/organizations/claim.tsx
//
// Claim a church or organization listing. Same Founding membership, price
// and checkout as a business claim; after payment the claim is reviewed in
// Admin > Organization claims.

import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
// Same item id the business claim page sends (src/lib/founding-membership.ts
// FOUNDING_MEMBERSHIP_ITEM_ID); that module includes server code, so it is
// not imported into this browser page.
const FOUNDING_MEMBERSHIP_ITEM_ID =
  "founding-verified-business-growth-membership";

type Org = {
  _id: string;
  name?: string;
  city?: string;
  state?: string;
  orgType?: string;
  denomination?: string;
};

const ROLES = [
  "Pastor",
  "Associate or assistant pastor",
  "Church administrator",
  "Ministry leader",
  "Board member or trustee",
  "Other staff or volunteer",
];

export default function ClaimOrganizationPage() {
  const router = useRouter();
  const organizationId =
    typeof router.query.organizationId === "string"
      ? router.query.organizationId
      : "";
  const checkout =
    typeof router.query.checkout === "string" ? router.query.checkout : "";
  const [org, setOrg] = useState<Org | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [phone, setPhone] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!organizationId) return;
    fetch(`/api/organizations/${encodeURIComponent(organizationId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setOrg(d?.item || null))
      .catch(() => setOrg(null));
    fetch("/api/auth/me", { credentials: "include", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSignedIn(Boolean(d?.user)))
      .catch(() => setSignedIn(false));
  }, [organizationId]);

  const isChurch = String(org?.orgType || "").toLowerCase() === "church";
  const noun = isChurch ? "church" : "organization";
  const orgName = org?.name || `this ${noun}`;
  const here = `/organizations/claim?organizationId=${encodeURIComponent(organizationId)}`;

  const startCheckout = async () => {
    setError("");
    if (!name.trim() || !phone.trim()) {
      setError("Please add your name and a phone number we can reach you on.");
      return;
    }
    if (!confirm) {
      setError(`Please confirm that you represent ${orgName}.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "plan",
          itemId: FOUNDING_MEMBERSHIP_ITEM_ID,
          organizationId,
          claimantName: name.trim(),
          claimantRole: role,
          claimantPhone: phone.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (res.status === 401) {
        await router.push(`/login?redirect=${encodeURIComponent(here)}`);
        return;
      }
      if (!res.ok || !json?.url)
        throw new Error(
          json?.error || "We couldn't open checkout. Please try again.",
        );
      window.location.assign(json.url);
    } catch (e: any) {
      setError(e?.message || "We couldn't open checkout. Please try again.");
      setBusy(false);
    }
  };

  return (
    <>
      <Head>
        <title>{`Claim ${orgName} | Black Wealth Exchange`}</title>
      </Head>
      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-yellow-300">
              Claim your {noun}
            </div>
            <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">
              {orgName}
            </h1>
            {org?.city || org?.state ? (
              <p className="mt-1 text-sm text-white/60">
                {[org?.city, org?.state].filter(Boolean).join(", ")}
              </p>
            ) : null}
          </div>

          {checkout === "success" ? (
            <section className="rounded-2xl border border-green-500/30 bg-green-500/10 p-5">
              <h2 className="text-lg font-bold text-green-200">
                Thank you, your claim is in
              </h2>
              <p className="mt-2 text-sm text-white/80">
                Your Founding membership is active. We&rsquo;ll confirm that you
                represent {orgName}, usually within one to two business days,
                and we&rsquo;ve emailed you a confirmation. Questions? Reply to
                that email.
              </p>
              {organizationId ? (
                <Link
                  href={`/organizations/${encodeURIComponent(organizationId)}`}
                  className="mt-4 inline-flex rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Back to {orgName}
                </Link>
              ) : null}
            </section>
          ) : (
            <>
              {checkout === "cancel" ? (
                <p className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/70">
                  Checkout was cancelled; nothing was charged. You can try again
                  below.
                </p>
              ) : null}

              <section className="rounded-2xl border border-yellow-500/25 bg-yellow-500/[0.07] p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="text-lg font-bold">Founding membership</h2>
                  <div className="text-xl font-extrabold text-yellow-300">
                    $49
                    <span className="text-sm font-semibold text-white/60">
                      /month
                    </span>
                  </div>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-white/80">
                  <li>• Confirms you as the person who represents {orgName}</li>
                  <li>
                    • We work with you to add your {noun}&rsquo;s story, service
                    times, ministries and events, and keep its details accurate
                  </li>
                  <li>
                    • Helps connect the business owners in your{" "}
                    {isChurch ? "congregation" : "community"} with the wider
                    Black Wealth Exchange ecosystem
                  </li>
                </ul>
                <p className="mt-3 text-xs text-white/55">
                  Billed monthly. Your listing stays up for free either way. To
                  cancel, reply to your confirmation email.
                </p>
              </section>

              {signedIn === false ? (
                <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-white/80">
                    Sign in or create a free account to claim {orgName}.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/login?redirect=${encodeURIComponent(here)}`}
                      className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-400"
                    >
                      Sign in
                    </Link>
                    <Link
                      href={`/signup?redirect=${encodeURIComponent(here)}`}
                      className="rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
                    >
                      Create a free account
                    </Link>
                  </div>
                </section>
              ) : signedIn ? (
                <section className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <label className="block text-sm">
                    <span className="text-white/70">Your name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2"
                      maxLength={120}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-white/70">Your role</span>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm">
                    <span className="text-white/70">
                      Phone number we can reach you on
                    </span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2"
                      maxLength={40}
                      inputMode="tel"
                    />
                  </label>
                  <label className="flex items-start gap-2 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={confirm}
                      onChange={(e) => setConfirm(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      I represent {orgName} and am authorized to claim its
                      listing.
                    </span>
                  </label>
                  {error ? (
                    <p className="text-sm text-red-300">{error}</p>
                  ) : null}
                  <button
                    type="button"
                    onClick={startCheckout}
                    disabled={busy}
                    className="w-full rounded-xl bg-yellow-500 px-4 py-3 font-semibold text-black hover:bg-yellow-400 disabled:opacity-60"
                  >
                    {busy
                      ? "Opening secure checkout…"
                      : "Continue to secure checkout ($49/month)"}
                  </button>
                </section>
              ) : (
                <p className="text-sm text-white/60">Loading…</p>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
