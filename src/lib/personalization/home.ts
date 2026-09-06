// src/lib/personalization/home.ts
//
// P4-01 Personalized Home.
//
// Composes the existing Person360 identity resolver with real recent
// activity and the P4-07 recommendation engine into a single role-aware
// "what should this person do next" payload. No new identity or activity
// concepts are introduced -- this is a read model over Phase 0-3
// foundations (Person360, Activity360, Recommendations).

import type { Db } from "mongodb";
import { resolvePerson360 } from "@/lib/person360";
import { resolveRecommendations } from "@/lib/personalization/recommendations";

export type PersonalizedHomeAction = {
  id: string;
  title: string;
  body: string;
  href: string;
  cta: string;
};

export type PersonalizedHomeResult =
  | {
      ok: true;
      fullName: string | null;
      roles: string[];
      membershipState: string;
      blackCardActive: boolean;
      hasActivity: boolean;
      recentEventTypes: string[];
      businesses: {
        businessId: string;
        name: string | null;
        relationshipTypes: string[];
      }[];
      nextActions: PersonalizedHomeAction[];
      recommendations: Awaited<ReturnType<typeof resolveRecommendations>>;
    }
  | { ok: false; code: string; message: string };

export async function resolvePersonalizedHome(
  db: Db,
  input: { userId: string },
): Promise<PersonalizedHomeResult> {
  const person = await resolvePerson360(db, {
    userId: input.userId,
    includeBusiness360: false,
  });

  if (!person.ok) {
    return { ok: false, code: person.code, message: person.message };
  }

  const recommendations = await resolveRecommendations(db, {
    userId: input.userId,
    limit: 6,
  });

  const actions: PersonalizedHomeAction[] = [];

  if (!person.membership.isPremiumMember) {
    actions.push({
      id: "upgrade_premium",
      title: "Upgrade to Premium",
      body: "Unlock Black Card benefits and support Black economic power.",
      href: "/pricing",
      cta: "View plans",
    });
  } else if (!person.blackCard.hasActiveCardSignal) {
    actions.push({
      id: "activate_black_card",
      title: "Activate your Black Card",
      body: "Your Premium membership qualifies you for a Black Card.",
      href: "/black-card/join",
      cta: "Request Black Card",
    });
  }

  const ownedBusinesses = person.businessRelationships.filter((r) =>
    r.relationshipTypes.some((t) =>
      ["OWNER", "VERIFIED_REPRESENTATIVE", "MANAGER"].includes(t),
    ),
  );
  if (ownedBusinesses.length) {
    actions.push({
      id: "view_growth_center",
      title: "Check your Business Growth Command Center",
      body: "See real profile views, revenue, and next steps for your business.",
      href: "/dashboard",
      cta: "Open growth center",
    });
  }

  if (person.roles.includes("SELLER") || person.roles.includes("CREATOR")) {
    actions.push({
      id: "view_creator_dashboard",
      title: "Review your creator performance",
      body: "Track real sales and buyer engagement on your listings.",
      href: "/creator/dashboard",
      cta: "Open creator dashboard",
    });
  }

  if (person.roles.includes("EMPLOYER")) {
    actions.push({
      id: "review_applicants",
      title: "Review your applicants",
      body: "Real candidates are waiting on your open roles.",
      href: "/employer/applicants",
      cta: "Review applicants",
    });
  }

  if (person.activity.flowEventCount === 0) {
    actions.push({
      id: "explore_directory",
      title: "Explore Black-owned businesses",
      body: "Start browsing so BWE can personalize recommendations for you.",
      href: "/business-directory",
      cta: "Browse directory",
    });
  }

  if (!actions.length) {
    actions.push({
      id: "keep_momentum",
      title: "Keep exploring BWE",
      body: "Track your activity, jobs, and community impact in one place.",
      href: "/dashboard",
      cta: "Go to dashboard",
    });
  }

  return {
    ok: true,
    fullName: person.identity.fullName,
    roles: person.roles,
    membershipState: person.membership.state,
    blackCardActive: person.blackCard.hasActiveCardSignal,
    hasActivity: person.activity.flowEventCount > 0,
    recentEventTypes: person.activity.recentEventTypes,
    businesses: person.businessRelationships.map((r) => ({
      businessId: r.businessId,
      name: r.businessSummary?.name ?? null,
      relationshipTypes: r.relationshipTypes,
    })),
    nextActions: actions.slice(0, 4),
    recommendations,
  };
}
