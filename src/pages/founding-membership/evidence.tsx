import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";

type MatchField = {
  currentListingValue: string | null;
  claimantProvidedValue: string | null;
  normalizedMatchResult: "MATCH" | "MISMATCH" | "UNKNOWN";
};

type ClaimIntakePayload = {
  business: {
    businessName: MatchField;
    addressLine1: MatchField;
    city: MatchField;
    state: MatchField;
    postalCode: MatchField;
    phone: MatchField;
    website: MatchField;
    businessEmail: MatchField;
    socialUrls: MatchField[];
  };
  claimant: {
    claimantName: string | null;
    claimantEmail: string | null;
    claimantPhone: string | null;
    relationshipToBusiness:
      | "OWNER"
      | "OFFICER"
      | "AUTHORIZED_REPRESENTATIVE"
      | "OTHER"
      | null;
    roleTitle: string | null;
  };
  evidence: Array<{
    evidenceType: string;
    purpose: string;
    storageKey: string;
    redactedLabel: string;
    notes: string | null;
  }>;
};

type Payload = {
  ok: boolean;
  membership?: {
    membershipId: string;
    membershipName: string;
    reviewStatus: string | null;
    evidencePortalStatus: string | null;
  };
  currentListing?: {
    businessName?: string | null;
    addressLine1?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    phone?: string | null;
    website?: string | null;
    businessEmail?: string | null;
    socialUrls?: string[];
  };
  claimIntake?: ClaimIntakePayload;
  fieldAudit?: Array<{
    field: string;
    required: boolean;
    usedByDa13Engine: boolean;
  }>;
  legacyVerified?: boolean;
};

type FormState = {
  businessName: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  website: string;
  businessEmail: string;
  socialUrls: string;
  claimantName: string;
  claimantEmail: string;
  claimantPhone: string;
  relationshipToBusiness: string;
  roleTitle: string;
  evidence: Array<{
    evidenceType: string;
    purpose: string;
    storageKey: string;
    redactedLabel: string;
    notes: string;
  }>;
};

type BusinessFieldKey =
  | "businessName"
  | "addressLine1"
  | "city"
  | "state"
  | "postalCode"
  | "phone"
  | "website"
  | "businessEmail";

const BLANK_EVIDENCE = {
  evidenceType: "written_owner_or_officer_authorization",
  purpose: "ownership_control",
  storageKey: "",
  redactedLabel: "",
  notes: "",
};

function fieldTone(value: string | null | undefined) {
  if (value === "MATCH") return "text-emerald-300";
  if (value === "MISMATCH") return "text-red-300";
  return "text-yellow-300";
}

export default function FoundingMembershipEvidencePage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<FormState>({
    businessName: "",
    addressLine1: "",
    city: "",
    state: "",
    postalCode: "",
    phone: "",
    website: "",
    businessEmail: "",
    socialUrls: "",
    claimantName: "",
    claimantEmail: "",
    claimantPhone: "",
    relationshipToBusiness: "",
    roleTitle: "",
    evidence: [{ ...BLANK_EVIDENCE }],
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/founding-membership/evidence", {
          credentials: "include",
          cache: "no-store",
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || "Unable to load ownership evidence");
        }
        setData(json);
        const intake = json.claimIntake;
        setForm({
          businessName:
            intake?.business?.businessName?.claimantProvidedValue || "",
          addressLine1:
            intake?.business?.addressLine1?.claimantProvidedValue || "",
          city: intake?.business?.city?.claimantProvidedValue || "",
          state: intake?.business?.state?.claimantProvidedValue || "",
          postalCode: intake?.business?.postalCode?.claimantProvidedValue || "",
          phone: intake?.business?.phone?.claimantProvidedValue || "",
          website: intake?.business?.website?.claimantProvidedValue || "",
          businessEmail:
            intake?.business?.businessEmail?.claimantProvidedValue || "",
          socialUrls: Array.isArray(intake?.business?.socialUrls)
            ? intake.business.socialUrls
                .map((item: MatchField) => item.claimantProvidedValue)
                .filter(Boolean)
                .join("\n")
            : "",
          claimantName: intake?.claimant?.claimantName || "",
          claimantEmail: intake?.claimant?.claimantEmail || "",
          claimantPhone: intake?.claimant?.claimantPhone || "",
          relationshipToBusiness:
            intake?.claimant?.relationshipToBusiness || "",
          roleTitle: intake?.claimant?.roleTitle || "",
          evidence:
            Array.isArray(intake?.evidence) && intake.evidence.length
              ? intake.evidence.map((item: any) => ({
                  evidenceType: item.evidenceType || "other",
                  purpose: item.purpose || "ownership_control",
                  storageKey: item.storageKey || "",
                  redactedLabel: item.redactedLabel || "",
                  notes: item.notes || "",
                }))
              : [{ ...BLANK_EVIDENCE }],
        });
      } catch (err: any) {
        setError(err?.message || "Unable to load ownership evidence");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const requiredHint = useMemo(() => {
    if (form.relationshipToBusiness === "AUTHORIZED_REPRESENTATIVE") {
      return "Representative authority evidence is required for authorized representatives.";
    }
    if (
      form.relationshipToBusiness === "OWNER" ||
      form.relationshipToBusiness === "OFFICER"
    ) {
      return "Ownership/control evidence is required for owners and officers.";
    }
    return "Declare your relationship to the business so BWE can determine the right evidence requirements.";
  }, [form.relationshipToBusiness]);

  const businessFields: Array<{
    label: string;
    key: BusinessFieldKey;
    match: "MATCH" | "MISMATCH" | "UNKNOWN" | undefined;
  }> = [
    {
      label: "Business name",
      key: "businessName",
      match: data?.claimIntake?.business?.businessName?.normalizedMatchResult,
    },
    {
      label: "Address line 1",
      key: "addressLine1",
      match: data?.claimIntake?.business?.addressLine1?.normalizedMatchResult,
    },
    {
      label: "City",
      key: "city",
      match: data?.claimIntake?.business?.city?.normalizedMatchResult,
    },
    {
      label: "State",
      key: "state",
      match: data?.claimIntake?.business?.state?.normalizedMatchResult,
    },
    {
      label: "Postal code",
      key: "postalCode",
      match: data?.claimIntake?.business?.postalCode?.normalizedMatchResult,
    },
    {
      label: "Phone",
      key: "phone",
      match: data?.claimIntake?.business?.phone?.normalizedMatchResult,
    },
    {
      label: "Website",
      key: "website",
      match: data?.claimIntake?.business?.website?.normalizedMatchResult,
    },
    {
      label: "Business email",
      key: "businessEmail",
      match: data?.claimIntake?.business?.businessEmail?.normalizedMatchResult,
    },
  ];

  async function save() {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/founding-membership/evidence", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimantValues: {
            businessName: form.businessName,
            addressLine1: form.addressLine1,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            phone: form.phone,
            website: form.website,
            businessEmail: form.businessEmail,
            socialUrls: form.socialUrls,
            claimantName: form.claimantName,
            claimantEmail: form.claimantEmail,
            claimantPhone: form.claimantPhone,
            relationshipToBusiness: form.relationshipToBusiness,
            roleTitle: form.roleTitle,
          },
          evidence: form.evidence,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Unable to save ownership evidence");
      }
      setMessage(
        "Ownership evidence intake saved. Public listing data remains unchanged until verification.",
      );
    } catch (err: any) {
      setError(err?.message || "Unable to save ownership evidence");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Head>
        <title>Ownership Evidence | BWE</title>
      </Head>
      <main className="min-h-screen bg-black px-4 py-10 text-white">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h1 className="text-2xl font-bold text-yellow-300">
              Ownership Evidence Intake
            </h1>
            <p className="mt-3 text-white/75">
              Confirm business information, identify your relationship to the
              business, and attach structured evidence metadata. Your submitted
              values do not rewrite the public listing before verification.
            </p>
            <div className="mt-4 flex gap-3">
              <Link
                href="/founding-membership/status"
                className="rounded-xl border border-yellow-500/40 px-4 py-2 font-bold text-yellow-300"
              >
                Back to Membership Status
              </Link>
            </div>
          </div>

          {loading ? <div>Loading…</div> : null}
          {error ? (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-100">
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100">
              {message}
            </div>
          ) : null}

          {data?.legacyVerified ? (
            <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4 text-sky-100">
              This membership already appears to be historically verified. Phase
              4 preserves legacy verified ownership and uses this intake
              structure for future verification readiness rather than
              retroactive invalidation.
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-bold text-white">
                Current listing data
              </h2>
              <div className="mt-4 space-y-3 text-sm text-white/75">
                <div>
                  Business name: {data?.currentListing?.businessName || "-"}
                </div>
                <div>Address: {data?.currentListing?.addressLine1 || "-"}</div>
                <div>
                  City / State / ZIP:{" "}
                  {[
                    data?.currentListing?.city,
                    data?.currentListing?.state,
                    data?.currentListing?.postalCode,
                  ]
                    .filter(Boolean)
                    .join(" / ") || "-"}
                </div>
                <div>Phone: {data?.currentListing?.phone || "-"}</div>
                <div>Website: {data?.currentListing?.website || "-"}</div>
                <div>
                  Business email: {data?.currentListing?.businessEmail || "-"}
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-bold text-white">
                DA-13 intake readiness
              </h2>
              <div className="mt-4 space-y-2 text-sm text-white/75">
                {(data?.fieldAudit || []).map((item) => (
                  <div
                    key={item.field}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/25 px-3 py-2"
                  >
                    <span>{item.field}</span>
                    <span className="text-xs text-white/55">
                      {item.required ? "Required" : "Optional"} ·{" "}
                      {item.usedByDa13Engine
                        ? "Used by engine"
                        : "Stored for admin"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold text-white">
              Claimant-provided business confirmation
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {businessFields.map(({ label, key, match }) => (
                <label key={key} className="block">
                  <div className="mb-1 text-sm text-white/60">{label}</div>
                  <input
                    value={form[key] || ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [key]: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none"
                  />
                  <div
                    className={`mt-1 text-xs ${fieldTone(String(match || "UNKNOWN"))}`}
                  >
                    Current normalized comparison: {match || "UNKNOWN"}
                  </div>
                </label>
              ))}
            </div>
            <label className="mt-4 block">
              <div className="mb-1 text-sm text-white/60">Social URLs</div>
              <textarea
                value={form.socialUrls}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    socialUrls: event.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none"
              />
            </label>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold text-white">Claimant authority</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="block">
                <div className="mb-1 text-sm text-white/60">Claimant name</div>
                <input
                  value={form.claimantName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      claimantName: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-sm text-white/60">Claimant email</div>
                <input
                  value={form.claimantEmail}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      claimantEmail: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-sm text-white/60">Claimant phone</div>
                <input
                  value={form.claimantPhone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      claimantPhone: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none"
                />
              </label>
              <label className="block">
                <div className="mb-1 text-sm text-white/60">
                  Relationship to business
                </div>
                <select
                  value={form.relationshipToBusiness}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      relationshipToBusiness: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none"
                >
                  <option value="">Select relationship</option>
                  <option value="OWNER">Owner</option>
                  <option value="OFFICER">Officer</option>
                  <option value="AUTHORIZED_REPRESENTATIVE">
                    Authorized Representative
                  </option>
                  <option value="OTHER">Other approved relationship</option>
                </select>
              </label>
            </div>
            <label className="mt-4 block">
              <div className="mb-1 text-sm text-white/60">Role / title</div>
              <input
                value={form.roleTitle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    roleTitle: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none"
              />
            </label>
            <p className="mt-3 text-sm text-yellow-200">{requiredHint}</p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-white">
                Evidence metadata
              </h2>
              <button
                type="button"
                onClick={() =>
                  setForm((current) => ({
                    ...current,
                    evidence: [...current.evidence, { ...BLANK_EVIDENCE }],
                  }))
                }
                className="rounded-xl border border-white/15 px-3 py-2 text-sm font-bold text-white/85"
              >
                Add evidence
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {form.evidence.map((item, index) => (
                <div
                  key={`${index}:${item.storageKey}`}
                  className="rounded-2xl border border-white/10 bg-black/25 p-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block">
                      <div className="mb-1 text-sm text-white/60">
                        Evidence type
                      </div>
                      <select
                        value={item.evidenceType}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            evidence: current.evidence.map(
                              (entry, entryIndex) =>
                                entryIndex === index
                                  ? {
                                      ...entry,
                                      evidenceType: event.target.value,
                                    }
                                  : entry,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none"
                      >
                        <option value="written_owner_or_officer_authorization">
                          Written owner/officer authorization
                        </option>
                        <option value="formation_document">
                          Formation document
                        </option>
                        <option value="business_license">
                          Business license
                        </option>
                        <option value="website_domain_email">
                          Website/domain email
                        </option>
                        <option value="listed_business_phone">
                          Listed business phone
                        </option>
                        <option value="official_website_or_social_account">
                          Official website or social account
                        </option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label className="block">
                      <div className="mb-1 text-sm text-white/60">
                        Evidence purpose
                      </div>
                      <select
                        value={item.purpose}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            evidence: current.evidence.map(
                              (entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, purpose: event.target.value }
                                  : entry,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none"
                      >
                        <option value="ownership_control">
                          Ownership / control
                        </option>
                        <option value="representative_authority">
                          Representative authority
                        </option>
                        <option value="business_identity">
                          Business identity
                        </option>
                      </select>
                    </label>
                    <label className="block">
                      <div className="mb-1 text-sm text-white/60">
                        Evidence reference / storage key
                      </div>
                      <input
                        value={item.storageKey}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            evidence: current.evidence.map(
                              (entry, entryIndex) =>
                                entryIndex === index
                                  ? { ...entry, storageKey: event.target.value }
                                  : entry,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none"
                      />
                    </label>
                    <label className="block">
                      <div className="mb-1 text-sm text-white/60">
                        Redacted label
                      </div>
                      <input
                        value={item.redactedLabel}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            evidence: current.evidence.map(
                              (entry, entryIndex) =>
                                entryIndex === index
                                  ? {
                                      ...entry,
                                      redactedLabel: event.target.value,
                                    }
                                  : entry,
                            ),
                          }))
                        }
                        className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none"
                      />
                    </label>
                  </div>
                  <label className="mt-4 block">
                    <div className="mb-1 text-sm text-white/60">Notes</div>
                    <textarea
                      value={item.notes}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          evidence: current.evidence.map((entry, entryIndex) =>
                            entryIndex === index
                              ? { ...entry, notes: event.target.value }
                              : entry,
                          ),
                        }))
                      }
                      rows={3}
                      className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-white outline-none"
                    />
                  </label>
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-yellow-500 px-5 py-3 font-bold text-black disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save intake evidence"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    const token = context.req.cookies?.session_token;
    if (!token) {
      return {
        redirect: {
          destination: "/login?redirect=%2Ffounding-membership%2Fevidence",
          permanent: false,
        },
      };
    }

    return { props: {} };
  } catch (error) {
    console.error("[route-diagnostic][founding-membership/evidence][gssp]", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : null,
    });
    throw error;
  }
};
