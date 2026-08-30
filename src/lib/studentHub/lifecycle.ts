import type {
  StudentHubRecord,
  StudentHubStatus,
} from "@/lib/studentHub/catalog";

const DAY_MS = 24 * 60 * 60 * 1000;
const CLOSING_SOON_WINDOW_DAYS = 14;
const STALE_AFTER_DAYS = 45;

function parseDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function daysBetween(a: Date, b: Date) {
  return Math.round(
    (startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY_MS,
  );
}

export type StudentHubLifecycle = {
  status: StudentHubStatus;
  deadlineDate: Date | null;
  opensAtDate: Date | null;
  startsAtDate: Date | null;
  endsAtDate: Date | null;
  daysUntilDeadline: number | null;
  stale: boolean;
  current: boolean;
  upcoming: boolean;
  closed: boolean;
  needsReview: boolean;
};

export function deriveStudentHubLifecycle(
  record: StudentHubRecord,
  now = new Date(),
): StudentHubLifecycle {
  const deadlineDate = parseDate(record.deadline);
  const opensAtDate = parseDate(record.opensAt);
  const startsAtDate = parseDate(record.startsAt);
  const endsAtDate = parseDate(record.endsAt);
  const lastVerifiedDate = parseDate(record.lastVerifiedAt);

  const stale =
    !lastVerifiedDate || daysBetween(now, lastVerifiedDate) > STALE_AFTER_DAYS;

  let status: StudentHubStatus = record.status;

  if (record.status === "needs_review") {
    status = "needs_review";
  } else if (deadlineDate && startOfDay(deadlineDate) < startOfDay(now)) {
    status = "closed";
  } else if (record.status === "upcoming") {
    status = "upcoming";
  } else if (opensAtDate && startOfDay(opensAtDate) > startOfDay(now)) {
    status = "upcoming";
  } else if (
    deadlineDate &&
    daysBetween(deadlineDate, now) >= 0 &&
    daysBetween(deadlineDate, now) <= CLOSING_SOON_WINDOW_DAYS
  ) {
    status = "closing_soon";
  } else if (
    (startsAtDate && startOfDay(startsAtDate) > startOfDay(now)) ||
    (opensAtDate && startOfDay(opensAtDate) > startOfDay(now))
  ) {
    status = "upcoming";
  } else if (
    (opensAtDate && startOfDay(opensAtDate) <= startOfDay(now)) ||
    record.status === "open"
  ) {
    status = record.status === "closing_soon" ? "closing_soon" : "open";
  }

  const daysUntilDeadline = deadlineDate
    ? daysBetween(deadlineDate, now)
    : null;

  return {
    status,
    deadlineDate,
    opensAtDate,
    startsAtDate,
    endsAtDate,
    daysUntilDeadline,
    stale,
    current: status === "open" || status === "closing_soon",
    upcoming: status === "upcoming",
    closed: status === "closed",
    needsReview: status === "needs_review",
  };
}

export function getStudentHubStatusLabel(status: StudentHubStatus) {
  switch (status) {
    case "closing_soon":
      return "Closing soon";
    case "needs_review":
      return "Needs review";
    case "upcoming":
      return "Upcoming";
    case "closed":
      return "Closed";
    default:
      return "Open";
  }
}
