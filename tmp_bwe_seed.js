const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
const fs = require("fs");
(async () => {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.MONGODB_DB || "bwes-cluster");
  const tag = "BWE_LOCAL_AUDIT_2026_05";
  const pw = "AuditPass123!";
  const hp = await bcrypt.hash(pw, 10);
  const now = new Date();
  async function up(collection, email, setDoc) {
    await db
      .collection(collection)
      .updateOne(
        { email },
        { $set: setDoc, $setOnInsert: { createdAt: now, password: hp } },
        { upsert: true },
      );
    return db.collection(collection).findOne({ email });
  }
  const seller = await up("sellers", "audit_seller_20260506@local.test", {
    email: "audit_seller_20260506@local.test",
    accountType: "seller",
    storeName: "audit_seller_store",
    auditTag: tag,
    updatedAt: now,
  });
  const employer = await up("employers", "audit_employer_20260506@local.test", {
    email: "audit_employer_20260506@local.test",
    accountType: "employer",
    auditTag: tag,
    updatedAt: now,
  });
  const admin = await up("users", "audit_admin_20260506@local.test", {
    email: "audit_admin_20260506@local.test",
    accountType: "user",
    isAdmin: true,
    auditTag: tag,
    updatedAt: now,
  });
  await db
    .collection("sellers")
    .updateOne(
      { _id: seller._id },
      { $set: { userId: String(seller._id), auditTag: tag, updatedAt: now } },
    );
  await db.collection("products").updateOne(
    { name: "audit_seller_product_20260506" },
    {
      $set: {
        name: "audit_seller_product_20260506",
        sellerId: String(seller._id),
        ownerId: String(seller._id),
        ownerEmail: seller.email,
        price: 19.99,
        status: "active",
        auditTag: tag,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
  await db.collection("jobs").updateOne(
    { title: "audit_employer_job_20260506" },
    {
      $set: {
        title: "audit_employer_job_20260506",
        employerId: String(employer._id),
        ownerId: String(employer._id),
        ownerEmail: employer.email,
        status: "active",
        auditTag: tag,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
  const job = await db
    .collection("jobs")
    .findOne({ title: "audit_employer_job_20260506" });
  await db.collection("applications").updateOne(
    { email: "audit_applicant_20260506@local.test", jobId: String(job._id) },
    {
      $set: {
        email: "audit_applicant_20260506@local.test",
        jobId: String(job._id),
        employerId: String(employer._id),
        status: "submitted",
        auditTag: tag,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
  for (let i = 1; i <= 45; i++) {
    await db.collection("businesses").updateOne(
      { email: `auditpagination_${i}@local.test` },
      {
        $set: {
          email: `auditpagination_${i}@local.test`,
          business_name: `auditpagination_business_${i}`,
          name: `auditpagination_business_${i}`,
          description: `local auditpagination fixture ${i}`,
          address: "100 Audit St",
          city: "Oakland",
          state: "CA",
          category: "auditpagination",
          categories: "auditpagination",
          display_categories: "auditpagination",
          isComplete: false,
          completenessScore: 95,
          status: "test",
          approved: false,
          isTest: true,
          auditTag: tag,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
          password: hp,
          accountType: "business",
        },
      },
      { upsert: true },
    );
  }
  const out = {
    dbName: process.env.MONGODB_DB || "bwes-cluster",
    tag,
    sellerId: String(seller._id),
    employerId: String(employer._id),
    adminId: String(admin._id),
    jobId: String(job._id),
  };
  fs.writeFileSync(
    "/tmp/bwe_fixture_seed_result.json",
    JSON.stringify(out, null, 2),
  );
  fs.writeFileSync(
    "/tmp/bwe_fixture_identities.json",
    JSON.stringify(
      {
        sellerEmail: seller.email,
        employerEmail: employer.email,
        adminEmail: admin.email,
        password: pw,
        ...out,
      },
      null,
      2,
    ),
  );
  fs.writeFileSync(
    "/tmp/bwe_fixture_records_summary.txt",
    "seeded seller/employer/admin + product/job/application + 45 businesses",
  );
  await client.close();
  console.log("ok");
})();
