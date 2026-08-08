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
        <main className="min-h-screen bg-black text-white p-8">
          <p>{err}</p>
          <Link href="/login" className="underline text-yellow-300">
            Login
          </Link>
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
      <main className="min-h-screen bg-black text-white p-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-yellow-400 mb-3">
            My Tickets
          </h1>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-zinc-400">
                <th className="p-2 text-left">Ticket</th>
                <th className="p-2 text-left">Subject</th>
                <th className="p-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.ticketId} className="border-t border-zinc-800">
                  <td className="p-2">
                    <Link
                      className="underline text-yellow-300"
                      href={`/support/tickets/${encodeURIComponent(r.ticketId)}`}
                    >
                      {r.ticketId}
                    </Link>
                  </td>
                  <td className="p-2">{r.subject}</td>
                  <td className="p-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
