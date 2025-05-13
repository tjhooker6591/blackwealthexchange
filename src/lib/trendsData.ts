export interface Trend {
  id: number;
  slug: string;
  title: string;
  summary: string;
  body: string; // full article text for the detail page
}

export const trendsData: Trend[] = [
  {
    id: 1,
    slug: "vc-funding-record-high",
    title: "VC Funding for Black Entrepreneurs Hits Record High",
    summary: "Latest Q1 data shows Black-led startups secured $500 M.",
    body: `
  **Key numbers**
  
  - Q1-2025: \$500 million raised, up 41 % YoY  
  - Seed rounds averaged \$2.3 M vs \$1.6 M in 2024
  
  **Why it matters**
  
  Investors are—…
  `,
  },
  {
    id: 2,
    slug: "community-banks-grants",
    title: "Community Banks Expand Support Programs",
    summary:
      "Black-owned banks launch new small-business grants across four states.",
    body: `
  Eight community institutions announced \$25 M in grant pools…
  `,
  },
];
