#!/usr/bin/env node

const baseUrl = process.env.BASE_URL || "http://localhost:3000";

const checks = [
  { name: "public_home", path: "/", expect: [200] },
  { name: "login_page", path: "/login", expect: [200] },
  { name: "signup_page", path: "/signup", expect: [200] },
  { name: "forgot_password_page", path: "/forgot-password", expect: [200] },
  { name: "auth_me_anon", path: "/api/auth/me", expect: [401] },
  { name: "profile_anon", path: "/api/profile", expect: [401] },
  { name: "black_card_member_summary_anon", path: "/api/black-card/member-summary", expect: [401] },
  { name: "admin_black_card_anon", path: "/admin/black-card", expect: [307, 302] },
  { name: "dashboard_black_card_anon", path: "/dashboard/black-card", expect: [307, 302] },
  { name: "wealth_builder_dashboard_anon", path: "/wealth-builder/dashboard", expect: [307, 302] },
];

async function run() {
  const startedAt = new Date().toISOString();
  const results = [];

  for (const check of checks) {
    const url = `${baseUrl}${check.path}`;
    let status = 0;
    let location = null;
    let error = null;

    try {
      const res = await fetch(url, { redirect: "manual" });
      status = res.status;
      location = res.headers.get("location");
    } catch (err) {
      error = String(err?.message || err);
    }

    const pass = check.expect.includes(status);
    results.push({
      ...check,
      url,
      status,
      location,
      pass,
      error,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const summary = {
    startedAt,
    baseUrl,
    totals: {
      total: results.length,
      passed,
      failed: results.length - passed,
    },
    results,
  };

  console.log(JSON.stringify(summary, null, 2));

  if (summary.totals.failed > 0) {
    process.exitCode = 1;
  }
}

run();
