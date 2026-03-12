import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const publicRoot = path.join(repoRoot, "public");

const sponsors = [
  {
    name: "Pamfa United Citizen",
    preferred: "/images/pamfaunitedcitizen.webp",
    candidates: ["/ads/pamfa-united-ad.jpg", "/pamfa1.jpg", "/pamfa-shirt.jpg", "/pamfa-denim.jpg"],
  },
  {
    name: "TitanEra",
    preferred: "/images/titanera.webp",
    candidates: ["/ads/titanera-banner.jpg", "/titans.jpg"],
  },
  {
    name: "Thomas Hooker Author",
    preferred: "/images/thomashookerauthor.webp",
    candidates: [],
  },
  {
    name: "Thomas Hooker Publisher",
    preferred: "/images/thomashookerpublisher.webp",
    candidates: [],
  },
  {
    name: "Guardians of the Forgotten Realm",
    preferred: "/images/guardiansoftheforgottenrealm.webp",
    candidates: ["/Guardians.jpg"],
  },
  {
    name: "The Last Nephilim",
    preferred: "/images/thelastnephilim.webp",
    candidates: [],
  },
  {
    name: "Millianious",
    preferred: "/images/millianious.webp",
    candidates: [],
  },
  {
    name: "Tiana Song Sprouts",
    preferred: "/images/tianasongsprouts.webp",
    candidates: [],
  },
];

function fileExists(publicPath) {
  const abs = path.join(publicRoot, publicPath.replace(/^\//, ""));
  return fs.existsSync(abs);
}

export function getHouseSponsorImageMap() {
  const fallback = "/images/house-draft.jpg";

  const mapping = {};
  const resolution = [];

  for (const sponsor of sponsors) {
    const options = [sponsor.preferred, ...sponsor.candidates, fallback];
    const chosen = options.find((p) => fileExists(p)) || fallback;

    mapping[sponsor.name] = chosen;
    resolution.push({
      name: sponsor.name,
      preferred: sponsor.preferred,
      chosen,
      chosenExists: fileExists(chosen),
      usedFallback: chosen === fallback,
      availableCandidates: [sponsor.preferred, ...sponsor.candidates].filter((p) => fileExists(p)),
    });
  }

  return { mapping, resolution, fallbackExists: fileExists(fallback) };
}
