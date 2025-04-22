// src/pages/events/index.tsx
import Head from "next/head";
import React from "react";

interface Event {
  date: string;
  title: string;
  description: string[];
}

const events: Event[] = [
  {
    date: "May 31, 2025",
    title: "Black Wealth Exchange Official Launch",
    description: [
      "Live demos of our marketplace, business directory, and learning modules.",
      "Keynote sessions from industry experts on economic empowerment.",
      "Exclusive launch-day promotions and networking opportunities.",
    ],
  },
  {
    date: "April 9, 2025, 1:00 PM - 2:00 PM CST",
    title:
      "Sip Juice & Color History - Kids Online Black History Painting Party",
    description: [
      "FREE online event empowering kids through art and history.",
      "Interactive painting session with live discussion of Black history.",
      "Hosted by Sip Juice & Color History.", // ([tockify.com](https://tockify.com/afrobizusa/detail/887/1744218000000?tags=Black-History-Painting-Party&utm_source=chatgpt.com))
    ],
  },
  {
    date: "July 18-20, 2025, 10:00 AM - 8:00 PM",
    title: "African World Festival",
    description: [
      "Three-day celebration of music, dance, art, and food at Hart Plaza in Detroit.",
      "World-class musical acts and storytelling sessions.",
      "Family activities and an African Marketplace.", // ([thewright.org](https://www.thewright.org/africanworldfestival?utm_source=chatgpt.com))
    ],
  },
  {
    date: "June 30, 2025",
    title: "BWE Quarterly Webinar: Building Generational Wealth",
    description: [
      "Panel discussion with leaders from top Black-owned firms.",
      "Interactive Q&A on long-term wealth strategies.",
    ],
  },
  {
    date: "September 30, 2025",
    title: "Quarterly Webinar: Leveraging Technology for Growth",
    description: [
      "Showcases of Black tech innovators with live demos.",
      "Workshops on digital tools to scale businesses.",
    ],
  },
  {
    date: "July 4-7, 2025",
    title: "Essence Festival",
    description: [
      "Cultural celebrations, workshops, and live performances.",
      "Networking with community leaders and changemakers.",
    ],
  },
  {
    date: "October 15-17, 2025",
    title: "AfroTech Conference",
    description: [
      "Conference for Black professionals in technology.",
      "Keynotes, panels, and startup pitch competitions.",
    ],
  },
  {
    date: "September 2025 (TBD)",
    title:
      '"Black Wealth Exchange Blueprint Conference", ATL Launch - Unapologetic In Vision: Atlanta, GA',
    description: [
      "One-day immersive workshops on strategy, finance, and marketing.",
      "Networking sessions with entrepreneurs and investors.",
      "Keynote address on Black economic development.",
    ],
  },
];

export default function EventsPage() {
  return (
    <>
      <Head>
        <title>Events | Black Wealth Exchange</title>
      </Head>

      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-5xl font-extrabold text-gold mb-10 text-center">
          Black Wealth Exchange Events
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {events.map((evt) => (
            <div
              key={evt.date + evt.title}
              className="bg-gray-800 border-l-4 border-gold rounded-xl p-6 shadow-lg hover:shadow-2xl transition-shadow"
            >
              <div className="text-gold text-sm font-semibold mb-2">
                {evt.date}
              </div>
              <h2 className="text-2xl font-bold mb-3">{evt.title}</h2>
              {evt.description.map((line, i) => (
                <p key={i} className="text-gray-300 mb-1">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-400 italic">
            Join us quarterly for impactful webinars, and stay tuned for more
            community spotlights and exclusive gatherings worldwide.
          </p>
        </div>
      </div>
    </>
  );
}
