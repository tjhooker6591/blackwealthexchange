// pages/subscribe.tsx
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { ArrowLeft, ArrowRight, Mail, ShieldCheck } from "lucide-react";

export default function SubscribePage() {
  const router = useRouter();
  const product = String(router.query.product || "freelance"); // default to freelance
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"freelancer" | "business">("freelancer");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">(
    "idle",
  );
  const [message, setMessage] = useState("");

  const isFreelance = product === "freelance";

  const submit = async () => {
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/freelance/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Unable to join waitlist.");

      setStatus("ok");
      setMessage("You're on the waitlist. We'll email you when gigs go live.");
      setEmail("");
    } catch (e: any) {
      setStatus("err");
      setMessage(e?.message || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>Freelance Waitlist | Black Wealth Exchange</title>
      </Head>

      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <button
          onClick={() =>
            window.history.length > 1
              ? router.back()
              : router.push("/freelance")
          }
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition"
        >
          <ArrowLeft className="h-4 w-4 text-gold" />
          Back
        </button>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl">
          <h1 className="text-3xl font-extrabold text-gold">
            {isFreelance ? "Freelance & Gigs Waitlist" : "Waitlist"}
          </h1>
          <p className="mt-2 text-gray-300">
            This is specifically for the{" "}
            <span className="text-white font-semibold">
              Freelance & Gig Work
            </span>{" "}
            feature. We’ll notify you when browsing gigs, profiles, and premium
            tools launch.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-sm text-gray-300">Email</label>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3">
                <Mail className="h-4 w-4 text-gold" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-transparent py-3 text-white placeholder:text-gray-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300">I am joining as</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setRole("freelancer")}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    role === "freelancer"
                      ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  Freelancer
                </button>
                <button
                  onClick={() => setRole("business")}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    role === "business"
                      ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-200"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                >
                  Business / Client
                </button>
              </div>
            </div>

            {message ? (
              <div
                className={`rounded-xl border p-4 text-sm ${
                  status === "ok"
                    ? "border-green-500/30 bg-green-500/10 text-green-200"
                    : status === "err"
                      ? "border-red-500/30 bg-red-500/10 text-red-200"
                      : "border-white/10 bg-white/5 text-gray-200"
                }`}
              >
                {message}
              </div>
            ) : null}

            <button
              onClick={submit}
              disabled={!email || status === "loading"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-5 py-3 font-semibold text-black hover:bg-yellow-500 transition disabled:opacity-60"
            >
              {status === "loading" ? "Joining..." : "Join Waitlist"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-2 text-xs text-gray-400">
              <ShieldCheck className="h-4 w-4 text-gold mt-0.5" />
              We’ll only email you about Freelance & Gig Work updates.
            </div>

            <div className="pt-2 text-sm text-gray-300">
              Want to learn more first?{" "}
              <Link href="/freelance" className="text-gold hover:underline">
                Visit Freelance & Gig Work
              </Link>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
