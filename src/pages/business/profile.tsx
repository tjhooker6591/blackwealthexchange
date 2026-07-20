import { GetServerSideProps } from "next";
import React from "react";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  buildObjectIdOrStringFilter,
  parseSessionIdentity,
  resolveVerifiedOwnership,
} from "@/lib/directoryOwnership";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";
import BusinessProfileContent from "@/components/business/BusinessProfileContent";

interface Props {
  business: ReturnType<typeof mapDirectoryProfileFromDoc>;
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
}) => {
  const session = parseSessionIdentity(req as any);
  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const client = await clientPromise;
  const db = client.db(getMongoDbName());
  const ownershipLinks = await db
    .collection("businesses")
    .find(
      {
        $or: [
          { claimedByUserId: session.userId },
          { managedByUserId: session.userId },
          { ownerUserIds: session.userId },
        ],
      },
      { projection: { _id: 1 } },
    )
    .toArray();

  let ownership = null;
  for (const candidate of ownershipLinks) {
    ownership = await resolveVerifiedOwnership(db, {
      entityType: "business",
      entityId: String(candidate._id),
      userId: session.userId,
    });
    if (ownership) break;
  }

  if (!ownership) {
    return { notFound: true };
  }

  const doc = await db.collection("businesses").findOne(
    buildObjectIdOrStringFilter("_id", ownership.entityId) || {
      _id: ownership.entityId as any,
    },
  );

  if (!doc) return { notFound: true };
  return { props: { business: mapDirectoryProfileFromDoc(doc) } };
};

export default function BusinessProfile({ business }: Props) {
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold text-gold mb-6">Business Profile</h1>
      <BusinessProfileContent
        business={business}
        mode="owner"
        showPrivateContactEmail
        editHref={`/edit-business?businessId=${encodeURIComponent(business.id)}`}
      />
    </div>
  );
}
