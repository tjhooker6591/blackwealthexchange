import { GetServerSideProps } from "next";
import React from "react";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  buildObjectIdOrStringFilter,
  parseSessionIdentity,
  resolvePrimaryVerifiedBusinessOwnership,
  resolveVerifiedOwnership,
} from "@/lib/directoryOwnership";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";
import BusinessProfileContent from "@/components/business/BusinessProfileContent";

interface Props {
  business: ReturnType<typeof mapDirectoryProfileFromDoc> | null;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
  query,
}) => {
  const session = parseSessionIdentity(req as any);
  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const requestedBusinessId = String(query.businessId || query.id || "").trim();

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const ownership = requestedBusinessId
    ? await resolveVerifiedOwnership(db, {
        entityType: "business",
        entityId: requestedBusinessId,
        userId: session.userId,
      })
    : await resolvePrimaryVerifiedBusinessOwnership(db, session.userId);

  if (!ownership) {
    return { props: { business: null } };
  }

  const doc = await db.collection("businesses").findOne(
    buildObjectIdOrStringFilter("_id", ownership.entityId) || {
      _id: ownership.entityId as any,
    },
  );

  if (!doc) return { props: { business: null } };
  const business = JSON.parse(
    JSON.stringify(mapDirectoryProfileFromDoc(doc)),
  ) as ReturnType<typeof mapDirectoryProfileFromDoc>;
  return { props: { business } };
};

export default function BusinessProfile({ business }: Props) {
  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <h1 className="mb-6 text-3xl font-bold text-gold">Business Profile</h1>
      {business ? (
        <BusinessProfileContent
          business={business}
          mode="owner"
          showPrivateContactEmail
          editHref={
            business.id
              ? `/edit-business?businessId=${encodeURIComponent(business.id)}`
              : "/edit-business"
          }
        />
      ) : (
        <div className="max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold text-white">
            No verified managed business profile available
          </h2>
          <p className="mt-3 text-sm text-white/80">
            This account does not currently have an active verified business
            management relationship. If you expected access here, finish the
            business verification flow or contact support.
          </p>
        </div>
      )}
    </div>
  );
}
