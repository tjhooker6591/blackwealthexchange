import { useEffect, useState } from "react";

type Business = {
  _id: string;
  businessName: string;
  ownerName?: string;
  submittedAt?: string;
};

const BusinessApprovals = () => {
  const [pendingBusinesses, setPendingBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch("/api/admin/get-pending-businesses");
        const data = await res.json();
        setPendingBusinesses(data.businesses);
      } catch (err) {
        console.error("Error fetching businesses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPending();
  }, []);

  const handleApprove = async (id: string) => {
    if (!confirm("Approve this business?")) return;
    try {
      const res = await fetch("/api/admin/approve-business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId: id }),
      });
      if (res.ok) {
        setPendingBusinesses(pendingBusinesses.filter(biz => biz._id !== id));
      } else {
        alert("Failed to approve business.");
      }
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl text-gold font-bold mb-6">Business Approvals</h1>

      {loading ? (
        <p>Loading pending businesses...</p>
      ) : pendingBusinesses.length === 0 ? (
        <p>No pending business approvals. 🎉</p>
      ) : (
        <table className="w-full text-left border border-gray-700">
          <thead>
            <tr>
              <th className="p-3 border-b border-gray-700">Business Name</th>
              <th className="p-3 border-b border-gray-700">Owner</th>
              <th className="p-3 border-b border-gray-700">Submitted</th>
              <th className="p-3 border-b border-gray-700">Action</th>
            </tr>
          </thead>
          <tbody>
            {pendingBusinesses.map((biz) => (
              <tr key={biz._id}>
                <td className="p-3">{biz.businessName}</td>
                <td className="p-3">{biz.ownerName || "N/A"}</td>
                <td className="p-3">
                  {biz.submittedAt
                    ? new Date(biz.submittedAt).toLocaleDateString()
                    : "Unknown"}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => handleApprove(biz._id)}
                    className="bg-green-600 px-3 py-1 rounded mr-2 hover:bg-green-500 transition"
                  >
                    Approve
                  </button>
                  <button
                    className="bg-red-600 px-3 py-1 rounded hover:bg-red-500 transition"
                    disabled
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default BusinessApprovals;
