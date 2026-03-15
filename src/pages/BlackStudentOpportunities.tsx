import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: "/black-student-opportunities",
      permanent: true,
    },
  };
};

export default function LegacyBlackStudentOpportunitiesRedirect() {
  return null;
}
