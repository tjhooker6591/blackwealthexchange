import type { GetServerSideProps } from "next";
import { parseSessionIdentity } from "@/lib/directoryOwnership";

// This page has no real functionality of its own yet -- the actual
// business-management surfaces are /business/profile (ownership-aware hub),
// /edit-business (profile editing), and /founding-membership/status
// (membership/report status). Redirecting to /business/profile, which
// resolves the signed-in user's verified business on its own and shows an
// honest "not verified yet" state rather than a placeholder if there isn't
// one -- not gated on accountType === "business" here, since a verified
// founding member's account can carry accountType "user" (ownership is
// tracked separately, in business_claims/businesses, not the account role).
export default function BusinessDashboardRedirect() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const session = parseSessionIdentity(ctx.req as any);
  if (!session) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent("/business/profile")}`,
        permanent: false,
      },
    };
  }
  return { redirect: { destination: "/business/profile", permanent: false } };
};
