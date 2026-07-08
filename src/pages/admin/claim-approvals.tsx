import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: "/admin/claim-verification",
    permanent: false,
  },
});

export default function ClaimApprovalsRedirectPage() {
  return null;
}
