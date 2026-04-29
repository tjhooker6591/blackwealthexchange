import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.MONGO_URL;
const dbName = process.env.MONGODB_DB || process.env.MONGODB_DB_NAME || 'bwe';
if (!uri) throw new Error('Missing MONGODB_URI');

const client = new MongoClient(uri);
await client.connect();
const db = client.db(dbName);

const count = async (c,q={}) => {
  const ok = (await db.listCollections({name:c},{nameOnly:true}).toArray()).length>0;
  if(!ok) return { value:0, sourceStatus:'collection_missing', note:c };
  const v=await db.collection(c).countDocuments(q); return { value:v, sourceStatus:v?'live':'empty' };
};
const sum = async (c,q,fields) => {
  const ok = (await db.listCollections({name:c},{nameOnly:true}).toArray()).length>0;
  if(!ok) return { value:0, sourceStatus:'collection_missing', note:c };
  const rows=await db.collection(c).find(q).project(Object.fromEntries(fields.map(f=>[f,1]))).limit(10000).toArray();
  let s=0; for (const r of rows){ const v=fields.map(f=>Number(r?.[f]||0)).find(x=>Number.isFinite(x)&&x>0)||0; s+=v; }
  return { value:Number(s.toFixed(2)), sourceStatus:rows.length?'live':'empty' };
};
const now=new Date(); const month = new Date(now.getFullYear(), now.getMonth(), 1); const today = new Date(now.getFullYear(),now.getMonth(),now.getDate());
const revenue={ revenueToday: await sum('financial_transactions',{createdAt:{$gte:today}},['netBweRevenue','amount']), revenueThisMonth: await sum('financial_transactions',{createdAt:{$gte:month}},['netBweRevenue','amount']) };
const support={ newTickets: await count('support_tickets',{status:'new'}), escalated: await count('support_tickets',{status:'escalated'}) };
const growth={ newUsersThisMonth: await count('users',{createdAt:{$gte:month}}), newBusinessesThisMonth: await count('businesses',{createdAt:{$gte:month}}) };
const trustSafety={ pendingBusinessApprovals: await count('businesses',{status:{$in:['pending','pending_review']}}), disputes: await count('disputes',{}) };
const doc={ snapshotDate: now.toISOString().slice(0,10), revenue, support, growth, trustSafety, systemHealth:{}, executiveSignals:{}, createdAt:new Date() };
await db.collection('admin_metrics_snapshots').updateOne({snapshotDate:doc.snapshotDate},{$set:doc},{upsert:true});
console.log(JSON.stringify({ok:true,snapshotDate:doc.snapshotDate,db:dbName}));
await client.close();
