// src/pages/business/[slug].tsx

import { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Image from "next/image";
import ErrorPage from "next/error";
import { Spotlight, spotlightData } from "../../lib/SpotlightEntry";

interface Props {
  entry: Spotlight;
}

const BusinessDetail: NextPage<Props> = ({ entry }) => {
  if (!entry) {
    return <ErrorPage statusCode={404} />;
  }

  return (
    <main className="bg-gray-900 text-white min-h-screen">
      <section className="container mx-auto px-6 py-12 space-y-8">
        <h1 className="text-4xl font-extrabold text-gold">{entry.name}</h1>

        <div className="relative w-full h-80 rounded-2xl overflow-hidden shadow-xl">
          <Image
            src={entry.imageSrc}
            alt={entry.name}
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>

        <article className="prose prose-invert lg:prose-lg max-w-none">
          {/* short summary */}
          <p>{entry.story}</p>

          {/* longer details, if provided */}
          {entry.details && (
            <div
              className="mt-6"
              dangerouslySetInnerHTML={{ __html: entry.details }}
            />
          )}
        </article>
      </section>
    </main>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  const paths = spotlightData.map((item) => ({
    params: { slug: item.slug },
  }));

  console.log("getStaticPaths →", paths);
  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps: GetStaticProps<Props> = ({ params }) => {
  const slug = String(params?.slug);
  const entry = spotlightData.find((item) => item.slug === slug);

  console.log("getStaticProps slug:", slug, "→ entry:", entry?.name);
  if (!entry) {
    return { notFound: true };
  }

  return {
    props: { entry },
  };
};

export default BusinessDetail;
