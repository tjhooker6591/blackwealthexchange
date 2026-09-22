const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });
const uri = process.env.MONGODB_URI || process.env.MONGODB_URL;
(async () => {
  const c = new MongoClient(uri);
  await c.connect();
  const db = c.db("bwes-cluster");
  const fs = await db
    .collection("featured_sponsor_schedule")
    .find({ placement: "homepage-featured-sponsor" })
    .sort({ weekStart: -1, createdAt: -1 })
    .limit(8)
    .toArray();
  const ar = await db
    .collection("advertising_requests")
    .find({ option: "featured-sponsor" })
    .sort({ paidAt: -1, updatedAt: -1, createdAt: -1 })
    .limit(12)
    .toArray();
  console.log(
    "featured_sponsor_schedule",
    fs.map((x) => ({
      id: String(x._id),
      status: x.status,
      weekStart: x.weekStart,
      weekEnd: x.weekEnd,
      businessName: x.businessName,
      creativeUrl: x.creativeUrl,
      targetUrl: x.targetUrl,
    })),
  );
  console.log(
    "advertising_requests",
    ar.map((x) => ({
      id: String(x._id),
      paymentStatus: x.paymentStatus,
      reviewStatus: x.reviewStatus,
      status: x.status,
      business: x.business,
      adImage: x.adImage,
      paidAt: x.paidAt,
      durationDays: x.durationDays,
      targetUrl: x.targetUrl,
      website: x.website,
    })),
  );
  await c.close();
})();
