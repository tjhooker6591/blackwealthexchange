const { MongoClient } = require("mongodb");
const fs = require("fs");
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "bwes-cluster";
if (!uri) throw new Error("MONGODB_URI missing");
const ids = JSON.parse(fs.readFileSync("/tmp/fixture-identities.json", "utf8"));
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db(dbName);
  const setRole = async (email, role) =>
    db
      .collection("users")
      .findOneAndUpdate(
        { email },
        { $set: { accountType: role, updatedAt: new Date() } },
        { returnDocument: "after" },
      );
  const sellerU = await setRole(ids.sellerEmail, "seller");
  const employerU = await setRole(ids.employerEmail, "employer");
  const adminU = await setRole(ids.adminEmail, "admin");
  const sellerId = String(sellerU?._id || sellerU.value?._id || "");
  const employerId = String(employerU?._id || employerU.value?._id || "");
  const adminId = String(adminU?._id || adminU.value?._id || "");
  const sprof = await db.collection("sellers").insertOne({
    userId: sellerId,
    email: ids.sellerEmail,
    name: "Audit Seller",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const prod = await db.collection("products").insertOne({
    sellerId,
    name: "Audit Product " + Date.now(),
    price: 11,
    category: "test",
    status: "active",
    isPublished: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const job = await db.collection("jobs").insertOne({
    employerId,
    title: "Audit Employer Job",
    company: "Audit Co",
    location: "Remote",
    description: "fixture",
    status: "approved",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const app = await db.collection("applications").insertOne({
    jobId: String(job.insertedId),
    userId: sellerId,
    email: ids.sellerEmail,
    status: "new",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  // seed search data
  const bizDocs = Array.from({ length: 45 }).map((_, i) => ({
    business_name: `Audit Search Biz ${i}`,
    city: "Testville",
    state: "CA",
    category: "test",
    status: "approved",
    slug: `audit-search-biz-${Date.now()}-${i}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const biz = await db.collection("businesses").insertMany(bizDocs);
  fs.writeFileSync(
    "/tmp/repo-fixtures-created.json",
    JSON.stringify(
      {
        dbName,
        sellerEmail: ids.sellerEmail,
        employerEmail: ids.employerEmail,
        adminEmail: ids.adminEmail,
        sellerId,
        employerId,
        adminId,
        sellerProfileId: String(sprof.insertedId),
        productId: String(prod.insertedId),
        jobId: String(job.insertedId),
        applicationId: String(app.insertedId),
        businessIds: Object.values(biz.insertedIds).map(String),
      },
      null,
      2,
    ),
  );
  await c.close();
})();
