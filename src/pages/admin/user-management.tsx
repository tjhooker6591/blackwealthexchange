import Head from "next/head";
import { useEffect, useState } from "react";

type UserRow = {
  _id: string;
  name?: string;
  email?: string;
  accountType?: string;
};

const UserManagement = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setError("");
        const res = await fetch("/api/admin/get-users", {
          cache: "no-store",
          credentials: "include",
        });
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            throw new Error("Admin access required to view user records.");
          }
          throw new Error(data?.error || "Failed to load users.");
        }

        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.users)
            ? data.users
            : [];
        setUsers(rows);
      } catch (err) {
        console.error("Failed to load users", err);
        setError(err instanceof Error ? err.message : "Failed to load users.");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <>
      <Head>
        <title>Admin User Management | Black Wealth Exchange</title>
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Head>
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl text-gold font-bold mb-2">
          User & Account Management
        </h1>
        <p className="mb-6 text-sm text-zinc-400">Total rows: {users.length}</p>
        {error ? (
          <div className="mb-4 rounded-lg border border-red-700/50 bg-red-950/40 p-3 text-sm text-red-100">
            {error}
          </div>
        ) : null}
        {loading ? (
          <p>Loading users...</p>
        ) : users.length === 0 ? (
          <p>No users found for this query.</p>
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
    </>
  );
};

export default UserManagement;
