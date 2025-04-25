import React, { useEffect, useState } from "react";

interface Payout {
  _id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateEmail: string;
  amount: number;
  payoutMethod: string;
  payoutDetails: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
}

export default function AffiliatePayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayouts = async () => {
      const res = await fetch("/api/admin/get-payouts");
      const data = await res.json();
      setPayouts(data.payouts || []);
      setLoading(false);
    };
    fetchPayouts();
  }, []);

  const handleComplete = async (payoutId: string) => {
    const res = await fetch("/api/admin/complete-payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutId }),
    });
    const data = await res.json();
    alert(data.message);
    // Refresh payout list
    setPayouts(payouts.map(p => p._id === payoutId ? { ...p, status: "completed", processedAt: new Date().toISOString() } : p));
  };

  return (
    <div className="min-h-screen bg-black text-white p-10">
      <h1 className="text-3xl font-bold text-gold mb-6">Affiliate Payout Requests</h1>
      {loading ? (
        <p>Loading...</p>
      ) : payouts.length === 0 ? (
        <p>No payout records found.</p>
      ) : (
        <table className="w-full border border-gray-700 text-sm">
          <thead>
            <tr className="text-left text-gold border-b border-gray-700">
              <th className="p-3">Affiliate</th>
              <th className="p-3">Email</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Method</th>
              <th className="p-3">Details</th>
              <th className="p-3">Status</th>
              <th className="p-3">Requested</th>
              <th className="p-3">Completed</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map(payout => (
              <tr key={payout._id} className="border-b border-gray-800">
                <td className="p-3">{payout.affiliateName}</td>
                <td className="p-3">{payout.affiliateEmail}</td>
                <td className="p-3">${payout.amount}</td>
                <td className="p-3">{payout.payoutMethod}</td>
                <td className="p-3">{payout.payoutDetails}</td>
                <td className={`p-3 ${payout.status === "completed" ? "text-green-400" : "text-yellow-400"}`}>
                  {payout.status}
                </td>
                <td className="p-3">{new Date(payout.requestedAt).toLocaleString()}</td>
                <td className="p-3">
                  {payout.processedAt ? new Date(payout.processedAt).toLocaleString() : "—"}
                </td>
                <td className="p-3">
                  {payout.status === "pending" && (
                    <button
                      onClick={() => handleComplete(payout._id)}
                      className="bg-gold text-black px-3 py-1 rounded hover:bg-yellow-400"
                    >
                      Mark Completed
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
