require('dotenv').config({ path: '.env.local' });
const { MongoClient, ObjectId } = require('mongodb');
(async()=>{
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'bwes-cluster');
  const ids = [new ObjectId('680811603105a101ca1b5909'), new ObjectId('69b70eab15425bd720bec676')];
  const orders = await db.collection('orders').find({ _id: { $in: ids } }).toArray();
  const payments = await db.collection('payments').find({ $or: [ { stripeSessionId: 'cs_test_webhook_marketplace_paid_001' }, { 'metadata.orderId': { $in: ['680811603105a101ca1b5909','69b70eab15425bd720bec676'] } }, { orderId: { $in: ['680811603105a101ca1b5909','69b70eab15425bd720bec676'] } } ] }).toArray();
  console.log(JSON.stringify({ orders, payments }, null, 2));
  await client.close();
})().catch(err=>{ console.error(err); process.exit(1); });
