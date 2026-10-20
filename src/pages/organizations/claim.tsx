// src/pages/organizations/claim.tsx
//
// There is one claim page for every listing (business, church or
// organization): /founding-membership. This address forwards there with the
// organization selected, so links already shared keep working.

import type { GetServerSideProps } from "next";

export default function OrganizationClaimRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const id =
    typeof query.organizationId === "string" ? query.organizationId.trim() : "";
  return {
    redirect: {
      destination: id
        ? `/founding-membership?organizationId=${encodeURIComponent(id)}`
        : "/founding-membership",
      permanent: false,
    },
  };
};
