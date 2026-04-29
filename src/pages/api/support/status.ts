import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
const err=(res:NextApiResponse,c:number,code:string,message:string)=>res.status(c).json({ok:false,code,message});
export default async function handler(req:NextApiRequest,res:NextApiResponse){
if(req.method!=="GET"){res.setHeader("Allow",["GET"]);return err(res,405,"METHOD_NOT_ALLOWED","Method not allowed");}
const db=(await clientPromise).db(getMongoDbName());
const incidents=await db.collection("system_health_logs").find({status:"fail"}).sort({createdAt:-1}).limit(10).toArray().catch(()=>[]);
return res.status(200).json({ok:true,overallStatus:incidents.length?"degraded":"operational",services:{login:"operational",search:"operational",marketplaceCheckout:"operational",businessDirectory:"operational",jobs:"operational",adsSponsors:"operational",support:"operational"},knownIncidents:incidents,maintenanceNotices:[]});}
