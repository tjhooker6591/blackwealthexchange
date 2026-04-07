import { useMemo } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { TravelMapBusiness } from "@/types/travel-map";

const defaultCenter: [number, number] = [39.8283, -98.5795];

const markerIcon = new L.Icon({
  iconUrl: "/images/map/marker-icon.png",
  shadowUrl: "/images/map/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function isValidCoordinate(lat?: number | null, lng?: number | null) {
  if (typeof lat !== "number" || typeof lng !== "number") return false;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

function buildDirectionsUrl(business: TravelMapBusiness) {
  const lat = business.location?.lat;
  const lng = business.location?.lng;

  if (isValidCoordinate(lat, lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }

  const fallback = encodeURIComponent(
    business.address?.formatted ||
      `${business.business_name} ${business.address?.city || ""} ${business.address?.state || ""}`.trim(),
  );

  return `https://www.google.com/maps/search/?api=1&query=${fallback}`;
}

export default function TravelMapLeaflet({
  results,
}: {
  results: TravelMapBusiness[];
}) {
  const mapped = useMemo(
    () =>
      results.filter((item) =>
        isValidCoordinate(item.location?.lat, item.location?.lng),
      ),
    [results],
  );

  const center = mapped.length
    ? [mapped[0].location!.lat as number, mapped[0].location!.lng as number]
    : defaultCenter;

  return (
    <div className="h-[420px] overflow-hidden rounded-2xl border border-yellow-500/20">
      <MapContainer
        center={center as [number, number]}
        zoom={10}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {mapped.map((business) => (
          <Marker
            key={business._id}
            position={[
              business.location!.lat as number,
              business.location!.lng as number,
            ]}
            icon={markerIcon}
          >
            <Popup>
              <div className="min-w-[220px]">
                <div className="font-semibold">{business.business_name}</div>
                {business.category ? (
                  <div className="mt-1 text-sm text-gray-700">
                    {business.category}
                  </div>
                ) : null}
                {business.address?.formatted ? (
                  <div className="mt-2 text-sm text-gray-600">
                    {business.address.formatted}
                  </div>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  {business.slug ? (
                    <Link
                      href={`/business/${business.slug}`}
                      className="rounded-md bg-black px-3 py-2 text-xs font-semibold text-white"
                    >
                      View
                    </Link>
                  ) : null}

                  <a
                    href={buildDirectionsUrl(business)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-black"
                  >
                    Directions
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
