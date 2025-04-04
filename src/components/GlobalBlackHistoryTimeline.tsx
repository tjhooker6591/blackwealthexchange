"use client";

import React from "react";
import { motion } from "framer-motion";

const timelineData = [
  {
    year: "Pre-1500s",
    title: "The Age of African Power",
    description:
      "Before colonization, African nations like Mali, Ghana, Songhai, and Great Zimbabwe were global powers—rich in gold, innovation, and culture. Timbuktu was a center of scholarship. Trade routes connected Africa to Asia, Europe, and the Middle East. Black excellence was not a dream—it was reality.",
  },
  {
    year: "1500s–1800s",
    title: "The Transatlantic Nightmare",
    description:
      "A global economy rises on the trafficking of African lives. Over 12 million are stolen—sent to plantations in the Americas and the Caribbean. Entire societies are destabilized. Wealth is extracted from African blood.",
  },
  {
    year: "1600s–1800s",
    title: "Colonialism and Economic Extraction",
    description:
      "Africa and the Caribbean are carved up. Colonizers seize land, strip resources, and rewrite histories. Cotton, sugar, gold, diamonds—all extracted by Black labor, none owned by Black people. The Caribbean becomes a plantation machine. Africa becomes a mine.",
  },
  {
    year: "1800s–1900s",
    title: "Resistance, Independence & Recolonization",
    description:
      "Haiti rises first—defeating Napoleon and declaring freedom in 1804. African leaders and Caribbean rebels resist colonial powers. Independence movements surge, but global powers impose debt and control through force and policy.",
  },
  {
    year: "1865–1930s",
    title: "Black Wealth in the Americas Rises—and Is Attacked",
    description:
      "In the U.S., post-slavery Black Wall Streets bloom: Tulsa, Durham, Rosewood. In the Caribbean and Latin America, Black communities build banks, papers, and schools. Across the diaspora, prosperity is punished through mob violence, state neglect, and systemic sabotage.",
  },
  {
    year: "1940s–1970s",
    title: "Post-Colonial Hopes and Global Suppression",
    description:
      "Nations gain formal independence. Leaders like Nkrumah and Lumumba preach Pan-Africanism and self-determination. But assassinations, coups, and foreign control sabotage sovereignty. The IMF and World Bank impose new chains through debt and austerity.",
  },
  {
    year: "1980s–2000s",
    title: "Displacement and Diaspora",
    description:
      "Migration rises—Africans, Caribbeans, and Afro-Latinx people seek opportunity in Europe, the U.S., and Canada. But racism travels too: policing, economic exclusion, and gentrification displace Black families around the world.",
  },
  {
    year: "2010s–2020s",
    title: "Awakening Without Access",
    description:
      "Movements like #BlackLivesMatter echo from Ferguson to Paris, Accra to São Paulo. The world hears our cries—but justice is uneven. Symbolism increases. Ownership and equity remain elusive. Visibility is not victory.",
  },
  {
    year: "2025",
    title: "The Rise of Black Wealth Exchange",
    description:
      "Not just an American platform. Not just an economic tool. A unifying force to rebuild what was denied. We begin by organizing in America—where fragmentation runs deep and healing is essential. But our reach extends across the diaspora. This is not a moment. This is the movement.",
  },
];

export default function GlobalBlackHistoryTimeline() {
  return (
    <div className="min-h-screen bg-black text-white px-4 py-20">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gold text-center mb-16">
        From Disruption to Destiny
      </h1>
      <div className="space-y-16 max-w-5xl mx-auto">
        {timelineData.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
            className="border-l-4 border-gold pl-6 relative"
          >
            <div className="absolute -left-3 top-1.5 w-4 h-4 bg-gold rounded-full"></div>
            <h2 className="text-2xl font-bold text-gold">{event.year}</h2>
            <h3 className="text-xl font-semibold mt-1">{event.title}</h3>
            <p className="text-gray-300 mt-2 max-w-3xl">{event.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
