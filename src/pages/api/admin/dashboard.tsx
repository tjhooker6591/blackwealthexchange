import { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [pendingBusinesses, setPendingBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch pending businesses when the component mounts
    axios.get("/api/admin/getPendingBusinesses")
      .then((response) => {
        setPendingBusinesses(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching pending businesses:", error);
        setLoading(false);
      });
  }, []);

  const handleApprove = (id: string) => {
    // Call approve business API
    axios.put(`/api/admin/approveBusiness/${id}`)
      .then(() => {
        alert("Business approved!");
        // Refetch businesses after approval
        setPendingBusinesses(pendingBusinesses.filter((business) => business._id !== id));
      })
      .catch((error) => {
        console.error("Error approving business:", error);
      });
  };

  const handleReject = (id: string) => {
    // Call reject business API
    axios.delete(`/api/admin/rejectBusiness/${id}`)
      .then(() => {
        alert("Business rejected!");
        // Refetch businesses after rejection
        setPendingBusinesses(pendingBusinesses.filter((business) => business._id !== id));
      })
      .catch((error) => {
        console.error("Error rejecting business:", error);
      });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="p-6 bg-gray-800 text-center">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-lg text-gray-300">Manage Pending Businesses</p>
      </header>

      <div className="container mx-auto p-6">
        {loading ? (
          <p>Loading pending businesses...</p>
        ) : pendingBusinesses.length > 0 ? (
          <div className="space-y-4">
            {pendingBusinesses.map((business) => (
              <div key={business._id} className="bg-gray-800 p-4 rounded-lg shadow-md flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">{business.businessName}</h2>
                  <p className="text-sm">{business.email}</p>
                  <p className="text-sm">{business.address}</p>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleApprove(business._id)}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(business._id)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No pending businesses to approve.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;