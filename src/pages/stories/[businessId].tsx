// src/pages/stories/[businessId].tsx
//
// Public display of a business's approved-and-published customer stories.
// Only ever fetches from /api/stories/[businessId], which only ever
// returns state: "published" content.

import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

export default function BusinessStoriesPage() {
  const router = useRouter();
  const { businessId } = router.query;
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady || typeof businessId !== "string") return;
    (async () => {
      try {
        const res = await fetch(`/api/stories/${businessId}`, {
          cache: "no-store",
        });
        const json = await res.json();
        setStories(json.ok ? json.stories : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [router.isReady, businessId]);

  return (
    <>
      <Head>
        <title>BWE Customer Stories</title>
      </Head>
      <div className="min-h-screen bg-black text-white px-4 py-10">
        <div className="max-w-2xl mx-auto space-y-6">
          <h1 className="text-2xl font-bold text-yellow-400">
            Customer stories
          </h1>
          {loading ? (
            <p className="text-sm text-zinc-500">Loading...</p>
          ) : stories.length ? (
            stories.map((story, i) => (
              <div
                key={i}
                className="rounded border border-zinc-800 bg-zinc-950 p-4 space-y-2 text-sm"
              >
                <p className="text-zinc-300">
                  During {story.content.period}, this business completed{" "}
                  {story.content.actionsTaken}. BWE recorded the outcomes:{" "}
                  {story.content.observedOutcomes}.
                  {story.content.salesFigureText
                    ? ` ${story.content.salesFigureText}`
                    : ""}
                  {story.content.comparisonText
                    ? ` ${story.content.comparisonText}`
                    : ""}
                </p>
                <p className="text-xs text-zinc-500">
                  Source: {story.content.sourceReferences}
                </p>
                <p className="text-xs text-zinc-600">
                  Limitations: {story.content.limitations}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-500">
              No published stories for this business yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
