export interface IndustryNews {
  id: number;
  slug: string; // URL slug, e.g. "vc-funding-record-high"
  title: string; // headline
  summary: string; // one-sentence teaser
  content: string; // full HTML (or MDX) for the article body
}

export const industryNewsData: IndustryNews[] = [
  {
    id: 1,
    slug: "vc-funding-record-high",
    title: "VC funding for Black entrepreneurs hits record high",
    summary:
      "Latest Q1 data shows Black-led startups secured $500 million in venture funds.",
    content: `
        <p>
          A new Q1 2025 report from Crunchbase and PitchBook data reveals that
          Black-founded startups pulled in a record <strong>$500 million</strong>
          in total venture funding—a 28% increase over Q1 2024. This surge was
          driven by 18 equity rounds across fintech, healthtech, and climate-tech
          sectors.
        </p>
        <h2>Key Highlights</h2>
        <ul>
          <li>18 Black-founded companies closed funding rounds in Q1 2025.</li>
          <li>
            Average round size grew to <strong>$27.8 million</strong>, up from
            $21.7 million in Q1 2024.
          </li>
          <li>
            Top geographies: California (7 deals), New York (5 deals), and
            Georgia (3 deals).
          </li>
        </ul>
        <p>
          Investors attribute this momentum to a growing emphasis on DEI
          initiatives and a handful of outsized Series A and B rounds that
          captured attention across the ecosystem.
        </p>
      `,
  },
  {
    id: 2,
    slug: "community-banks-support-program",
    title: "Community banks expand support program",
    summary:
      "Black-owned banks launch new small-business grants across four states.",
    content: `
        <p>
          In May 2025, four Black-owned community banks in Georgia, Texas,
          Illinois, and Michigan jointly announced a <strong>$200 000</strong>
          grant program for local small businesses. Each bank will award four
          $50 000 grants to eligible entrepreneurs, with applications open from
          June 1 through June 30.
        </p>
        <h2>Program Details</h2>
        <ul>
          <li>
            <strong>Grant size:</strong> $50 000 per award (4 awards per bank)
          </li>
          <li>
            <strong>Eligibility:</strong> Black-owned businesses with annual
            revenue under $500 000
          </li>
          <li>
            <strong>Application window:</strong> June 1 – June 30, 2025
          </li>
        </ul>
        <p>
          Bank presidents say this initiative is designed to “fill a capital
          gap” and spur growth in communities that have historically faced
          lending challenges.
        </p>
      `,
  },
  // → Add more entries here over time!
];
