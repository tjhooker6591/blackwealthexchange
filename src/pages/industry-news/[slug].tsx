import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import ErrorPage from "next/error";
import { industryNewsData, IndustryNews } from "../../lib/IndustryNewsEntry";

interface Props {
  entry: IndustryNews;
}

const NewsDetail: NextPage<Props> = ({ entry }) => {
  if (!entry) return <ErrorPage statusCode={404} />;

  return (
    <>
      <Head>
        <title>{entry.title}</title>
      </Head>
      <main className="bg-gray-900 text-white min-h-screen">
        <section className="container mx-auto px-6 py-12 space-y-8">
          <nav className="text-gray-400">
            <Link href="/black-entertainment-news" className="hover:underline">
              ← Back to Industry News
            </Link>
          </nav>

          <h1 className="text-4xl font-extrabold text-gold">{entry.title}</h1>
          <p className="text-lg">{entry.summary}</p>

          <article
            className="prose prose-invert lg:prose-lg max-w-none mt-6"
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />
        </section>
      </main>
    </>
  );
};

export const getStaticPaths: GetStaticPaths = () => ({
  paths: industryNewsData.map((item) => ({
    params: { slug: item.slug },
  })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<Props> = ({ params }) => {
  const slug = String(params?.slug);
  const entry = industryNewsData.find((item) => item.slug === slug);

  if (!entry) {
    return { notFound: true };
  }

  return {
    props: { entry },
  };
};

export default NewsDetail;
