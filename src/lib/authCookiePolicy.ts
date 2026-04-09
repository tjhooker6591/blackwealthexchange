export const SESSION_TTL_SECONDS = 60 * 30;
export const SESSION_TTL_LABEL = "30m";

export function getAuthCookieDomain() {
  const isProd = process.env.NODE_ENV === "production";
  return isProd ? ".blackwealthexchange.com" : undefined;
}

export function getAuthCookieSecure() {
  return process.env.NODE_ENV === "production";
}
