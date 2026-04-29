import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
const err=(res:NextApiResponse,c:number,code:string,message:string)=>res.status(c).json({ok:false,code,message});
export default async function handler(req:NextApiRequest,res:NextApiResponse){
  if(req.method!=="GET"){res.setHeader("Allow",["GET"]);return err(res,405,"METHOD_NOT_ALLOWED","Method not allowed");}
  const db=(await clientPromise).db(getMongoDbName());
  const timeline=await db.collection("system_health_logs").find({}).sort({createdAt:-1}).limit(25).toArray().catch(()=>[]);
  const hasFail=(k:string)=>timeline.some((x:any)=>String(x?.component||x?.service||"").toLowerCase().includes(k) && (x?.status==="fail" || Number(x?.httpStatus||0)>=500));
  const services={auth:hasFail("auth")?"degraded":"operational",search:hasFail("search")?"degraded":"operational",marketplace:hasFail("market")?"degraded":"operational",jobs:hasFail("job")?"degraded":"operational",ads:hasFail("ad")?"degraded":"operational"};
  const overall=Object.values(services).includes("degraded")?"degraded":"operational";
  return res.status(200).json({ok:true,overallStatus:overall,services,incidentTimeline:timeline,lastUpdatedAt:new Date().toISOString()});
}
