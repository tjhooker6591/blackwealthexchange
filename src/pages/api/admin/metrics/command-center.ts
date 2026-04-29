import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { getMongoDbName } from "@/lib/env";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { safeCount, startOfMonth, startOfToday, sumAmount } from "@/lib/adminMetrics";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdminFromRequest(req,res); if(!admin) return;
  if(req.method!=="GET"){res.setHeader("Allow",["GET"]);return res.status(405).json({ok:false,code:"METHOD_NOT_ALLOWED",message:"Method not allowed"});}
  const db=(await clientPromise).db(getMongoDbName());
  const now=new Date(); const today=startOfToday(now); const month=startOfMonth(now);

  const companyHealth = {
    totalUsers: await safeCount(db,"users"), totalBusinesses: await safeCount(db,"businesses"), totalSellers: await safeCount(db,"sellers"), totalEmployers: await safeCount(db,"employers"), totalMarketplaceProducts: await safeCount(db,"products",{status:"active"}), activeSponsors: await safeCount(db,"advertising_requests",{status:{$in:["active","approved","paid"]}}), pendingAdminApprovals: await safeCount(db,"businesses",{status:{$in:["pending","pending_review"]}}), criticalIssues: await safeCount(db,"support_tickets",{priority:{$in:["urgent","security"]}})
  };
  const revenueHealth = {
    revenueToday: await sumAmount(db,"financial_transactions",{createdAt:{$gte:today}},["netBweRevenue","amount"]),
    revenueThisMonth: await sumAmount(db,"financial_transactions",{createdAt:{$gte:month}},["netBweRevenue","amount"]),
    marketplacePlatformFees: await sumAmount(db,"orders",{},["platformFeeAmount","platformFee","bweFee"]),
    advertisingRevenue: await sumAmount(db,"advertising_requests",{status:{$in:["active","approved","paid"]}},["amount","price"]),
    directoryListingRevenue: await sumAmount(db,"advertising_requests",{type:{$in:["directory","listing"]}},["amount","price"]),
    jobPostingRevenue: await sumAmount(db,"jobs",{paid:true},["paymentAmount","price","amount"]),
    membershipBlackCardRevenue: await sumAmount(db,"black_card_memberships",{},["amount","price","total"]),
    courseRevenue: await sumAmount(db,"course_orders",{},["amount","price","total"]),
    musicCreatorPlanRevenue: await sumAmount(db,"music_creator_onboarding",{},["amount","planAmount","price"]),
    consultingRevenue: await sumAmount(db,"consulting_intake",{$or:[{paid:true},{invoicePaid:true}]},["revenueAmount","amount"]),
    affiliateRevenue: await sumAmount(db,"affiliate_revenue",{},["amount","commission"]),
    manualOfflineRevenue: await sumAmount(db,"manual_offline_revenue",{},["amount"]),
  };
  const supportHealth = {
    newTickets: await safeCount(db,"support_tickets",{status:"new"}), inReview: await safeCount(db,"support_tickets",{status:"in_review"}), waitingOnUser: await safeCount(db,"support_tickets",{status:"waiting_on_user"}), escalated: await safeCount(db,"support_tickets",{status:"escalated"}), billingIssues: await safeCount(db,"support_tickets",{category:"Billing / Payment"}), refundRequests: await safeCount(db,"support_tickets",{category:/refund/i}), sellerIssues: await safeCount(db,"support_tickets",{category:"Seller / Product Issue"}), advertisingIssues: await safeCount(db,"support_tickets",{category:"Advertising / Sponsorship"}), trustSafetyIssues: await safeCount(db,"support_tickets",{category:"Trust & Safety"}), securityPriorityTickets: await safeCount(db,"support_tickets",{priority:"security"})
  };
  const growthHealth = {
    newBusinessesThisMonth: await safeCount(db,"businesses",{createdAt:{$gte:month}}), newSellersThisMonth: await safeCount(db,"sellers",{createdAt:{$gte:month}}), newEmployersThisMonth: await safeCount(db,"employers",{createdAt:{$gte:month}}), newUsersThisMonth: await safeCount(db,"users",{createdAt:{$gte:month}}), activeCampaigns: await safeCount(db,"advertising_requests",{status:"active"}), partnershipLeads: await safeCount(db,"partnership_leads",{createdAt:{$gte:month}}), sponsorLeads: await safeCount(db,"advertising_requests",{createdAt:{$gte:month}}), outreachCount: await safeCount(db,"outreach",{createdAt:{$gte:month}})
  };
  const trustSafetyHealth = {
    pendingBusinessApprovals: await safeCount(db,"businesses",{status:{$in:["pending","pending_review"]}}), pendingProductApprovals: await safeCount(db,"products",{status:{$in:["pending","pending_review"]}}), pendingJobApprovals: await safeCount(db,"jobs",{status:{$in:["pending","pending_review"]}}), rejectedListings: await safeCount(db,"products",{status:{$in:["rejected","denied"]}}), fraudFlags: await safeCount(db,"fraud_flags",{}), abuseReports: await safeCount(db,"abuse_reports",{}), disputes: await safeCount(db,"disputes",{})
  };
  const executivePrioritiesRows = await db.collection("executive_priorities").find({}).sort({priorityRank:1,updatedAt:-1}).limit(50).toArray().catch(()=>[]);
  const executivePriorities = { top3: executivePrioritiesRows.filter((r:any)=>["active","in_progress"].includes(r.status)).slice(0,3), decisionsNeeded: executivePrioritiesRows.filter((r:any)=>r.requiresFounderDecision===true), blockers: executivePrioritiesRows.filter((r:any)=>r.status==="blocked") };

  return res.status(200).json({ok:true,companyHealth,revenueHealth,supportHealth,productEngineeringHealth:{openProductWorkstreams:{value:0,sourceStatus:"needs_mapping",note:"connect product_workstreams"},activeBlockers:{value: executivePriorities.blockers.length, sourceStatus:"live"},failedRouteChecks:{value:0,sourceStatus:"needs_mapping"},recentDeployments:{value:0,sourceStatus:"needs_mapping"},lastCommitHash:{value:"Not connected",sourceStatus:"needs_mapping"},currentReleaseStatus:{value:"Not connected",sourceStatus:"needs_mapping"},goNoGoStatus:{value:"Not connected",sourceStatus:"needs_mapping"}},growthHealth,trustSafetyHealth,executivePriorities,generatedAt:now.toISOString()});
}
