// src/pages/ads/[id].tsx

import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { useState } from "react";
import { getCampaignById } from "@/lib/db/ads";

interface AdDetailPageProps {
  campaign: {
    _id: string;
    name: string;
    price: number;
    paid?: boolean;
    paidAt?: string | null;
    paymentIntentId?: string | null;
  };
}

export default function AdDetailPage({ campaign }: AdDetailPageProps) {
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ads/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign._id }),
      });
      if (!res.ok) {
        console.error("Failed to create checkout session");
        setLoading(false);
        return;
      }
      const { url } = await res.json();
      // we can use window.location or Next's router.push if you prefer:
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{campaign.name}</h1>
      <p className="text-lg mb-6">Price: ${campaign.price}</p>
      <button
        onClick={handleBuy}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        {loading ? "Redirecting…" : "Pay & Launch Campaign"}
      </button>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<AdDetailPageProps> =
  async (context: GetServerSidePropsContext) => {
    const id = Array.isArray(context.params?.id)
      ? context.params.id[0]
      : context.params?.id;

    if (!id) {
      return { notFound: true };
    }

    const campaign = await getCampaignById(id);
    if (!campaign) {
      return { notFound: true };
    }

    return {
      props: {
        campaign: {
          _id: campaign._id.toString(),
          name: campaign.name,
          price: campaign.price,
          paid: campaign.paid ?? false,
          paidAt: campaign.paidAt?.toISOString() ?? null,
          paymentIntentId: campaign.paymentIntentId ?? null,
        },
      },
    };
  };
