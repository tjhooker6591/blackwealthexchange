import { GetServerSideProps, GetServerSidePropsContext } from "next";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { ObjectId } from "mongodb";
import { getCampaignById } from "@/lib/db/ads";

interface AdDetailPageProps {
  campaign: {
    _id: string;
    name: string;
    price: number;
    banner?: string | null;
    paid?: boolean;
    paidAt?: string | null;
    paymentIntentId?: string | null;
  };
}

export default function AdDetailPage({ campaign }: AdDetailPageProps) {
  const { query, replace } = useRouter();
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  // show payment notices
  useEffect(() => {
    if (query.status === "success") {
      setNotice("🎉 Payment successful! Your campaign is now live.");
    } else if (query.status === "cancelled") {
      setNotice("❌ Payment was cancelled. You can try again below.");
    }

    if (query.status) {
      // rename status to _status so ESLint knows it's intentionally unused
      const { status: _status, ...rest } = query;
      replace({ pathname: `/ads/${query.id}`, query: rest }, undefined, {
        shallow: true,
      });
    }
  }, [query, replace]);

  const handleBuy = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ads/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign._id }),
      });

      if (!res.ok) throw new Error("Failed to create checkout session");

      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    } catch (err: unknown) {
      console.error(err);
      setError("Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  // Always pass a safe string src to next/image (prevents startsWith crash)
  const imgSrc =
    typeof campaign?.banner === "string" && campaign.banner.trim().length > 0
      ? campaign.banner
      : "/default-image.jpg";

  return (
    <div className="max-w-xl mx-auto p-4">
      {notice && (
        <div className="bg-green-100 border border-green-400 text-green-800 p-4 rounded mb-6 text-center">
          {notice}
        </div>
      )}

      <h1 className="text-2xl font-bold mb-4">{campaign.name}</h1>

      <Image
        src={imgError ? "/default-image.jpg" : imgSrc}
        alt={campaign.name}
        width={800}
        height={400}
        onError={() => setImgError(true)}
        className="rounded mb-6"
      />

      <p className="text-lg mb-6">Price: ${campaign.price}</p>

      {campaign.paid ? (
        <span className="inline-block bg-yellow-300 text-black px-3 py-1 rounded-full font-semibold mb-4">
          ✅ Paid
          {campaign.paidAt
            ? ` on ${new Date(campaign.paidAt).toLocaleString()}`
            : ""}
        </span>
      ) : (
        <div className="space-y-2">
          <button
            onClick={handleBuy}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            {loading ? "Redirecting…" : "Pay & Launch Campaign"}
          </button>
          {error && <p className="text-red-600 mt-2">{error}</p>}
        </div>
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps<AdDetailPageProps> = async (
  context: GetServerSidePropsContext,
) => {
  const rawId = Array.isArray(context.params?.id)
    ? context.params.id[0]
    : context.params?.id;

  // 1) must have an id
  if (!rawId || typeof rawId !== "string") {
    return { notFound: true };
  }

  // 2) guard against invalid ObjectId
  if (!ObjectId.isValid(rawId)) {
    return { notFound: true };
  }

  // 3) fetch campaign
  const campaign = await getCampaignById(rawId);
  if (!campaign) {
    return { notFound: true };
  }

  // sanitize banner to a string (prevents next/image runtime startsWith crash)
  const banner =
    typeof (campaign as any).banner === "string"
      ? ((campaign as any).banner as string)
      : (campaign as any).banner?.url &&
          typeof (campaign as any).banner.url === "string"
        ? ((campaign as any).banner.url as string)
        : null;

  return {
    props: {
      campaign: {
        _id: campaign._id.toString(),
        name: campaign.name,
        price: campaign.price,
        banner,
        paid: campaign.paid ?? false,
        paidAt: campaign.paidAt?.toISOString() ?? null,
        paymentIntentId: campaign.paymentIntentId ?? null,
      },
    },
  };
};
