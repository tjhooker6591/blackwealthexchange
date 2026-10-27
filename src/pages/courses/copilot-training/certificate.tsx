import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { aiProductivityCourse as course } from "@/lib/courses/aiProductivity";
import {
  getDb,
  getProgress,
  resolveAiCourseAccess,
} from "@/lib/courses/aiProductivity/server";

const PATH = "/courses/copilot-training";

type Props = { name: string; completedOn: string };

export default function CertificatePage({ name, completedOn }: Props) {
  return (
    <>
      <Head>
        <title>Certificate | Copilot Training for Business</title>
        <meta name="robots" content="noindex" />
        <style>{`@media print { nav, header, footer, .no-print { display: none !important; } body { background: #fff !important; } }`}</style>
      </Head>
      <main className="min-h-screen bg-neutral-950 px-4 py-8 text-white print:bg-white print:p-0">
        <div className="no-print mx-auto mb-4 flex max-w-3xl flex-wrap justify-between gap-3">
          <Link
            href={PATH}
            className="bwe-open-link bwe-focus-ring text-sm text-white/75"
          >
            Back to the course
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="bwe-cta-secondary bwe-focus-ring px-5"
          >
            Print or save as PDF
          </button>
        </div>

        <section className="mx-auto max-w-3xl rounded-[28px] border-2 border-[#D4AF37]/70 bg-neutral-900 px-6 py-12 text-center sm:px-12 print:border-[#B8962E] print:bg-white print:text-black">
          <div className="text-xs uppercase tracking-[0.3em] text-[#D4AF37]">
            Black Wealth Exchange
          </div>
          <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
            Certificate of Completion
          </h1>
          <p className="mt-6 text-sm text-white/60 print:text-black/60">
            This certifies that
          </p>
          <p className="mt-2 break-words text-3xl font-semibold text-[#E8CF7A] sm:text-4xl print:text-black">
            {name}
          </p>
          <p className="mt-6 text-sm text-white/60 print:text-black/60">
            has completed
          </p>
          <p className="mt-2 text-xl font-semibold">{course.title}</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-white/60 print:text-black/60">
            12 lessons with knowledge checks and a submitted 30-day AI action
            plan.
          </p>
          <p className="mt-8 text-sm text-white/70 print:text-black/70">
            Completed {completedOn}
          </p>
          <p className="mx-auto mt-8 max-w-md text-[11px] text-white/40 print:text-black/50">
            Certificate of course completion issued by Black Wealth Exchange.
            Not an accredited credential and not affiliated with Microsoft.
          </p>
        </section>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({
  req,
  res,
}) => {
  res.setHeader("Cache-Control", "private, no-store");
  const db = await getDb();
  const access = await resolveAiCourseAccess(req, db);
  if (!access.authenticated) {
    return {
      redirect: {
        destination: `/login?redirect=${encodeURIComponent(`${PATH}/certificate`)}`,
        permanent: false,
      },
    };
  }
  if (!access.hasAccess || !access.userId) {
    return { redirect: { destination: PATH, permanent: false } };
  }
  const progress = await getProgress(db, access.userId);
  if (!progress.completedAt)
    return { redirect: { destination: PATH, permanent: false } };

  const completedOn = new Date(progress.completedAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/New_York",
    },
  );
  return {
    props: {
      name: access.name || access.email || "Course graduate",
      completedOn,
    },
  };
};
