import { useEffect, useState } from "react";
import { useRouter } from "next/router";

type User = {
  _id: string;
  accountType: string;
  email?: string;
  // Add more fields as needed!
};

function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          setUser(data.user || null);
        }
      } catch {
        setUser(null);
      }
      setLoading(false);
    }
    fetchUser();
  }, [router.pathname]);

  // Logout function
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.replace("/login");
  };

  return { user, loading, logout };
}

// ✅ ONLY THIS EXPORT!
export default useAuth;
