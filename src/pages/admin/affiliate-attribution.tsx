import { useEffect, useState } from "react";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "@/lib/env";

type ClickRow = {
  _id: string;
  affiliateId: string;
  affiliateName: string | null;
  affiliateEmail: string | null;
  clickedAt: string | null;
};

type ConversionRow = {
  _id: string;
  affiliateId: string;
  affiliateName: string | null;
  affiliateEmail: string | null;
  amount: number;
  commission: number;
  convertedAt: string | null;
};

export default function AffiliateAttributionAdminPage() {
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [conversions, setConversions] = useState<ConversionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/affiliate-attribution", {
          credentials: "include",
          cache: "no-store",
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || "Failed to load data");
        setClicks(Array.isArray(data?.clicks) ? data.clicks : []);
        setConversions(
          Array.isArray(data?.conversions) ? data.conversions : [],
        );
      } catch (e: any) {
        setError(e?.message || "Failed to load attribution data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-[#D4AF37]">
              Affiliate Attribution
            </h1>
            <p className="mt-1 text-sm text-white/70">
              Monitor affiliate click and conversion activity in one admin view.
            </p>
          </div>
          <Link
            href="/admin/dashboard"
            className="text-sm text-[#D4AF37] hover:underline"
          >
            Back to Admin Dashboard
          </Link>
        </div>

        {loading ? <p className="text-white/70">Loading…</p> : null}
        {error ? <p className="text-red-400">{error}</p> : null}

        {!loading && !error ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-lg font-bold text-[#D4AF37]">
                Recent Clicks
              </h2>
              <div className="mt-3 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-white/60">
                    <tr>
                      <th className="p-2">Affiliate</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Clicked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clicks.length === 0 ? (
                      <tr>
                        <td className="p-2 text-white/60" colSpan={3}>
                          No click data yet.
                        </td>
                      </tr>
                    ) : (
                      clicks.map((r) => (
                        <tr key={r._id} className="border-t border-white/10">
                          <td className="p-2">
                            {r.affiliateName || r.affiliateId}
                          </td>
                          <td className="p-2">{r.affiliateEmail || "-"}</td>
                          <td className="p-2">
                            {r.clickedAt
                              ? new Date(r.clickedAt).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h2 className="text-lg font-bold text-[#D4AF37]">
                Recent Conversions
              </h2>
              <div className="mt-3 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-white/60">
                    <tr>
                      <th className="p-2">Affiliate</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Commission</th>
                      <th className="p-2">Converted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conversions.length === 0 ? (
                      <tr>
                        <td className="p-2 text-white/60" colSpan={4}>
                          No conversion data yet.
                        </td>
                      </tr>
                    ) : (
                      conversions.map((r) => (
                        <tr key={r._id} className="border-t border-white/10">
                          <td className="p-2">
                            {r.affiliateName || r.affiliateId}
                          </td>
                          <td className="p-2">
                            ${Number(r.amount || 0).toFixed(2)}
                          </td>
                          <td className="p-2">
                            ${Number(r.commission || 0).toFixed(2)}
                          </td>
                          <td className="p-2">
                            {r.convertedAt
                              ? new Date(r.convertedAt).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = cookies.session_token;

    if (!token) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/affiliate-attribution",
          permanent: false,
        },
      };
    }

    const payload = jwt.verify(token, getJwtSecret()) as {
      accountType?: string;
      role?: string;
      isAdmin?: boolean;
      roles?: string[];
    };

    const isAdmin =
      payload.isAdmin === true ||
      payload.accountType === "admin" ||
      payload.role === "admin" ||
      (Array.isArray(payload.roles) && payload.roles.includes("admin"));

    if (!isAdmin) {
      return {
        redirect: {
          destination: "/login?redirect=/admin/affiliate-attribution",
          permanent: false,
        },
      };
    }

    return { props: {} };
  } catch {
    return {
      redirect: {
        destination: "/login?redirect=/admin/affiliate-attribution",
        permanent: false,
      },
    };
  }
};
