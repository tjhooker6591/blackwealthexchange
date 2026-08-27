import Link from "next/link";
import Head from "next/head";
import { useEffect, useState } from "react";
import { canonicalUrl, truncateMeta } from "@/lib/seo";
export default function My() {
  const [rows, setRows] = useState<any[]>([]);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(async (authRes) => {
        const authData = await authRes.json().catch(() => ({ user: null }));
        if (!authRes.ok || !authData?.user) {
          setErr("Login required");
          return;
        }
        return fetch("/api/support/my-tickets", { credentials: "include" });
      })
      .then(async (r) => {
        if (!r) return;
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          setErr(d.message || "Login required");
          return;
        }
        setRows(d.rows || []);
      })
      .catch(() => setErr("Login required"));
  }, []);
  if (err)
    return (
      <>
        <Head>
          <title>My Support Tickets | Black Wealth Exchange</title>
          <meta
            name="description"
            content={truncateMeta(
              "Review your Black Wealth Exchange support tickets and sign in when required to access your ticket history.",
            )}
          />
          <link rel="canonical" href={canonicalUrl("/support/tickets")} />
        </Head>
        <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
          <div className="absolute inset-0 bg-neutral-950" />
          <div className="pointer-events-none absolute -top-28 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />

          <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
            <section className="bwe-hero-panel rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
              <div className="bwe-eyebrow">Support tickets</div>
              <h1 className="bwe-display-title mt-3 max-w-[11ch]">
                Sign in to review your support history.
              </h1>
              <p className="bwe-lead mt-4 max-w-2xl">{err}</p>
              <div className="mt-5">
                <Link
                  href="/login"
                  className="bwe-cta-primary bwe-focus-ring px-6"
                >
                  Login
                </Link>
              </div>
            </section>
          </div>
        </main>
      </>
    );
  return (
    <>
      <Head>
        <title>My Support Tickets | Black Wealth Exchange</title>
        <meta
          name="description"
          content={truncateMeta(
            "Review your Black Wealth Exchange support ticket history, statuses, and ticket details in one place.",
          )}
        />
        <link rel="canonical" href={canonicalUrl("/support/tickets")} />
      </Head>
      <main className="relative min-h-screen overflow-x-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-neutral-950" />
        <div className="pointer-events-none absolute -top-28 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-[#D4AF37]/[0.06] blur-3xl" />

        <div className="bwe-section-wrap relative z-10 py-8 sm:py-10">
          <section className="bwe-hero-panel relative overflow-hidden rounded-[30px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_32%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.08),transparent_24%)]" />
            <div className="relative max-w-3xl">
              <div className="bwe-eyebrow">Support tickets</div>
              <h1 className="bwe-display-title mt-3 max-w-[10ch]">
                Review active tickets and follow-ups.
              </h1>
              <p className="bwe-lead mt-4 max-w-2xl">
                Keep your support history, statuses, and ticket detail links in
                one calmer support workspace.
              </p>
            </div>
          </section>

          <section className="mt-8 overflow-hidden rounded-[28px] border border-white/8 bg-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-left text-white/46">
                    <th className="px-4 py-3 font-medium">Ticket</th>
                    <th className="px-4 py-3 font-medium">Subject</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r: any) => (
                    <tr
                      key={r.ticketId}
                      className="border-t border-white/8 align-top"
                    >
                      <td className="px-4 py-3">
                        <Link
                          className="text-[var(--accent)] underline underline-offset-4"
                          href={`/support/tickets/${encodeURIComponent(r.ticketId)}`}
                        >
                          {r.ticketId}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-white/78">{r.subject}</td>
                      <td className="px-4 py-3 text-white/68">{r.status}</td>
                    </tr>
                  ))}
                  {rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center text-white/56"
                      >
                        No support tickets found yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
