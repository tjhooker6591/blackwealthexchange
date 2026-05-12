import type { NextApiRequest, NextApiResponse } from "next";
import clientPromise from "@/lib/mongodb";
import { requireAdminFromRequest } from "@/lib/adminAuth";
import { ADMIN_ERROR_CODES, adminFail } from "@/lib/adminApiContract";
import { getMongoDbName } from "@/lib/env";

type WindowCounts = {
  today: number;
  last7d: number;
  last30d: number;
};

type MetricRow = {
  eventType: string;
  label: string;
  counts: WindowCounts;
};

type GroupDef = {
  key: string;
  title: string;
  metrics: Array<{ eventType: string; label: string; pageRoute?: string }>;
};

function emptyCounts(): WindowCounts {
  return { today: 0, last7d: 0, last30d: 0 };
}

function ratio(numerator: number, denominator: number) {
  if (!denominator) return null;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

const GROUPS: GroupDef[] = [
  {
    key: "page_access",
    title: "Page Access (Shared Backend Source)",
    metrics: [
      {
        eventType: "page_view",
        pageRoute: "/",
        label: "Homepage page views",
      },
      {
        eventType: "page_view",
        pageRoute: "/financial-literacy",
        label: "Financial literacy page views",
      },
      {
        eventType: "page_view",
        pageRoute: "/marketplace",
        label: "Marketplace page views",
      },
      {
        eventType: "page_view",
        pageRoute: "/admin/phase1-scoreboard",
        label: "Phase1 scoreboard page views",
      },
    ],
  },
  {
    key: "discovery",
    title: "Discovery / Top of Funnel",
    metrics: [
      { eventType: "homepage_cta_clicked", label: "Homepage CTA clicked" },
      {
        eventType: "homepage_search_focused",
        label: "Homepage search focused",
      },
      {
        eventType: "homepage_search_submitted",
        label: "Homepage search submitted",
      },
      { eventType: "search_results_viewed", label: "Search results viewed" },
      { eventType: "search_result_clicked", label: "Search result clicked" },
      { eventType: "search_filter_applied", label: "Search filter applied" },
      {
        eventType: "search_no_results_viewed",
        label: "Search no results viewed",
      },
    ],
  },
  {
    key: "mission_learning",
    title: "Mission-Critical Learning / Opportunities",
    metrics: [
      {
        eventType: "student_portal_entry_clicked",
        label: "Student portal entry clicked",
      },
      {
        eventType: "student_portal_landing_viewed",
        label: "Student portal landing viewed",
      },
      {
        eventType: "student_opportunity_category_clicked",
        label: "Student opportunity category clicked",
      },
      {
        eventType: "student_scholarship_entry_clicked",
        label: "Student scholarship entry clicked",
      },
      {
        eventType: "student_internship_entry_clicked",
        label: "Student internship entry clicked",
      },
      {
        eventType: "student_mentorship_entry_clicked",
        label: "Student mentorship entry clicked",
      },
      {
        eventType: "student_opportunity_action_started",
        label: "Student opportunity action started",
      },
      {
        eventType: "homepage_education_entry_clicked",
        label: "Homepage education entry clicked",
      },
      {
        eventType: "homepage_history_truth_entry_clicked",
        label: "Homepage history/truth entry clicked",
      },
      {
        eventType: "education_to_action_cta_clicked",
        label: "Education to action CTA clicked",
      },
      {
        eventType: "history_truth_to_action_cta_clicked",
        label: "History/truth to action CTA clicked",
      },
    ],
  },
  {
    key: "music",
    title: "Music / Creator Funnel",
    metrics: [
      { eventType: "music_landing_viewed", label: "Music landing viewed" },
      {
        eventType: "music_join_entry_clicked",
        label: "Music join entry clicked",
      },
      { eventType: "music_pricing_viewed", label: "Music pricing viewed" },
      { eventType: "music_plan_selected", label: "Music plan selected" },
      {
        eventType: "music_onboarding_started",
        label: "Music onboarding started",
      },
      {
        eventType: "music_onboarding_submitted",
        label: "Music onboarding submitted",
      },
    ],
  },
  {
    key: "advertising",
    title: "Advertising Funnel",
    metrics: [
      {
        eventType: "advertising_landing_viewed",
        label: "Advertising landing viewed",
      },
      {
        eventType: "advertising_option_selected",
        label: "Advertising option selected",
      },
      {
        eventType: "advertising_checkout_started",
        label: "Advertising checkout started",
      },
      {
        eventType: "advertising_submission_started",
        label: "Advertising submission started",
      },
      {
        eventType: "advertising_submission_completed",
        label: "Advertising submission completed",
      },
    ],
  },
  {
    key: "seller",
    title: "Seller Funnel",
    metrics: [
      { eventType: "seller_entry_clicked", label: "Seller entry clicked" },
      {
        eventType: "seller_onboarding_started",
        label: "Seller onboarding started",
      },
      {
        eventType: "seller_onboarding_submitted",
        label: "Seller onboarding submitted",
      },
      {
        eventType: "seller_dashboard_entry_clicked",
        label: "Seller dashboard entry clicked",
      },
    ],
  },
  {
    key: "jobs_employer",
    title: "Jobs / Employer Funnel",
    metrics: [
      { eventType: "jobs_landing_viewed", label: "Jobs landing viewed" },
      { eventType: "job_detail_viewed", label: "Job detail viewed" },
      { eventType: "job_apply_started", label: "Job apply started" },
      {
        eventType: "employer_post_job_started",
        label: "Employer post job started",
      },
      {
        eventType: "job_application_submitted",
        label: "Job application submitted",
      },
      { eventType: "job_post_submitted", label: "Job post submitted" },
    ],
  },
  {
    key: "consulting",
    title: "Consulting Funnel",
    metrics: [
      {
        eventType: "consulting_landing_viewed",
        label: "Consulting landing viewed",
      },
      {
        eventType: "consulting_entry_clicked",
        label: "Consulting entry clicked",
      },
      {
        eventType: "consulting_submission_started",
        label: "Consulting submission started",
      },
      {
        eventType: "consulting_submission_completed",
        label: "Consulting submission completed",
      },
    ],
  },
  {
    key: "commerce",
    title: "Commerce Funnel",
    metrics: [
      {
        eventType: "marketplace_landing_viewed",
        label: "Marketplace landing viewed",
      },
      { eventType: "product_detail_viewed", label: "Product detail viewed" },
      {
        eventType: "marketplace_buy_started",
        label: "Marketplace buy started",
      },
      {
        eventType: "marketplace_checkout_started",
        label: "Marketplace checkout started",
      },
      {
        eventType: "marketplace_checkout_created",
        label: "Marketplace checkout created",
      },
      {
        eventType: "marketplace_purchase_completed",
        label: "Marketplace purchase completed",
      },
    ],
  },
];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  res.setHeader("Cache-Control", "no-store, max-age=0");

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return adminFail(
      res,
      405,
      ADMIN_ERROR_CODES.METHOD_NOT_ALLOWED,
      "Method Not Allowed",
    );
  }

  const admin = await requireAdminFromRequest(req, res);
  if (!admin) return;

  try {
    const client = await clientPromise;
    const db = client.db(getMongoDbName());

    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);

    const start7d = new Date(now);
    start7d.setDate(start7d.getDate() - 6);
    start7d.setHours(0, 0, 0, 0);

    const start30d = new Date(now);
    start30d.setDate(start30d.getDate() - 29);
    start30d.setHours(0, 0, 0, 0);

    const allEventTypes = Array.from(
      new Set(GROUPS.flatMap((g) => g.metrics.map((m) => m.eventType))),
    );

    const rows = await db
      .collection("flow_events")
      .aggregate([
        {
          $match: {
            eventType: { $in: allEventTypes },
            createdAt: { $gte: start30d },
          },
        },
        {
          $group: {
            _id: {
              eventType: "$eventType",
              pageRoute: { $ifNull: ["$pageRoute", null] },
            },
            today: {
              $sum: {
                $cond: [{ $gte: ["$createdAt", startToday] }, 1, 0],
              },
            },
            last7d: {
              $sum: {
                $cond: [{ $gte: ["$createdAt", start7d] }, 1, 0],
              },
            },
            last30d: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const countMap = new Map<string, WindowCounts>();
    for (const r of rows) {
      const eventType = String(r?._id?.eventType || "");
      const pageRoute =
        typeof r?._id?.pageRoute === "string" ? r._id.pageRoute : "";
      const key = `${eventType}::${pageRoute}`;
      const eventOnlyKey = `${eventType}::`;
      const counts = {
        today: Number(r.today || 0),
        last7d: Number(r.last7d || 0),
        last30d: Number(r.last30d || 0),
      };
      countMap.set(key, counts);

      const prev = countMap.get(eventOnlyKey) || emptyCounts();
      countMap.set(eventOnlyKey, {
        today: prev.today + counts.today,
        last7d: prev.last7d + counts.last7d,
        last30d: prev.last30d + counts.last30d,
      });
    }

    const getCounts = (eventType: string, pageRoute?: string) => {
      if (pageRoute) {
        return countMap.get(`${eventType}::${pageRoute}`) || emptyCounts();
      }
      return countMap.get(`${eventType}::`) || emptyCounts();
    };

    const groups = GROUPS.map((group) => {
      const metrics: MetricRow[] = group.metrics.map((m) => ({
        eventType: m.pageRoute
          ? `${m.eventType} @ ${m.pageRoute}`
          : m.eventType,
        label: m.label,
        counts: getCounts(m.eventType, m.pageRoute),
      }));

      const totals = metrics.reduce((acc, m) => {
        acc.today += m.counts.today;
        acc.last7d += m.counts.last7d;
        acc.last30d += m.counts.last30d;
        return acc;
      }, emptyCounts());

      return {
        key: group.key,
        title: group.title,
        totals,
        metrics,
      };
    });

    const get = (eventType: string) =>
      countMap.get(`${eventType}::`) || emptyCounts();

    const kpis = {
      discoverySearchSubmitted: get("homepage_search_submitted"),
      missionStudentActions: get("student_opportunity_action_started"),
      musicSubmitted: get("music_onboarding_submitted"),
      advertisingCompleted: get("advertising_submission_completed"),
      sellerSubmitted: get("seller_onboarding_submitted"),
      jobApplicationsSubmitted: get("job_application_submitted"),
      consultingCompleted: get("consulting_submission_completed"),
      marketplacePurchasesCompleted: get("marketplace_purchase_completed"),
    };

    const conversions = {
      searchSubmittedToResultClicked: {
        today: ratio(
          get("search_result_clicked").today,
          get("homepage_search_submitted").today,
        ),
        last7d: ratio(
          get("search_result_clicked").last7d,
          get("homepage_search_submitted").last7d,
        ),
        last30d: ratio(
          get("search_result_clicked").last30d,
          get("homepage_search_submitted").last30d,
        ),
      },
      advertisingOptionToCompleted: {
        today: ratio(
          get("advertising_submission_completed").today,
          get("advertising_option_selected").today,
        ),
        last7d: ratio(
          get("advertising_submission_completed").last7d,
          get("advertising_option_selected").last7d,
        ),
        last30d: ratio(
          get("advertising_submission_completed").last30d,
          get("advertising_option_selected").last30d,
        ),
      },
      sellerStartedToSubmitted: {
        today: ratio(
          get("seller_onboarding_submitted").today,
          get("seller_onboarding_started").today,
        ),
        last7d: ratio(
          get("seller_onboarding_submitted").last7d,
          get("seller_onboarding_started").last7d,
        ),
        last30d: ratio(
          get("seller_onboarding_submitted").last30d,
          get("seller_onboarding_started").last30d,
        ),
      },
      checkoutCreatedToPurchaseCompleted: {
        today: ratio(
          get("marketplace_purchase_completed").today,
          get("marketplace_checkout_created").today,
        ),
        last7d: ratio(
          get("marketplace_purchase_completed").last7d,
          get("marketplace_checkout_created").last7d,
        ),
        last30d: ratio(
          get("marketplace_purchase_completed").last30d,
          get("marketplace_checkout_created").last30d,
        ),
      },
    };

    return res.status(200).json({
      generatedAt: now.toISOString(),
      windows: {
        todayStart: startToday.toISOString(),
        last7dStart: start7d.toISOString(),
        last30dStart: start30d.toISOString(),
      },
      kpis,
      conversions,
      groups,
    });
  } catch (error) {
    console.error("[/api/admin/phase1-scoreboard]", error);
    return adminFail(
      res,
      500,
      ADMIN_ERROR_CODES.INTERNAL_ERROR,
      "Internal Server Error",
    );
  }
}
