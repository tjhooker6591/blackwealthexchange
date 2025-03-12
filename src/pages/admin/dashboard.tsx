import React, { useEffect, useState } from "react";
import Link from "next/link";

const AdminDashboard = () => {
  const [businesses, setBusinesses] = useState<any[]>([]); // To hold the list of businesses
  const [loading, setLoading] = useState(true);

  // Fetch pending businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      const response = await fetch("/api/admin/getPendingBusinesses");
      const data = await response.json();
      setBusinesses(data);
      setLoading(false);
    };

    fetchBusinesses();
  }, []);

  // Handle approval of business
  const handleApprove = async (id: string) => {
    const response = await fetch(`/api/admin/approveBusiness/${id}`, {
      method: "PUT",
    });

    if (response.ok) {
      setBusinesses(businesses.filter((business) => business._id !== id)); // Remove the approved business from the list
    }
  };

  // Handle rejection of business
  const handleReject = async (id: string) => {
    const response = await fetch(`/api/admin/rejectBusiness/${id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      setBusinesses(businesses.filter((business) => business._id !== id)); // Remove the rejected business from the list
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <header className="hero bg-gray-800 p-20 text-center shadow-md">
        <h1 className="text-4xl font-bold text-gold">Admin Dashboard</h1>
        <p className="text-lg mt-2 text-gray-300">
          Manage Business Verifications
        </p>
      </header>

      <div className="container mx-auto p-6">
        {loading ? (
          <p>Loading...</p>
        ) : businesses.length > 0 ? (
          <div className="grid gap-6">
            {businesses.map((business) => (
              <div
                key={business._id}
                className="bg-gray-700 p-4 rounded shadow-md border border-gray-600"
              >
                <h3 className="text-lg font-semibold">
                  {business.businessName}
                </h3>
                <p>{business.email}</p>
                <p>{business.address}</p>
                <div className="mt-4">
                  <button
                    onClick={() => handleApprove(business._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(business._id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 ml-4"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No pending businesses.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
