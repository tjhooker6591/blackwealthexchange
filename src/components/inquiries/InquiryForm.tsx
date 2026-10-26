import { useRouter } from "next/router";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import {
  INQUIRY_CATEGORIES,
  inquiryCategory,
} from "@/lib/inquiries/categories";

// The contact form. "?topic=membership" (any category key) preselects a topic
// so other pages can link straight to it.
const input =
  "w-full rounded-xl border border-white/12 bg-black/40 px-3 py-2.5 text-white placeholder-white/35 outline-none focus:border-[#D4AF37]";

export default function InquiryForm() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [f, setF] = useState({
    name: "",
    businessName: "",
    email: "",
    phone: "",
    listingUrl: "",
    message: "",
    website: "",
  });
  const [state, setState] = useState<"idle" | "sending" | "sent" | "duplicate">(
    "idle",
  );
  const [error, setError] = useState<{ text: string; field?: string } | null>(
    null,
  );
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const topic = String(router.query.topic || "");
    if (inquiryCategory(topic)) setCategory(topic);
  }, [router.query.topic]);

  const cat = inquiryCategory(category);
  const forBusiness = Boolean(cat?.forBusinesses);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cat)
      return setError({
        text: "Choose what your message is about.",
        field: "category",
      });
    setState("sending");
    setError(null);
    try {
      const r = await fetch("/api/inquiries/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, category, sourceForm: "contact" }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setState("idle");
        return setError({
          text: d?.error || "We couldn't send your message. Please try again.",
          field: d?.field,
        });
      }
      setState(d.duplicate ? "duplicate" : "sent");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setState("idle");
      setError({
        text: "We couldn't send your message. Check your connection and try again.",
      });
    }
  };

  if (state === "sent" || state === "duplicate") {
    return (
      <div
        className="rounded-2xl border border-[rgba(212,175,55,0.3)] bg-[rgba(212,175,55,0.08)] p-6"
        role="status"
      >
        <h2 className="text-xl font-semibold text-white">
          {state === "sent"
            ? `Thanks, ${f.name.split(" ")[0]}. We got your message.`
            : "We already have your message."}
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/75">
          {state === "sent"
            ? `We've emailed a reply to ${f.email.trim()}${forBusiness ? ", and a member of our team will follow up personally" : ""}. Check your spam folder if you don't see it in a few minutes.`
            : "You sent us a message about this today, so we didn't send it twice. We'll be in touch."}
        </p>
        <button
          type="button"
          onClick={() => {
            setState("idle");
            setF((p) => ({ ...p, message: "" }));
          }}
          className="mt-4 text-sm text-[#D4AF37] underline"
        >
          Send another message
        </button>
      </div>
    );
  }

  const fieldError = (k: string) =>
    error?.field === k ? (
      <p className="mt-1 text-sm text-red-300">{error.text}</p>
    ) : null;
  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <fieldset>
        <legend className="text-sm font-semibold text-white">
          What can we help with?
        </legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {INQUIRY_CATEGORIES.map((c) => (
            <label
              key={c.key}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm ${category === c.key ? "border-[#D4AF37] bg-[rgba(212,175,55,0.1)]" : "border-white/10 bg-black/30 hover:border-white/25"}`}
            >
              <input
                type="radio"
                name="category"
                value={c.key}
                checked={category === c.key}
                onChange={() => setCategory(c.key)}
                className="accent-[#D4AF37]"
              />
              <span>{c.label}</span>
            </label>
          ))}
          <Link
            href="/support/new"
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white/75 hover:border-white/25"
          >
            <span aria-hidden="true">→</span>
            <span>Help with my account, an order or a payment</span>
          </Link>
        </div>
        {fieldError("category")}
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inq-name" className="text-sm font-semibold">
            Your name
          </label>
          <input
            id="inq-name"
            className={`${input} mt-1`}
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
            required
          />
          {fieldError("name")}
        </div>
        {forBusiness ? (
          <div>
            <label htmlFor="inq-biz" className="text-sm font-semibold">
              Business or organization{" "}
              <span className="font-normal text-white/50">(optional)</span>
            </label>
            <input
              id="inq-biz"
              className={`${input} mt-1`}
              value={f.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              autoComplete="organization"
            />
          </div>
        ) : null}
        <div>
          <label htmlFor="inq-email" className="text-sm font-semibold">
            Email
          </label>
          <input
            id="inq-email"
            type="email"
            className={`${input} mt-1`}
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="email"
            required
          />
          {fieldError("email")}
        </div>
        {forBusiness ? (
          <div>
            <label htmlFor="inq-phone" className="text-sm font-semibold">
              Phone{" "}
              <span className="font-normal text-white/50">
                (optional, if you&apos;d like a call)
              </span>
            </label>
            <input
              id="inq-phone"
              type="tel"
              className={`${input} mt-1`}
              value={f.phone}
              onChange={(e) => set("phone", e.target.value)}
              autoComplete="tel"
            />
            {fieldError("phone")}
          </div>
        ) : null}
        {category === "listing_claim" ? (
          <div className="sm:col-span-2">
            <label htmlFor="inq-listing" className="text-sm font-semibold">
              Link to your listing{" "}
              <span className="font-normal text-white/50">(optional)</span>
            </label>
            <input
              id="inq-listing"
              className={`${input} mt-1`}
              value={f.listingUrl}
              onChange={(e) => set("listingUrl", e.target.value)}
              placeholder="https://www.blackwealthexchange.com/business/…"
            />
          </div>
        ) : null}
      </div>

      <div>
        <label htmlFor="inq-message" className="text-sm font-semibold">
          Your message
        </label>
        <textarea
          id="inq-message"
          rows={5}
          className={`${input} mt-1`}
          value={f.message}
          onChange={(e) => set("message", e.target.value)}
          placeholder={cat?.reply.question || "How can we help?"}
          required
        />
        {fieldError("message")}
      </div>

      {/* Left empty by people; bots fill it in. */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="inq-website">Website</label>
        <input
          id="inq-website"
          tabIndex={-1}
          autoComplete="off"
          value={f.website}
          onChange={(e) => set("website", e.target.value)}
        />
      </div>

      {error && !error.field ? (
        <p className="text-sm text-red-300" role="alert">
          {error.text}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-xl bg-[#D4AF37] px-6 py-3 font-semibold text-black disabled:opacity-50"
        >
          {state === "sending" ? "Sending…" : "Send message"}
        </button>
        <p className="text-xs text-white/50">
          We&apos;ll email you a reply. You can unsubscribe from any email we send.
        </p>
      </div>
    </form>
  );
}
