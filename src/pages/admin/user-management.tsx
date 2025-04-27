import { useEffect, useState } from "react";

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/get-users");
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Failed to load users", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-3xl text-gold font-bold mb-6">
        User & Account Management
      </h1>
      {loading ? (
        <p>Loading users...</p>
      ) : users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        <table className="w-full text-left border border-gray-700">
          <thead>
            <tr>
              <th className="p-3 border-b border-gray-700">Name</th>
              <th className="p-3 border-b border-gray-700">Email</th>
              <th className="p-3 border-b border-gray-700">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td className="p-3">{user.name || "N/A"}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3">{user.accountType || "User"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagement;
