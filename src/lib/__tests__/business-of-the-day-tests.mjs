import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../../../");
const tmpDir = path.join(repoRoot, ".tmp/business-of-the-day-tests");
await fs.mkdir(tmpDir, { recursive: true });

async function transpileToTmp(sourceRelativePath, targetFilename, replacer) {
  const source = await fs.readFile(
    path.join(repoRoot, sourceRelativePath),
    "utf8",
  );
  let transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
    },
  }).outputText;
  if (replacer) transpiled = replacer(transpiled);
  await fs.writeFile(path.join(tmpDir, targetFilename), transpiled, "utf8");
}

await fs.writeFile(
  path.join(tmpDir, "founding-membership-stub.mjs"),
  "export const FOUNDING_MEMBERSHIP_PRICE_CENTS = 4900;\n",
  "utf8",
);
await transpileToTmp(
  "src/lib/directory/publicBusinessQuery.ts",
  "public-business-query.mjs",
);
await transpileToTmp(
  "src/lib/social/businessOfTheDay.ts",
  "business-of-the-day.mjs",
  (code) =>
    code
      .replace(
        /from "@\/lib\/directory\/publicBusinessQuery"/g,
        'from "./public-business-query.mjs"',
      )
      .replace(
        /from "@\/lib\/founding-membership"/g,
        'from "./founding-membership-stub.mjs"',
      ),
);

const {
  toFeatureListing,
  summarizeDescription,
  buildCaption,
  buildCard,
  buildHashtags,
  buildOwnerEmail,
} = await import(`file://${path.join(tmpDir, "business-of-the-day.mjs")}`);

delete process.env.NEXT_PUBLIC_BASE_URL;
delete process.env.APP_URL;

const doc = {
  _id: "6ab252a83f5ffe1bbf7b659b",
  businessName: "Wolf of Fitness",
  slug: "wolf-of-fitness",
  city: "Parsippany",
  state: "NJ",
  display_categories: "Health & Wellness",
  categories: "Gym, Fitness",
  description:
    '"Wolf of Fitness trains teams and individuals. It runs coaching programs for companies. It also publishes training material.',
  email: "Owner@Example.com",
  website: "",
};

// Listing fields are taken as stored, with stray quotes and casing cleaned.
{
  const listing = toFeatureListing(doc);
  assert.equal(listing.name, "Wolf of Fitness");
  assert.equal(listing.location, "Parsippany, NJ");
  assert.equal(listing.category, "Health & Wellness");
  assert.equal(listing.email, "owner@example.com");
  assert.equal(listing.description.startsWith('"'), false);
  assert.equal(listing.claimed, false);
  assert.equal(listing.hasImage, false);
}

// Junk imported location values are dropped instead of shown.
{
  const listing = toFeatureListing({
    ...doc,
    city: "3301 college park georgia 30349",
    state: "GEORGIA",
  });
  assert.equal(listing.city, "");
  assert.equal(listing.location, "Georgia");
}

// Summaries only ever use the listing's own sentences.
{
  const long = `${"First sentence here. ".repeat(3)}${"x".repeat(300)}.`;
  const summary = summarizeDescription(long, 60);
  assert.equal(summary, "First sentence here. First sentence here.");
  assert.equal(summarizeDescription("Short one.", 60), "Short one.");
  const noSentence = summarizeDescription("word ".repeat(80), 40);
  assert.ok(noSentence.length <= 41);
  assert.ok(noSentence.endsWith("…"));
}

// The caption names the business, links its BWE page and carries hashtags.
{
  const listing = toFeatureListing(doc);
  const caption = buildCaption(listing, 0);
  assert.match(
    caption,
    /^Meet today's BWE Business of the Day: Wolf of Fitness in Parsippany, NJ\./,
  );
  assert.match(
    caption,
    /https:\/\/www\.blackwealthexchange\.com\/business\/wolf-of-fitness/,
  );
  assert.match(caption, /#BWEBusinessOfTheDay/);
  assert.deepEqual(buildHashtags(listing), [
    "#BWEBusinessOfTheDay",
    "#BlackWealthExchange",
    "#BuyBlack",
    "#Parsippany",
    "#HealthAndWellness",
  ]);
  assert.notEqual(buildCaption(listing, 1), caption);
  assert.equal(buildCaption(listing, 3), caption);
}

// The card carries the listing's name, place and category.
{
  const card = buildCard(toFeatureListing(doc));
  assert.equal(card.name, "Wolf of Fitness");
  assert.equal(card.location, "Parsippany, NJ");
  assert.equal(card.category, "Health & Wellness");
  assert.ok(card.line.length <= 121);
}

// The owner email states the membership price and only offers the claim
// link to unclaimed listings.
{
  const listing = toFeatureListing(doc);
  const email = buildOwnerEmail(listing);
  assert.equal(email.to, "owner@example.com");
  assert.equal(
    email.subject,
    "Wolf of Fitness is today's BWE Business of the Day",
  );
  assert.match(email.text, /\$49 per month/);
  assert.match(
    email.text,
    /founding-membership\?businessId=6ab252a83f5ffe1bbf7b659b/,
  );
  assert.match(email.html, /<a href="https:\/\/www\.blackwealthexchange\.com/);

  const claimed = buildOwnerEmail(
    toFeatureListing({ ...doc, claimStage: "ownership_verified" }),
  );
  assert.doesNotMatch(claimed.text, /founding-membership/);
  assert.doesNotMatch(claimed.text, /\$49/);
}

console.log("business-of-the-day-tests: all passed");
