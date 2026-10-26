import React from "react";

export type ListingDetailsBusiness = {
  _id: string;
  searchReady?: boolean;
  searchMissingFields?: string[];
  searchDetailsNeeded?: number;
  listingChecklist?: Array<{
    key: string;
    label: string;
    value: string;
    done: boolean;
  }>;
};

// Approval lists a business, but public search also needs enough details
// (7 of 9; see computeListingCompleteness). Null when it will show in search.
export function searchHiddenNote(biz: ListingDetailsBusiness): string | null {
  if (biz.searchReady !== false) return null;
  const missing = biz.searchMissingFields || [];
  const need = biz.searchDetailsNeeded || 0;
  return `Won't show in search yet: add ${need} more of ${missing.join(", ")}.`;
}

// What the business has filled in, detail by detail, so the admin can see
// what is missing before approving.
export default function ListingDetails({
  biz,
}: {
  biz: ListingDetailsBusiness;
}) {
  const items = biz.listingChecklist || [];
  const done = items.filter((i) => i.done).length;
  const note = searchHiddenNote(biz);
  const linkFor = (key: string, value: string) =>
    (key === "website" || key === "image") && /^(https?:\/\/|\/)/i.test(value)
      ? value
      : key === "website" && /^[\w-]+(\.[\w-]+)+/.test(value)
        ? `https://${value}`
        : null;
  return (
    <div className="sticky left-0 max-w-[calc(100vw-4rem)] rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-200 sm:max-w-none">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-semibold text-gold">
          Listing details: {done} of {items.length} filled in
        </div>
        <div
          className={
            note ? "text-xs text-yellow-300" : "text-xs text-green-400"
          }
        >
          {note || "Has enough details to show in search."}
        </div>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-[max-content_1fr]">
        {items.map((item) => {
          const href = item.done ? linkFor(item.key, item.value) : null;
          return (
            <React.Fragment key={`${biz._id}-detail-${item.key}`}>
              <dt
                className={
                  item.done ? "text-green-400" : "font-semibold text-red-400"
                }
              >
                {item.done ? "✓" : "✗"} {item.label}
              </dt>
              <dd className="break-words text-zinc-300 sm:pl-0 pl-5">
                {!item.done ? (
                  <span className="text-zinc-500">Missing</span>
                ) : href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    {item.key === "image" ? "View image" : item.value}
                  </a>
                ) : (
                  item.value
                )}
              </dd>
            </React.Fragment>
          );
        })}
      </dl>
      {!items.length ? (
        <div className="text-zinc-400">No listing details available.</div>
      ) : null}
    </div>
  );
}
