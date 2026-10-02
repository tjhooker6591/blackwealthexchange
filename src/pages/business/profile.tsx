import { GetServerSideProps } from "next";
import React from "react";
import Link from "next/link";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import {
  buildObjectIdOrStringFilter,
  listVerifiedBusinessOwnerships,
  parseSessionIdentity,
  resolveVerifiedOwnership,
} from "@/lib/directoryOwnership";
import { mapDirectoryProfileFromDoc } from "@/lib/directoryProfileContract";
import BusinessProfileContent from "@/components/business/BusinessProfileContent";

interface OwnedBusinessSummary {
  id: string;
  name: string;
}

interface Props {
  business: ReturnType<typeof mapDirectoryProfileFromDoc> | null;
  ownedBusinesses: OwnedBusinessSummary[];
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

  // Every business this account owns -- lets an owner with more than one
  // claimed business switch between them instead of only ever seeing
  // whichever one happens to resolve first.
  const ownerships = await listVerifiedBusinessOwnerships(db, session.userId);
  const ownedDocs = ownerships.length
    ? await db
        .collection("businesses")
        .find(
          {
            $or: ownerships
              .map((o) => buildObjectIdOrStringFilter("_id", o.entityId))
              .filter(Boolean) as any[],
          },
          { projection: { business_name: 1, businessName: 1, name: 1 } },
        )
        .toArray()
    : [];
  const ownedBusinesses: OwnedBusinessSummary[] = ownerships
    .map((o) => {
      const doc = ownedDocs.find((d) => String(d._id) === o.entityId);
      return {
        id: o.entityId,
        name:
          (doc as any)?.business_name ||
          (doc as any)?.businessName ||
          (doc as any)?.name ||
          "Business",
      };
    })
    .filter((b) => Boolean(b.id));

  const ownership = requestedBusinessId
    ? await resolveVerifiedOwnership(db, {
        entityType: "business",
        entityId: requestedBusinessId,
        userId: session.userId,
      })
    : ownerships[0] || null;

  if (!ownership) {
    return { props: { business: null, ownedBusinesses } };
  }

  const doc = await db.collection("businesses").findOne(
    buildObjectIdOrStringFilter("_id", ownership.entityId) || {
      _id: ownership.entityId as any,
    },
  );

  if (!doc) return { props: { business: null, ownedBusinesses } };
  const business = JSON.parse(
    JSON.stringify(mapDirectoryProfileFromDoc(doc)),
  ) as ReturnType<typeof mapDirectoryProfileFromDoc>;
  return { props: { business, ownedBusinesses } };
};

export default function BusinessProfile({ business, ownedBusinesses }: Props) {
  return (
    <div className="bwe-app-shell">
      <div className="bwe-section-wrap py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="bwe-eyebrow">Business Profile</div>
            <h1 className="bwe-display-title mt-2 text-3xl sm:text-4xl">
              {business?.displayName || "Your business"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/founding-membership/status"
              className="rounded-full border border-yellow-500/40 px-4 py-2 text-sm font-semibold text-yellow-300 transition hover:bg-yellow-500/10"
            >
              Membership &amp; report
            </Link>
            <Link
              href="/dashboard"
              className="bwe-soft-tile px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/10"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {ownedBusinesses.length > 1 ? (
          <div className="mb-6 flex flex-wrap gap-2">
            {ownedBusinesses.map((b) => (
              <Link
                key={b.id}
                href={`/business/profile?businessId=${encodeURIComponent(b.id)}`}
                className={
                  business?.id === b.id
                    ? "rounded-full bg-[var(--accent)] px-4 py-1.5 text-sm font-bold text-[var(--accent-ink)]"
                    : "bwe-soft-tile px-4 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                }
              >
                {b.name}
              </Link>
            ))}
          </div>
        ) : null}

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
          <div className="bwe-shell-panel max-w-2xl rounded-3xl p-6">
            <h2 className="bwe-card-title">
              No verified managed business profile available
            </h2>
            <p className="bwe-supporting-copy mt-3">
              This account does not currently have an active verified business
              management relationship. If you expected access here, finish the
              business verification flow or contact support.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
