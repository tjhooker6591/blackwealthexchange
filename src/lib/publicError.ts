const TECHNICAL_ERROR_PATTERNS = [
  /cannot destructure/i,
  /\btypeerror\b/i,
  /\breferenceerror\b/i,
  /\bsyntaxerror\b/i,
  /\bundefined\b/i,
  /\bnull\b/i,
  /\bstack\b/i,
  /\bexception\b/i,
  /\/api\//i,
  /\bauth\b/i,
  /\bjwt\b/i,
  /\bcsrf\b/i,
  /\bstripe\b/i,
  /\bmongo(db)?\b/i,
  /\bdatabase\b/i,
  /\benv(ironment)?\b/i,
  /\bsecret\b/i,
  /\bruntime\b/i,
];

type PublicErrorOptions = {
  fallback: string;
  authFallback?: string;
};

export function toPublicErrorMessage(
  value: unknown,
  options: PublicErrorOptions,
): string {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return options.fallback;

  const normalized = raw.toLowerCase();
  if (
    normalized === "unauthorized" ||
    normalized === "login required" ||
    normalized === "authentication required" ||
    normalized.includes("sign in")
  ) {
    return options.authFallback || options.fallback;
  }

  if (TECHNICAL_ERROR_PATTERNS.some((pattern) => pattern.test(raw))) {
    return options.fallback;
  }

  return raw;
}
