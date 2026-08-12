"use client";

import React, { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { normalizeOptionalUrl } from "@/lib/businessSubmission";

type OwnerDraft = {
  ownerName: string;
  ownershipPercentage: string;
  roleTitle: string;
  controlRole: string;
  isBlackAttested: boolean;
  attestationDate: string;
  ownershipEvidenceIds: string;
  controlEvidenceIds: string;
};

type EvidenceDraft = {
  evidenceId: string;
  evidenceType: string;
  purpose: string;
  reference: string;
  sourceLabel: string;
  ownerName: string;
  businessName: string;
  ownershipPercentage: string;
};

function createEmptyOwner(): OwnerDraft {
  return {
    ownerName: "",
    ownershipPercentage: "",
    roleTitle: "",
    controlRole: "",
    isBlackAttested: false,
    attestationDate: "",
    ownershipEvidenceIds: "",
    controlEvidenceIds: "",
  };
}

function createEmptyEvidence(): EvidenceDraft {
  return {
    evidenceId: "",
    evidenceType: "ownership_attestation",
    purpose: "ownership",
    reference: "",
    sourceLabel: "applicant_submission",
    ownerName: "",
    businessName: "",
    ownershipPercentage: "",
  };
}

function splitIds(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildEvidenceId(index: number) {
  return `evidence-${index + 1}`;
}

function normalizeEvidenceRefs(value: string) {
  return splitIds(value).map((item) => {
    const normalized = item.toLowerCase();
    const directMatch = normalized.match(/^evidence-(\d+)$/);
    if (directMatch) return `evidence-${directMatch[1]}`;

    const documentMatch = normalized.match(/^(?:document|doc)\s*-?\s*(\d+)$/);
    if (documentMatch) return buildEvidenceId(Number(documentMatch[1]) - 1);

    const numberMatch = normalized.match(/^#?(\d+)$/);
    if (numberMatch) return buildEvidenceId(Number(numberMatch[1]) - 1);

    return item;
  });
}

export default function AddBusinessForm() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [facebook, setFacebook] = useState("");
  const [twitter, setTwitter] = useState("");
  const [claimantName, setClaimantName] = useState("");
  const [claimantEmail, setClaimantEmail] = useState("");
  const [claimantPhone, setClaimantPhone] = useState("");
  const [relationshipToBusiness, setRelationshipToBusiness] = useState("OWNER");
  const [claimantRoleTitle, setClaimantRoleTitle] = useState("");
  const [owners, setOwners] = useState<OwnerDraft[]>([createEmptyOwner()]);
  const [evidence, setEvidence] = useState<EvidenceDraft[]>([
    createEmptyEvidence(),
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [verificationSummary, setVerificationSummary] = useState<string | null>(
    null,
  );
  const [requiredActions, setRequiredActions] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      return;
    }

    const nextUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextUrl;
    });

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [logoFile]);

  function clearSelectedImage() {
    setLogoFile(null);
    setImageError(null);
    setLogoPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = e.target.files?.[0] || null;
    setLogoFile(nextFile);
    setImageError(null);
    setError(null);
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function updateOwner(
    index: number,
    field: keyof OwnerDraft,
    value: string | boolean,
  ) {
    setOwners((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  function updateEvidence(
    index: number,
    field: keyof EvidenceDraft,
    value: string,
  ) {
    setEvidence((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item,
      ),
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setImageError(null);
    setSuccessMessage(null);
    setVerificationSummary(null);
    setRequiredActions([]);

    try {
      const formData = new FormData();
      formData.append("businessName", businessName.trim());
      formData.append("category", category.trim().toLowerCase());
      formData.append("location", location.trim());
      formData.append("addressLine1", addressLine1.trim());
      formData.append("city", city.trim());
      formData.append("state", state.trim().toUpperCase());
      formData.append("postalCode", postalCode.trim());
      formData.append("phone", phone.trim());
      formData.append("email", email.trim().toLowerCase());
      formData.append("businessEmail", businessEmail.trim().toLowerCase());
      formData.append("website", normalizeOptionalUrl(website));
      formData.append("description", description.trim());
      formData.append("claimantName", claimantName.trim());
      formData.append("claimantEmail", claimantEmail.trim().toLowerCase());
      formData.append("claimantPhone", claimantPhone.trim());
      formData.append("relationshipToBusiness", relationshipToBusiness);
      formData.append("claimantRoleTitle", claimantRoleTitle.trim());
      if (logoFile) {
        formData.append("logo", logoFile);
      }
      formData.append("facebook", normalizeOptionalUrl(facebook));
      formData.append("twitter", normalizeOptionalUrl(twitter));
      formData.append(
        "owners",
        JSON.stringify(
          owners.map((owner) => ({
            ...owner,
            ownershipEvidenceIds: normalizeEvidenceRefs(
              owner.ownershipEvidenceIds,
            ),
            controlEvidenceIds: normalizeEvidenceRefs(owner.controlEvidenceIds),
          })),
        ),
      );
      formData.append(
        "evidence",
        JSON.stringify(
          evidence.map((item, index) => ({
            ...item,
            evidenceId: item.evidenceId.trim() || buildEvidenceId(index),
          })),
        ),
      );

      const res = await fetch("/api/business/create", {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const message =
          data?.error ||
          data?.message ||
          "We could not submit your business. Please check your information and try again.";
        if (logoFile) {
          setImageError(message);
        }
        throw new Error(message);
      }

      clearSelectedImage();
      setSuccessMessage(
        data?.message ||
          "Your business was submitted for automated verification.",
      );
      setVerificationSummary(data?.verificationSummary || null);
      setRequiredActions(
        Array.isArray(data?.requiredActions)
          ? data.requiredActions
              .map((item: { message?: string }) => item?.message || "")
              .filter(Boolean)
          : [],
      );

      setTimeout(() => {
        router.push("/business-directory");
      }, 2600);
    } catch (err: any) {
      setError(
        err?.message ||
          "We could not submit your business. Please check your information and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (successMessage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4 sm:p-8">
        <div className="w-full max-w-2xl bg-gray-800 p-6 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold text-gold mb-4">
            Business Submitted
          </h2>
          <p className="text-gray-300 mb-4 leading-relaxed">{successMessage}</p>
          {verificationSummary ? (
            <p className="mb-4 rounded-lg border border-gold/20 bg-gold/10 px-4 py-3 text-sm text-gold-100">
              {verificationSummary}
            </p>
          ) : null}
          {requiredActions.length ? (
            <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-left text-sm text-yellow-100">
              <p className="mb-2 font-semibold">
                Automated follow-up still needed:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                {requiredActions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <button
            onClick={() => router.push("/business-directory")}
            className="px-4 py-2 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition"
          >
            Go to Directory
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white min-h-screen p-4 sm:p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl sm:text-4xl font-bold text-gold">
          Add Your Business
        </h1>
      </header>

      <div className="max-w-5xl mx-auto bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm sm:text-base text-red-200 leading-relaxed">
            <strong className="block text-red-100">
              We couldn’t submit your business yet.
            </strong>
            <span>{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          className="space-y-5"
        >
          <fieldset>
            <legend className="text-xl font-bold text-gold">
              Business Information
            </legend>
            <label className="block mt-3">
              <span className="block">Business Name</span>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-3">
              <span className="block">Category</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              >
                <option value="">Select Category</option>
                <option value="tech">Tech</option>
                <option value="beauty">Beauty</option>
                <option value="food">Food</option>
                <option value="fashion">Fashion</option>
                <option value="professional-services">
                  Professional Services
                </option>
              </select>
            </label>
            <label className="block mt-3">
              <span className="block">Location</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, State (for example: Allentown, PA)"
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2 mt-3">
              <label className="block">
                <span className="block">Address Line 1</span>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                />
              </label>
              <label className="block">
                <span className="block">City</span>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                />
              </label>
              <label className="block">
                <span className="block">State</span>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  maxLength={2}
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                />
              </label>
              <label className="block">
                <span className="block">Postal Code</span>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xl font-bold text-gold">
              Contact Information
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block mt-3">
                <span className="block">Phone Number</span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                />
              </label>
              <label className="block mt-3">
                <span className="block">Primary Email Address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                />
              </label>
              <label className="block mt-3">
                <span className="block">Business Contact Email</span>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  required
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                />
              </label>
              <label className="block mt-3">
                <span className="block">
                  Website URL <span className="text-gray-400">(optional)</span>
                </span>
                <input
                  type="text"
                  inputMode="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="yourbusiness.com"
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xl font-bold text-gold">
              Claimant Information
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block mt-3">
                <span className="block">Claimant Name</span>
                <input
                  type="text"
                  value={claimantName}
                  onChange={(e) => setClaimantName(e.target.value)}
                  required
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                />
              </label>
              <label className="block mt-3">
                <span className="block">Claimant Email</span>
                <input
                  type="email"
                  value={claimantEmail}
                  onChange={(e) => setClaimantEmail(e.target.value)}
                  required
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                />
              </label>
              <label className="block mt-3">
                <span className="block">Claimant Phone</span>
                <input
                  type="tel"
                  value={claimantPhone}
                  onChange={(e) => setClaimantPhone(e.target.value)}
                  required
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                />
              </label>
              <label className="block mt-3">
                <span className="block">Relationship to Business</span>
                <select
                  value={relationshipToBusiness}
                  onChange={(e) => setRelationshipToBusiness(e.target.value)}
                  required
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                >
                  <option value="OWNER">Owner</option>
                  <option value="OFFICER">Officer</option>
                  <option value="AUTHORIZED_REPRESENTATIVE">
                    Authorized Representative
                  </option>
                </select>
              </label>
              <label className="block mt-3 sm:col-span-2">
                <span className="block">Claimant Role / Title</span>
                <input
                  type="text"
                  value={claimantRoleTitle}
                  onChange={(e) => setClaimantRoleTitle(e.target.value)}
                  className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                />
              </label>
            </div>
          </fieldset>

          <fieldset>
            <div className="flex items-center justify-between">
              <legend className="text-xl font-bold text-gold">
                Qualifying Owners
              </legend>
              <button
                type="button"
                onClick={() =>
                  setOwners((current) => [...current, createEmptyOwner()])
                }
                className="rounded bg-gray-700 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-600"
              >
                Add Owner
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              Add every qualifying owner and note which supporting documents
              show that person&apos;s ownership and control.
            </p>
            <div className="space-y-4 mt-4">
              {owners.map((owner, index) => (
                <div
                  key={`owner-${index}`}
                  className="rounded-lg border border-gray-700 bg-gray-900/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gold">
                      Owner {index + 1}
                    </h3>
                    {owners.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOwners((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                        className="text-sm text-red-300 hover:text-red-200"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 mt-3">
                    <label className="block">
                      <span className="block">Owner Name</span>
                      <input
                        type="text"
                        value={owner.ownerName}
                        onChange={(e) =>
                          updateOwner(index, "ownerName", e.target.value)
                        }
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      />
                    </label>
                    <label className="block">
                      <span className="block">Ownership Percentage</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={owner.ownershipPercentage}
                        onChange={(e) =>
                          updateOwner(
                            index,
                            "ownershipPercentage",
                            e.target.value,
                          )
                        }
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      />
                    </label>
                    <label className="block">
                      <span className="block">Role / Title</span>
                      <input
                        type="text"
                        value={owner.roleTitle}
                        onChange={(e) =>
                          updateOwner(index, "roleTitle", e.target.value)
                        }
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      />
                    </label>
                    <label className="block">
                      <span className="block">Control / Management Role</span>
                      <input
                        type="text"
                        value={owner.controlRole}
                        onChange={(e) =>
                          updateOwner(index, "controlRole", e.target.value)
                        }
                        placeholder="Founder, CEO, Managing Member"
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      />
                    </label>
                    <label className="block">
                      <span className="block">Attestation Date</span>
                      <input
                        type="date"
                        value={owner.attestationDate}
                        onChange={(e) =>
                          updateOwner(index, "attestationDate", e.target.value)
                        }
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      />
                    </label>
                    <label className="flex items-center gap-3 pt-8">
                      <input
                        type="checkbox"
                        checked={owner.isBlackAttested}
                        onChange={(e) =>
                          updateOwner(
                            index,
                            "isBlackAttested",
                            e.target.checked,
                          )
                        }
                        className="h-4 w-4"
                      />
                      <span>Owner has completed Black self-attestation</span>
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="block">
                        Ownership documents for this owner{" "}
                        <span className="text-gray-400">
                          (for example: Document 1, Document 2)
                        </span>
                      </span>
                      <input
                        type="text"
                        value={owner.ownershipEvidenceIds}
                        onChange={(e) =>
                          updateOwner(
                            index,
                            "ownershipEvidenceIds",
                            e.target.value,
                          )
                        }
                        placeholder="Document 1, Document 2"
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      />
                    </label>
                    <label className="block sm:col-span-2">
                      <span className="block">
                        Control documents for this owner{" "}
                        <span className="text-gray-400">
                          (for example: Document 1)
                        </span>
                      </span>
                      <input
                        type="text"
                        value={owner.controlEvidenceIds}
                        onChange={(e) =>
                          updateOwner(
                            index,
                            "controlEvidenceIds",
                            e.target.value,
                          )
                        }
                        placeholder="Document 1"
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <div className="flex items-center justify-between">
              <legend className="text-xl font-bold text-gold">
                Supporting Documents
              </legend>
              <button
                type="button"
                onClick={() =>
                  setEvidence((current) => [...current, createEmptyEvidence()])
                }
                className="rounded bg-gray-700 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-600"
              >
                Add Evidence
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-400">
              Add the documents or references that support ownership, control,
              representative authority, business legitimacy, or Black
              self-attestation. Use the document number shown on each card when
              you connect a document to an owner above.
            </p>
            <div className="space-y-4 mt-4">
              {evidence.map((item, index) => (
                <div
                  key={`evidence-${index}`}
                  className="rounded-lg border border-gray-700 bg-gray-900/50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gold">
                      Document {index + 1}
                    </h3>
                    {evidence.length > 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setEvidence((current) =>
                            current.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          )
                        }
                        className="text-sm text-red-300 hover:text-red-200"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 mt-3">
                    <div className="block">
                      <span className="block">Document number</span>
                      <div className="mt-1 rounded bg-gray-700 px-3 py-2 text-white/90">
                        Document {index + 1}
                      </div>
                    </div>
                    <label className="block">
                      <span className="block">Document Type</span>
                      <select
                        value={item.evidenceType}
                        onChange={(e) =>
                          updateEvidence(index, "evidenceType", e.target.value)
                        }
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      >
                        <option value="ownership_attestation">
                          Ownership Attestation
                        </option>
                        <option value="ownership_ledger">
                          Ownership Ledger
                        </option>
                        <option value="operating_agreement">
                          Operating Agreement
                        </option>
                        <option value="articles_of_incorporation">
                          Articles of Incorporation
                        </option>
                        <option value="control_attestation">
                          Control Attestation
                        </option>
                        <option value="authorized_representative_letter">
                          Authorized Representative Letter
                        </option>
                        <option value="business_license">
                          Business License
                        </option>
                        <option value="government_registration">
                          Government Registration
                        </option>
                        <option value="other">Other</option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="block">Purpose</span>
                      <select
                        value={item.purpose}
                        onChange={(e) =>
                          updateEvidence(index, "purpose", e.target.value)
                        }
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      >
                        <option value="ownership">Ownership</option>
                        <option value="control">Control</option>
                        <option value="authority">Authority</option>
                        <option value="business_legitimacy">
                          Business Legitimacy
                        </option>
                        <option value="black_attestation">
                          Black Self-Attestation
                        </option>
                      </select>
                    </label>
                    <label className="block">
                      <span className="block">Document link or file note</span>
                      <input
                        type="text"
                        value={item.reference}
                        onChange={(e) =>
                          updateEvidence(index, "reference", e.target.value)
                        }
                        required
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      />
                    </label>
                    <label className="block">
                      <span className="block">Owner Name on Evidence</span>
                      <input
                        type="text"
                        value={item.ownerName}
                        onChange={(e) =>
                          updateEvidence(index, "ownerName", e.target.value)
                        }
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      />
                    </label>
                    <label className="block">
                      <span className="block">Business Name on Evidence</span>
                      <input
                        type="text"
                        value={item.businessName}
                        onChange={(e) =>
                          updateEvidence(index, "businessName", e.target.value)
                        }
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      />
                    </label>
                    <label className="block">
                      <span className="block">Ownership % on Evidence</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={item.ownershipPercentage}
                        onChange={(e) =>
                          updateEvidence(
                            index,
                            "ownershipPercentage",
                            e.target.value,
                          )
                        }
                        className="w-full p-2 rounded bg-gray-700 text-white mt-1"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xl font-bold text-gold">
              Business Profile
            </legend>
            <label className="block mt-3">
              <span className="block">Description</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                required
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
          </fieldset>

          <fieldset>
            <legend className="text-xl font-bold text-gold">Logo Upload</legend>
            <p className="mt-2 text-sm text-gray-400">
              Optional. You can submit without an image.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="w-full p-2 rounded bg-gray-700 text-white mt-2"
            />
            {logoPreviewUrl && (
              <div className="mt-4 rounded-lg border border-gray-700 bg-gray-900/60 p-4">
                <p className="mb-3 text-sm font-semibold text-gray-200">
                  Image Preview
                </p>
                <img
                  src={logoPreviewUrl}
                  alt="Selected business logo preview"
                  className="max-h-56 rounded border border-gray-700 object-contain"
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={submitting}
                    className="rounded bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-600 disabled:opacity-50"
                  >
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={clearSelectedImage}
                    disabled={submitting}
                    className="rounded border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 hover:bg-red-500/20 disabled:opacity-50"
                  >
                    Remove Image
                  </button>
                </div>
              </div>
            )}
            {(imageError || error) && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {imageError || error}
              </div>
            )}
          </fieldset>

          <fieldset>
            <legend className="text-xl font-bold text-gold">
              Social Media
            </legend>
            <label className="block mt-3">
              <span className="block">
                Facebook <span className="text-gray-400">(optional)</span>
              </span>
              <input
                type="text"
                inputMode="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="facebook.com/yourbusiness"
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
            <label className="block mt-3">
              <span className="block">
                Twitter/X <span className="text-gray-400">(optional)</span>
              </span>
              <input
                type="text"
                inputMode="url"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="x.com/yourbusiness"
                className="w-full p-2 rounded bg-gray-700 text-white mt-1"
              />
            </label>
          </fieldset>

          <button
            type="submit"
            disabled={submitting}
            className="w-full p-4 bg-gold text-black font-bold rounded hover:bg-yellow-500 transition disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Business"}
          </button>
        </form>
      </div>
    </div>
  );
}
