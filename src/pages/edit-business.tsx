"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

interface BusinessProfile {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  description: string;
}

interface InputProps {
  label: string;
  name: keyof BusinessProfile;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

interface TextAreaProps {
  label: string;
  name: keyof BusinessProfile;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
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
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (!data.user || data.user.accountType !== "business") {
          router.push("/login?redirect=/edit-business");
          return;
        }

        const profileRes = await fetch(
          `/api/business/profile?email=${data.user.email}`,
        );
        const profile = await profileRes.json();

        setBusiness(profile.business || {});
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

  if (loading)
    return <div className="text-white p-6">Loading business info...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-yellow-500 mb-6">
        Edit Business Profile
      </h1>
      {message && <p className="text-green-400 mb-4">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Business Name"
          name="businessName"
          value={business.businessName}
          onChange={handleChange}
        />
        <Input
          label="Business Address"
          name="businessAddress"
          value={business.businessAddress}
          onChange={handleChange}
        />
        <Input
          label="Business Phone"
          name="businessPhone"
          value={business.businessPhone}
          onChange={handleChange}
        />
        <TextArea
          label="Description"
          name="description"
          value={business.description}
          onChange={handleChange}
        />
        <button
          type="submit"
          disabled={saving}
          className="bg-yellow-500 text-black font-semibold px-4 py-2 rounded hover:bg-yellow-400 transition"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

function Input({ label, name, value, onChange }: InputProps) {
  return (
    <div>
      <label htmlFor={name} className="block mb-1 font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
      />
    </div>
  );
}

function TextArea({ label, name, value, onChange }: TextAreaProps) {
  return (
    <div>
      <label htmlFor={name} className="block mb-1 font-semibold">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-600"
        rows={4}
      />
    </div>
  );
}
