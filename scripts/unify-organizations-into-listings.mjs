// scripts/unify-organizations-into-listings.mjs
//
// One listing model: organizations (churches, nonprofits, ...) become
// listings in the same `businesses` collection as businesses, so every
// feature -- claiming, workspace/editing, who-viewed, monthly reports,
// approvals, search -- works for them the same way.
//
//   - Same _id, every field kept; listingType "organization", orgType kept
//     as the label (Church, Nonprofit, ...).
//   - Name copied into business_name / businessName / title; a unique web
//     address (alias/slug) is created.
//   - Approved organizations stay exactly as visible as before
//     (status active, approved, directoryVisibilityApproved).
//   - The original organizations records are left in place, marked
//     status "migrated" with migratedToListingId, so this can be undone.
//
// Usage:
//   node scripts/unify-organizations-into-listings.mjs           (dry run)
//   node scripts/unify-organizations-into-listings.mjs --apply   (backup, then writes)

import dotenv from "dotenv";
import fs from "fs";
import { MongoClient } from "mongodb";

dotenv.config({ path: new URL("../.env.local", import.meta.url).pathname });

const APPLY = process.argv.includes("--apply");
const t = (v) =>
  typeof v === "string" ? v.trim() : v == null ? "" : String(v).trim();
const has = (v) => (Array.isArray(v) ? v.some((x) => t(x)) : Boolean(t(v)));
const slugify = (s) =>
  t(s)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
const LABEL = (orgType) => {
  const k = t(orgType).toLowerCase();
  if (!k) return "Organization";
  return k.replace(/[_-]+/g, " ").replace(/\b[a-z]/g, (c) => c.toUpperCase());
};

function completeness(d) {
  const checks = [
    [
      "name",
      has(d.business_name) ||
        has(d.businessName) ||
        has(d.title) ||
        has(d.name),
    ],
    ["description", has(d.description)],
    [
      "address",
      has(d.address) || has(d.addressLine1) || has(d.businessAddress),
    ],
    ["city", has(d.city)],
    ["state", has(d.state)],
    ["phone", has(d.phone) || has(d.businessPhone)],
    [
      "category",
      has(d.display_categories) || has(d.categories) || has(d.category),
    ],
    ["website", has(d.website)],
    ["image", has(d.image) || has(d.logo) || has(d.coverImage)],
  ];
  const missingFields = checks.filter(([, ok]) => !ok).map(([k]) => k);
  const present = 9 - missingFields.length;
  return {
    missingFields,
    completenessScore: Math.round((present / 9) * 100),
    isComplete: present >= 7,
  };
}

async function main() {
  const client = new MongoClient(process.env.MONGODB_URI || "");
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "bwes-cluster");
  const orgCol = db.collection("organizations");
  const bizCol = db.collection("businesses");

  const orgs = await orgCol.find({ status: { $ne: "migrated" } }).toArray();
  const taken = new Set(
    (await bizCol.find({}, { projection: { alias: 1, slug: 1 } }).toArray())
      .flatMap((d) => [t(d.alias), t(d.slug)])
      .filter(Boolean),
  );
  const idClash = await bizCol.countDocuments({
    _id: { $in: orgs.map((o) => o._id) },
  });
  if (idClash) {
    console.log(
      `Stopping: ${idClash} organization IDs already exist as listings.`,
    );
    await client.close();
    process.exit(1);
  }

  const PUBLIC = new Set(["approved", "verified", "active", ""]);
  const now = new Date();
  const plan = orgs.map((o) => {
    const name = t(o.name) || t(o.business_name) || t(o.title);
    let alias = t(o.alias);
    if (!alias || taken.has(alias)) {
      const base = slugify(name) || String(o._id);
      const withCity = slugify(`${name} ${t(o.city)} ${t(o.state)}`);
      alias = !taken.has(base)
        ? base
        : withCity && !taken.has(withCity)
          ? withCity
          : `${base}-${String(o._id).slice(-6)}`;
    }
    taken.add(alias);
    const wasPublic = PUBLIC.has(t(o.status).toLowerCase());
    const { _id, ...fields } = o;
    const doc = {
      ...fields,
      _id,
      listingType: "organization",
      entityType: "organization",
      orgType: t(o.orgType) || "organization",
      typeLabel: LABEL(o.orgType),
      business_name: name,
      businessName: name,
      title: name,
      name,
      alias,
      slug: alias,
      category: t(o.category) || LABEL(o.orgType),
      postalCode: t(o.postalCode) || t(o.zip) || undefined,
      status: wasPublic ? "active" : t(o.status) || "pending",
      approved: wasPublic,
      directoryVisibilityApproved: wasPublic,
      approvedAt: o.approvedAt || (wasPublic ? now : null),
      migratedFromOrganizationsAt: now,
      migratedFromOrganizationId: String(_id),
      previousListingType: o.listingType || null,
      createdAt: o.createdAt || o.importedAt || now,
      updatedAt: now,
    };
    Object.assign(doc, completeness(doc));
    // The businesses collection validates field types: these must be text
    // (a ZIP stored as the number 11575 becomes "11575"), these true/false.
    for (const f of [
      "business_name",
      "slug",
      "category",
      "subcategory",
      "description",
      "phone",
      "website",
      "address",
      "city",
      "state",
      "zip",
    ]) {
      if (doc[f] !== undefined && doc[f] !== null && typeof doc[f] !== "string")
        doc[f] = String(doc[f]);
    }
    for (const f of ["verified", "sponsored", "featured"]) {
      if (
        doc[f] !== undefined &&
        doc[f] !== null &&
        typeof doc[f] !== "boolean"
      )
        doc[f] = Boolean(doc[f]);
    }
    if (
      doc.images !== undefined &&
      doc.images !== null &&
      !Array.isArray(doc.images)
    )
      doc.images = [doc.images];
    if (doc.postalCode === undefined) delete doc.postalCode;
    return { o, doc, wasPublic };
  });

  // Check every record against the collection's own rules before writing.
  const info = (await db.listCollections({ name: "businesses" }).toArray())[0];
  const props = info?.options?.validator?.$jsonSchema?.properties || {};
  const typeOk = (v, types) => {
    const list = [].concat(types || []);
    return list.some(
      (t) =>
        (t === "null" && v === null) ||
        (t === "string" && typeof v === "string") ||
        (t === "bool" && typeof v === "boolean") ||
        (t === "array" && Array.isArray(v)) ||
        (t === "object" &&
          v &&
          typeof v === "object" &&
          !Array.isArray(v) &&
          !(v instanceof Date)) ||
        (t === "date" && v instanceof Date) ||
        (["double", "int", "long", "decimal"].includes(t) &&
          typeof v === "number"),
    );
  };
  const invalid = [];
  for (const p of plan)
    for (const [f, rule] of Object.entries(props)) {
      if (p.doc[f] === undefined) continue;
      if (!typeOk(p.doc[f], rule.bsonType))
        invalid.push(
          `${p.doc.business_name}: ${f}=${JSON.stringify(p.doc[f])}`,
        );
    }
  console.log(
    `checked against the collection rules: ${invalid.length ? invalid.length + " problems" : "all records pass"}`,
  );
  if (invalid.length) {
    console.log(invalid.slice(0, 10).join("\n"));
    await client.close();
    process.exit(1);
  }

  const publicNow = plan.filter((p) => p.wasPublic).length;
  const byLabel = {};
  for (const p of plan)
    byLabel[p.doc.typeLabel] = (byLabel[p.doc.typeLabel] || 0) + 1;
  const newAliases = plan.filter((p) => p.doc.alias !== t(p.o.alias)).length;
  console.log(
    `organizations to move: ${plan.length} | public now: ${publicNow} | will stay public: ${plan.filter((p) => p.doc.directoryVisibilityApproved).length}`,
  );
  console.log(
    `types: ${JSON.stringify(byLabel)} | new web addresses: ${newAliases}`,
  );
  console.log("samples:");
  for (const p of plan.slice(0, 5))
    console.log(
      `  ${p.doc.business_name} -> /business-directory/${p.doc.alias} [${p.doc.typeLabel}, ${p.doc.status}, ${p.doc.completenessScore}%]`,
    );

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write changes.");
    await client.close();
    return;
  }

  const out = new URL("./recovery/out/", import.meta.url).pathname;
  fs.mkdirSync(out, { recursive: true });
  const backup = `${out}unify-organizations-backup-${now.toISOString().replace(/[:.]/g, "-")}.json`;
  fs.writeFileSync(
    backup,
    JSON.stringify(
      { backedUpAt: now.toISOString(), organizations: orgs },
      null,
      2,
    ),
  );
  console.log("\nBackup:", backup);

  const ins = await bizCol.insertMany(
    plan.map((p) => p.doc),
    { ordered: true },
  );
  const marked = await orgCol.updateMany(
    { _id: { $in: plan.map((p) => p.o._id) } },
    {
      $set: {
        status: "migrated",
        previousStatus: "approved",
        migratedToListingId: null,
        migratedAt: now,
      },
    },
  );
  for (const p of plan)
    await orgCol.updateOne(
      { _id: p.o._id },
      {
        $set: {
          migratedToListingId: String(p.o._id),
          previousStatus: t(p.o.status),
        },
      },
    );
  console.log(
    `Moved ${ins.insertedCount} organizations into listings; marked ${marked.modifiedCount} originals as migrated.`,
  );
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
