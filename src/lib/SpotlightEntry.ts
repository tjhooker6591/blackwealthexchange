// src/lib/SpotlightEntry.ts

export interface Spotlight {
  id: number;
  imageSrc: string;
  name: string;
  story: string;
  link: string; // e.g. "/business/coffee-cultures"
  slug: string; // e.g. "coffee-cultures"
  details?: string;
}

export const spotlightData: Spotlight[] = [
  {
    id: 1,
    imageSrc: "/images/spotlight1.jpg",
    name: "Coffee Culture Co.",
    story:
      "From seed to cup, this Black-owned coffee brand is redefining sustainable sourcing.",
    link: "/business/coffee-cultures",
    slug: "coffee-cultures",
    details: `
      <p>Founded in 2015, Coffee Culture Co. has partnered with farmers across Ethiopia, Kenya, and Colombia to ensure fair-trade at every step.</p>
      <p>Our Oakland roasting facility runs on solar power and recycles 95% of its water. We offer:</p>
      <ul>
        <li>Monthly single-origin coffee subscriptions</li>
        <li>Wholesale programs for cafés</li>
        <li>Barista workshops and community events</li>
      </ul>
    `,
  },
  {
    id: 2,
    imageSrc: "/images/spotlight2.jpg",
    name: "Fashion Innovator – Black Fashion Designers",
    story:
      "A collective powering inclusive fashion that uplifts communities and sets global trends.",
    link: "/business/fashion",
    slug: "fashion",
    details: `
      <p>Launched in 2020, this group brings together five designers of African descent.</p>
      <p>Highlights:</p>
      <ol>
        <li>Annual pop-up in Harlem</li>
        <li>Sustainably sourced fabrics from Ghana</li>
        <li>Virtual styling and lookbook drops</li>
      </ol>
    `,
  },
];
