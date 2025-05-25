import { useEffect, useState } from "react";

export default function DirectoryApprovals() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/get-directory-listings")
      .then((res) => res.json())
      .then((data) => setListings(data))
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    await fetch("/api/admin/approve-directory-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id }),
    });
    window.location.reload();
  };

  const handleExpire = async (id: string) => {
    await fetch("/api/admin/expire-directory-listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId: id }),
    });
    window.location.reload();
  };

  if (loading) return <div className="p-8">Loading listings...</div>;

  return (
    <div className="bg-gray-900 min-h-screen text-white p-8">
      <h1 className="text-2xl text-gold font-bold mb-6">Directory Listings Approvals</h1>
      <table className="w-full text-sm mb-6">
        <thead>
          <tr className="text-gold border-b border-gray-700">
            <th>Name</th>
            <th>Status</th>
            <th>Paid</th>
            <th>Slot/Queue</th>
            <th>Expires</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <tr key={l._id} className="border-b border-gray-800">
              <td>{l.businessName}</td>
              <td>{l.status}</td>
              <td>{l.paid ? "Yes" : "No"}</td>
              <td>
                {l.featuredSlot
                  ? `Slot ${l.featuredSlot}`
                  : l.queuePosition
                  ? `Queue #${l.queuePosition}`
                  : ""}
              </td>
              <td>
                {l.featuredEndDate
                  ? new Date(l.featuredEndDate).toLocaleDateString()
                  : "-"}
              </td>
              <td>
                {l.status === "pending" && (
                  <button
                    className="bg-gold text-black px-2 py-1 rounded mr-2"
                    onClick={() => handleApprove(l._id)}
                  >
                    Approve
                  </button>
                )}
                {(l.featuredSlot || l.queuePosition) && (
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => handleExpire(l._id)}
                  >
                    Expire/Remove
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
