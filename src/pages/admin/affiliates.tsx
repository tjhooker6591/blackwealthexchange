import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

interface Affiliate {
  _id: string;
  name: string;
  email: string;
  status: string;
  clicks: number;
  conversions: number;
  lifetimeEarnings: number;
  rejectedAt?: string | null;
}

export default function AdminAffiliates() {
  const router = useRouter();
  const [pending, setPending] = useState<Affiliate[]>([]);
  const [active, setActive] = useState<Affiliate[]>([]);
  const [rejected, setRejected] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminAndFetch = async () => {
      const sessionRes = await fetch("/api/auth/me");
      const sessionData = await sessionRes.json();

      if (
        !sessionData.user ||
        sessionData.user.email !== "tjameshooker@gmail.com"
      ) {
        router.push("/"); // Redirect non-admins
        return;
      }

      const res = await fetch("/api/admin/affiliates/list");
      const data = await res.json();

      setPending(data.pending);
      setActive(data.active);
      setRejected(data.rejected);
      setLoading(false);
    };

    checkAdminAndFetch();
  }, [router]);

  const handleAction = async (id: string, action: "approve" | "reject") => {
    await fetch(`/api/admin/affiliates/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ affiliateId: id }),
    });
    refreshData();
  };

  const refreshData = async () => {
    const res = await fetch("/api/admin/affiliates/list");
    const data = await res.json();
    setPending(data.pending);
    setActive(data.active);
    setRejected(data.rejected);
  };

  return (
    <>
      <Head>
        <title>Admin | Manage Affiliates</title>
      </Head>
      <div className="min-h-screen bg-black text-white p-10">
        <h1 className="text-4xl font-bold text-gold mb-8">
          Affiliate Management
        </h1>

        {loading ? (
          <p>Loading affiliates...</p>
        ) : (
          <>
            {/* Pending Applications */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">
                Pending Applications
              </h2>
              {pending.length === 0 ? (
                <p>No pending applications.</p>
              ) : (
                pending.map((a) => (
                  <div
                    key={a._id}
                    className="bg-gray-800 p-4 mb-3 rounded flex justify-between items-center"
                  >
                    <div>
                      <p>
                        {a.name} ({a.email})
                      </p>
                    </div>
                    <div className="space-x-2">
                      <button
                        onClick={() => handleAction(a._id, "approve")}
                        className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-400"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(a._id, "reject")}
                        className="px-4 py-2 bg-red-500 text-black rounded hover:bg-red-400"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* Active Affiliates */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-4">Active Affiliates</h2>
              {active.length === 0 ? (
                <p>No active affiliates yet.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-gold border-b border-gray-700">
                      <th className="py-2">Name</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Clicks</th>
                      <th className="py-2">Conversions</th>
                      <th className="py-2">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {active.map((a) => (
                      <tr key={a._id} className="border-b border-gray-800">
                        <td className="py-2">{a.name}</td>
                        <td className="py-2">{a.email}</td>
                        <td className="py-2">{a.clicks}</td>
                        <td className="py-2">{a.conversions}</td>
                        <td className="py-2">
                          ${a.lifetimeEarnings.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            {/* Rejected Affiliates */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Rejected Affiliates
              </h2>
              {rejected.length === 0 ? (
                <p>No rejected affiliates.</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-gold border-b border-gray-700">
                      <th className="py-2">Name</th>
                      <th className="py-2">Email</th>
                      <th className="py-2">Rejected At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rejected.map((a) => (
                      <tr key={a._id} className="border-b border-gray-800">
                        <td className="py-2">{a.name}</td>
                        <td className="py-2">{a.email}</td>
                        <td className="py-2">
                          {a.rejectedAt
                            ? new Date(a.rejectedAt).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
