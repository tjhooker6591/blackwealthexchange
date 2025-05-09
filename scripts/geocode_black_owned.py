import json
import time
from geopy.geocoders import Nominatim

geolocator = Nominatim(user_agent="bwes_geocoder", timeout=10)

INPUT_FILE   = "data/black_owned_enriched.json"
OUTPUT_FILE  = "data/black_owned_geocoded.json"

# Map specific businesses to their city hint
HINTS = {
    "Absolutely Everything Curly":      "Los Angeles, CA",
    "Alodia Hair Care":                 "Los Angeles, CA",
    "Melanin Haircare":                 "Los Angeles, CA",
    "Pattern Beauty":                   "Los Angeles, CA",
    # …add more overrides as you identify them…
    "Ami Colé":                         "New York, NY",
    "Eve Milan New York":               "New York, NY",
    # default hint if business not in HINTS
    "_default":                         "United States"
}

def geocode_nominatim(query):
    try:
        loc = geolocator.geocode(query)
        if not loc:
            return "", None, None
        return loc.address, loc.latitude, loc.longitude
    except Exception:
        return "", None, None

def enrich_nominatim():
    # 1) Load the base file
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        businesses = json.load(f)

    total = len(businesses)

    # 2) First pass: bare-name geocoding
    for idx, biz in enumerate(businesses, start=1):
        name = biz["business_name"]
        print(f"[1st pass {idx}/{total}] Geocoding “{name}”…", flush=True)
        addr, lat, lng = geocode_nominatim(name)
        biz["address"], biz["latitude"], biz["longitude"] = addr, lat, lng
        time.sleep(0.2)

    # 3) Identify which still lack coords
    missing = [b for b in businesses if b.get("latitude") is None]
    if missing:
        print(f"\n⚠️ {len(missing)} still missing, retrying with hints…\n")

        # 4) Second pass: add city hints
        for idx, biz in enumerate(missing, start=1):
            name = biz["business_name"]
            hint = HINTS.get(name, HINTS["_default"])
            query = f"{name}, {hint}"
            print(f"[2nd pass {idx}/{len(missing)}] Geocoding “{query}”…", flush=True)
            addr, lat, lng = geocode_nominatim(query)
            # only override if we got something
            if lat is not None:
                biz["address"], biz["latitude"], biz["longitude"] = addr, lat, lng
            time.sleep(0.2)

    # 5) Write final output
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(businesses, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Done! Wrote enriched data to {OUTPUT_FILE}")

if __name__ == "__main__":
    enrich_nominatim()

