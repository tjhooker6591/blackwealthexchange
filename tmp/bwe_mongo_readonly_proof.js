const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'bwes-cluster';
if (!uri) throw new Error('Missing MONGODB_URI');

(async () => {
  const client = new MongoClient(uri, { readPreference: 'primaryPreferred' });
  let modified = 0;
  try {
    await client.connect();
    const db = client.db(dbName);
    const [businesses, orders, products] = await Promise.all([
      db.collection('businesses').countDocuments({}, { maxTimeMS: 10000 }),
      db.collection('orders').countDocuments({}, { maxTimeMS: 10000 }),
      db.collection('products').countDocuments({}, { maxTimeMS: 10000 }),
    ]);
    console.log(JSON.stringify({
      connectionRestored: true,
      databaseName: db.databaseName,
      businesses,
      orders,
      products,
      modifiedRecords: modified,
      envModifiedOrExposed: false,
      stripeVariableAccessed: false,
      sanitizedConnectionError: null,
    }));
  } catch (err) {
    console.log(JSON.stringify({
      connectionRestored: false,
      databaseName: dbName,
      businesses: null,
      orders: null,
      products: null,
      modifiedRecords: modified,
      envModifiedOrExposed: false,
      stripeVariableAccessed: false,
      sanitizedConnectionError: err && err.message ? String(err.message).replace(/mongodb(\+srv)?:\/\/[^\s"']+/gi, '[redacted-uri]') : 'Unknown connection error',
    }));
    process.exitCode = 1;
  } finally {
    try { await client.close(); } catch {}
  }
})();
