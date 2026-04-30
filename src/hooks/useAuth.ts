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
        const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
        if (process.env.NODE_ENV !== "production") console.info(`[timing] auth/me ${Math.round(t1-t0)}ms status=${res.status}`);
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
  }, []);

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
