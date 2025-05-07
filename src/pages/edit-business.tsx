// src/pages/edit-business.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface BusinessProfile {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  description: string;
}

export default function EditBusinessPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessProfile>({
    businessName: "",
    businessAddress: "",
    businessPhone: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        // Verify session
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.replace("/login?redirect=/edit-business");
          return;
        }
        const data = await res.json();
        if (!data.user || data.user.accountType !== "business") {
          router.replace("/login?redirect=/edit-business");
          return;
        }

        // Fetch existing business profile
        const profileRes = await fetch(
          `/api/business/profile?email=${encodeURIComponent(data.user.email)}`,
          { cache: "no-store", credentials: "include" },
        );
        if (profileRes.ok) {
          const payload = await profileRes.json();
          setBusiness(payload.business || payload);
        } else {
          console.error("Failed to load business profile");
        }
      } catch (err) {
        console.error("Error loading business info:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setBusiness({ ...business, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/business/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(business),
        credentials: "include",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Business profile updated successfully.");
      } else {
        setMessage(data.error || "Update failed.");
      }
    } catch (err) {
      console.error("Update error:", err);
      setMessage("An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6">
        Loading business info...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">
        Edit Business Profile
      </h1>
      {message && <p className="text-green-400 mb-4">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="businessName" className="block mb-1 font-semibold">
            Business Name
          </label>
          <input
            id="businessName"
            name="businessName"
            value={business.businessName}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            required
          />
        </div>

        <div>
          <label htmlFor="businessAddress" className="block mb-1 font-semibold">
            Business Address
          </label>
          <input
            id="businessAddress"
            name="businessAddress"
            value={business.businessAddress}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            required
          />
        </div>

        <div>
          <label htmlFor="businessPhone" className="block mb-1 font-semibold">
            Business Phone
          </label>
          <input
            id="businessPhone"
            name="businessPhone"
            value={business.businessPhone}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block mb-1 font-semibold">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={business.description}
            onChange={handleChange}
            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
            rows={4}
            required
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="bg-yellow-500 text-black font-semibold px-4 py-2 rounded hover:bg-yellow-400 transition disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
