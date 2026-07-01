import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: { destination: "/black-card", permanent: false },
});

export default function BlackCardRedirect() {
  return null;
}
