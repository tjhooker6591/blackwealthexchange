import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/pricing", permanent: false },
});

export default function PriceRedirect() {
  return null;
}
