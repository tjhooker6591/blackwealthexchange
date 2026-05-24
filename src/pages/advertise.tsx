import type { GetServerSideProps } from "next";

export default function AdvertiseRedirectPage() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/advertising",
      permanent: false,
    },
  };
};
