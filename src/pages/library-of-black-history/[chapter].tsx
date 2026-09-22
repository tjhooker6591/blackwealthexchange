import type { GetStaticPaths, GetStaticProps } from "next";
import { HistoryChapterPage } from "@/components/history/black-history-ui";
import { chapterCards, chapterLookup } from "@/lib/black-history-foundations";

interface ChapterRouteProps {
  chapterSlug: string;
}

export const getStaticPaths: GetStaticPaths = async () => ({
  paths: chapterCards.map((chapter) => ({
    params: { chapter: chapter.slug },
  })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<ChapterRouteProps> = async ({
  params,
}) => ({
  props: {
    chapterSlug: String(params?.chapter),
  },
});

export default function BlackHistoryChapterRoute({
  chapterSlug,
}: ChapterRouteProps) {
  const chapter = chapterLookup[chapterSlug];

  return <HistoryChapterPage chapter={chapter} />;
}
