import type { GetServerSideProps } from "next";

type Props = Record<string, never>;

export const getServerSideProps: GetServerSideProps<Props> = async ({
  query,
}) => {
  const businessId = String(query.businessId || query.id || "").trim();

  return {
    redirect: {
      destination: businessId
        ? `/edit-business?businessId=${encodeURIComponent(businessId)}`
        : "/business/profile",
      permanent: false,
    },
  };
};

export default function DashboardEditBusinessRedirect() {
  return null;
}
