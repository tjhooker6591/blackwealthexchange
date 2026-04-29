import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
const err=(res:NextApiResponse,c:number,code:string,message:string)=>res.status(c).json({ok:false,code,message});
export default async function handler(req:NextApiRequest,res:NextApiResponse){
if(req.method!=="GET"){res.setHeader("Allow",["GET"]);return err(res,405,"METHOD_NOT_ALLOWED","Method not allowed");}
const db=(await clientPromise).db(getMongoDbName());
const releases=await db.collection("releases").find({}).sort({deployDate:-1,createdAt:-1}).limit(20).toArray().catch(()=>[]);
return res.status(200).json({ok:true,releases,message:releases.length?undefined:"No release notes have been published yet"});}
