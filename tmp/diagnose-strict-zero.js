require("dotenv").config({ path: ".env.local" });
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "bwes-cluster";

function escapeRegex(input) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rx(t) {
  return new RegExp(escapeRegex(t), "i");
}

async function count(col, query) {
  return col.countDocuments(query);
}

async function main() {
  const client = await new MongoClient(uri).connect();
  const col = client.db(dbName).collection("businesses");

  const base = {
    $and: [
      {
        $or: [
          { status: "approved" },
          { status: "verified" },
          { status: "active" },
          { status: { $exists: false } },
          { status: "" },
          { status: null },
        ],
      },
      {
        $or: [
          { isComplete: true },
          { completenessScore: { $gte: 70 } },
          { qualityScore: { $gte: 70 } },
        ],
      },
    ],
  };

  const scenarios = [
    {
      q: "black dentist atlanta",
      terms: ["black", "dentist", "atlanta"],
      geo: [
        { city: rx("atlanta") },
        { state: "GA" },
        { address: rx("atlanta") },
      ],
      cat: [
        { category: rx("dentist") },
        { categories: rx("dentist") },
        { display_categories: rx("dentist") },
        { description: rx("dentist") },
      ],
    },
    {
      q: "black owned restaurant houston",
      terms: ["black", "restaurant", "houston"],
      geo: [
        { city: rx("houston") },
        { state: "TX" },
        { address: rx("houston") },
      ],
      cat: [
        { category: rx("restaurant") },
        { categories: rx("restaurant") },
        { display_categories: rx("restaurant") },
        { description: rx("restaurant") },
      ],
    },
    {
      q: "black nonprofit chicago",
      terms: ["black", "nonprofit", "chicago"],
      geo: [
        { city: rx("chicago") },
        { state: "IL" },
        { address: rx("chicago") },
      ],
      cat: [
        { category: rx("nonprofit") },
        { categories: rx("nonprofit") },
        { display_categories: rx("nonprofit") },
        { description: rx("nonprofit") },
      ],
    },
  ];

  for (const s of scenarios) {
    const strictAll = {
      $and: [
        ...base.$and,
        ...s.terms.map((t) => ({
          $or: [
            { business_name: rx(t) },
            { alias: rx(t) },
            { description: rx(t) },
            { categories: rx(t) },
            { display_categories: rx(t) },
            { category: rx(t) },
            { address: rx(t) },
            { city: rx(t) },
            { state: rx(t) },
            { country: rx(t) },
          ],
        })),
      ],
    };

    const noBlack = {
      $and: [
        ...base.$and,
        ...s.terms
          .filter((t) => t !== "black")
          .map((t) => ({
            $or: [
              { business_name: rx(t) },
              { alias: rx(t) },
              { description: rx(t) },
              { categories: rx(t) },
              { display_categories: rx(t) },
              { category: rx(t) },
              { address: rx(t) },
              { city: rx(t) },
              { state: rx(t) },
              { country: rx(t) },
            ],
          })),
      ],
    };

    const geoPlusCat = { $and: [...base.$and, { $or: s.geo }, { $or: s.cat }] };

    const result = {
      strictAll: await count(col, strictAll),
      noBlack: await count(col, noBlack),
      geoPlusCat: await count(col, geoPlusCat),
      geoOnly: await count(col, { $and: [...base.$and, { $or: s.geo }] }),
      catOnly: await count(col, { $and: [...base.$and, { $or: s.cat }] }),
    };

    console.log(s.q, result);
  }

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
