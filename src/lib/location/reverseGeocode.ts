// src/lib/location/reverseGeocode.ts
//
// Phase 7 -- Location-Aware Discovery. Converts real browser-provided
// coordinates (opt-in Geolocation API, never fabricated) into a city/state
// text pair using OpenStreetMap's free Nominatim reverse-geocoding service
// (no API key/credential needed -- there is no paid geocoding provider
// configured in this project). That city/state text then feeds BWE's
// existing text-based business search (city/state fields already indexed
// -- see src/pages/api/search/businesses.ts), rather than inventing a
// second, coordinate-based search engine BWE's data doesn't support (no
// business in the `businesses` collection has stored latitude/longitude).
//
// Nothing here is stored server-side -- this is a stateless lookup used
// only to build the caller's own search query.

const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
// Nominatim's usage policy requires a descriptive User-Agent identifying
// the application (https://operations.osmfoundation.org/policies/nominatim/).
const USER_AGENT =
  "BlackWealthExchange/1.0 (location-aware discovery; contact: support@blackwealthexchange.com)";

export type ReverseGeocodeResult = {
  city: string | null;
  state: string | null;
  country: string | null;
};

// Nominatim returns the full US state name; BWE's existing directory state
// filter (src/pages/business-directory.tsx's `stateFilter`) is a 2-letter
// code, so this normalizes to match that existing convention rather than
// adding a second state-format convention.
const US_STATE_NAME_TO_CODE: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

function normalizeState(rawState: string | null): string | null {
  if (!rawState) return null;
  const code = US_STATE_NAME_TO_CODE[rawState.trim().toLowerCase()];
  return code || rawState;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<ReverseGeocodeResult> {
  const url = `${NOMINATIM_ENDPOINT}?format=jsonv2&lat=${encodeURIComponent(
    lat,
  )}&lon=${encodeURIComponent(lng)}&zoom=10&addressdetails=1`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    throw new Error(`Reverse geocoding failed with status ${res.status}`);
  }

  const data = await res.json();
  const address = data?.address || {};
  const city =
    address.city ||
    address.town ||
    address.village ||
    address.hamlet ||
    address.county ||
    null;
  const state = normalizeState(address.state || null);
  const country = address.country_code
    ? String(address.country_code).toUpperCase()
    : null;

  return { city, state, country };
}
