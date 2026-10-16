import { createServerFn } from "@tanstack/react-start";
import { LANDMARKS, type Place, type PlaceFee, type PlaceKind } from "@/data/landmarks";
import { milesBetween } from "@/lib/geo";

const KINDS: PlaceKind[] = ["camp", "waterfall", "scenic", "trail", "water", "dump", "rest", "shower"];
const UA = "Kindling/1.0 (camping map)";

type SearchInput = {
  q?: string;
  lat?: number;
  lon?: number;
  miles?: number;
};

export type PlaceSearch = {
  label: string;
  lat: number;
  lon: number;
  places: Place[];
  forecast: string | null;
  notice: string | null;
};

function milesOf(value: number | undefined) {
  if (value === 25 || value === 100) return value;
  return 50;
}

function kindOf(tags: Record<string, string>): PlaceKind | null {
  if (tags.waterway === "waterfall") return "waterfall";
  if (tags.highway === "trailhead") return "trail";
  if (tags.highway === "rest_area") return "rest";
  if (tags.amenity === "shower") return "shower";
  if (tags.tourism === "viewpoint" || tags.natural === "beach") return "scenic";
  if (tags.natural === "spring" || tags.amenity === "drinking_water") return "water";
  if (tags.amenity === "sanitary_dump_station") return "dump";
  if (tags.tourism === "camp_site" || tags.tourism === "caravan_site" || tags.tourism === "camp_pitch") return "camp";
  return null;
}

function feeOf(tags: Record<string, string>): PlaceFee {
  if (tags.fee === "no" || tags.fee === "free") return "free";
  if (tags.fee === "yes") return "paid";
  return "unknown";
}

async function geocode(query: string) {
  const meteo = await openMeteoGeocode(query).catch(() => null);
  if (meteo) return meteo;
  const nominatim = await nominatimGeocode(query).catch(() => null);
  if (nominatim) return nominatim;
  throw new Error("The town search did not answer.");
}

async function openMeteoGeocode(query: string) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json&countryCode=US`;
  const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    results?: { name?: string; admin1?: string; latitude?: number; longitude?: number; feature_code?: string }[];
  };
  const rows = (body.results ?? []).filter(
    (row) => typeof row.latitude === "number" && typeof row.longitude === "number" && row.feature_code !== "AIRP",
  );
  const asked = query.toLowerCase();
  const hit = rows.find((row) => row.admin1 && asked.includes(row.admin1.toLowerCase())) ?? rows[0];
  if (!hit || hit.latitude === undefined || hit.longitude === undefined) return null;
  return { lat: hit.latitude, lon: hit.longitude, label: [hit.name, hit.admin1].filter(Boolean).join(", ") };
}

async function nominatimGeocode(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) return null;
  const rows = (await response.json()) as { lat: string; lon: string; display_name: string }[];
  const hit = rows[0];
  if (!hit) return null;
  return { lat: Number(hit.lat), lon: Number(hit.lon), label: hit.display_name.split(",").slice(0, 2).join(",") };
}

async function overpass(lat: number, lon: number, meters: number): Promise<Place[]> {
  const query = `[out:json][timeout:25];(
    nwr["tourism"~"^(camp_site|caravan_site|camp_pitch)$"](around:${meters},${lat},${lon});
    nwr["waterway"="waterfall"](around:${meters},${lat},${lon});
    nwr["tourism"="viewpoint"]["name"](around:${meters},${lat},${lon});
    nwr["natural"="beach"]["name"](around:${meters},${lat},${lon});
    nwr["highway"="trailhead"](around:${meters},${lat},${lon});
    nwr["highway"="rest_area"](around:${meters},${lat},${lon});
    nwr["natural"="spring"](around:${meters},${lat},${lon});
    nwr["amenity"="drinking_water"](around:${meters},${lat},${lon});
    nwr["amenity"="shower"](around:${meters},${lat},${lon});
    nwr["amenity"="sanitary_dump_station"](around:${meters},${lat},${lon});
  );out center 220;`;
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA,
    },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(28000),
  });
  if (!response.ok) throw new Error(String(response.status));
  const payload = (await response.json()) as {
    elements?: {
      type: string;
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
    }[];
  };
  const places: Place[] = [];
  for (const element of payload.elements ?? []) {
    const tags = element.tags ?? {};
    const kind = kindOf(tags);
    if (!kind || !KINDS.includes(kind)) continue;
    const pointLat = element.lat ?? element.center?.lat;
    const pointLon = element.lon ?? element.center?.lon;
    if (pointLat === undefined || pointLon === undefined) continue;
    const named = tags.name?.trim();
    if (!named && (kind === "water" || kind === "dump" || kind === "shower")) continue;
    const name =
      named ||
      (kind === "camp"
        ? "Camp site"
        : kind === "trail"
          ? "Trailhead"
          : kind === "rest"
            ? "Rest area"
            : "");
    if (!name) continue;
    const area = [tags["addr:city"], tags["addr:state"]].filter(Boolean).join(", ");
    places.push({
      id: `osm-${element.type}-${element.id}`,
      name,
      kind,
      lat: pointLat,
      lon: pointLon,
      fee: feeOf(tags),
      dogs: tags.dog === "yes" || tags.dogs === "yes",
      area,
      detail: (tags.description ?? tags.opening_hours ?? "").slice(0, 180),
      source: "map",
    });
  }
  return places;
}

async function forecast(lat: number, lon: number) {
  const headers = { "User-Agent": UA, Accept: "application/geo+json" };
  const points = await fetch(
    `https://api.weather.gov/points/${lat.toFixed(4)},${lon.toFixed(4)}`,
    { headers, signal: AbortSignal.timeout(8000) },
  );
  if (!points.ok) return null;
  const meta = (await points.json()) as { properties?: { forecast?: string } };
  if (!meta.properties?.forecast) return null;
  const report = await fetch(meta.properties.forecast, {
    headers,
    signal: AbortSignal.timeout(8000),
  });
  if (!report.ok) return null;
  const body = (await report.json()) as {
    properties?: { periods?: { name: string; temperature: number; shortForecast: string }[] };
  };
  const periods = body.properties?.periods?.slice(0, 2) ?? [];
  if (periods.length === 0) return null;
  return periods.map((period) => `${period.name}: ${period.temperature}° ${period.shortForecast}`).join(" · ");
}

async function publicPois(lat: number, lon: number, miles: number): Promise<Place[]> {
  const cats = [
    ["potable_water", "water", "Water"],
    ["dump_station", "dump", "Dump station"],
    ["shower", "shower", "Shower"],
  ] as const;
  const pages = await Promise.all(
    cats.map(async ([cat, kind, fallback]) => {
      const response = await fetch(
        `https://davelalande.com/api/near?lat=${lat}&lon=${lon}&radius=${miles}&type=poi&cat=${cat}`,
        { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(12000) },
      );
      if (!response.ok) return [];
      const body = (await response.json()) as {
        poi?: { name?: string | null; lat?: number; lon?: number; state?: string }[];
      };
      return (body.poi ?? []).flatMap((row, index) => {
        if (typeof row.lat !== "number" || typeof row.lon !== "number") return [];
        const name = row.name?.trim();
        if (!name || name.toLowerCase() === fallback.toLowerCase()) return [];
        return [
          {
            id: `poi-${cat}-${index}`,
            name,
            kind,
            lat: row.lat,
            lon: row.lon,
            fee: "unknown" as const,
            dogs: false,
            area: row.state ?? "",
            detail: "A public stop near the camps. Confirm it is open before you count on it.",
            source: "map" as const,
          },
        ];
      });
    }),
  );
  return pages.flat();
}

function nearestKnown(lat: number, lon: number, miles: number) {
  return LANDMARKS.filter((place) => milesBetween(lat, lon, place.lat, place.lon) <= miles);
}

function mergePlaces(known: Place[], live: Place[], lat: number, lon: number) {
  const kept = live.filter(
    (place) =>
      !known.some(
        (item) =>
          item.kind === place.kind && milesBetween(item.lat, item.lon, place.lat, place.lon) < 0.4,
      ),
  );
  const byKind = new Map<PlaceKind, Place[]>();
  for (const place of [...known, ...kept]) {
    const list = byKind.get(place.kind) ?? [];
    list.push(place);
    byKind.set(place.kind, list);
  }
  const merged: Place[] = [];
  for (const kind of KINDS) {
    const list = (byKind.get(kind) ?? [])
      .sort((a, b) => milesBetween(lat, lon, a.lat, a.lon) - milesBetween(lat, lon, b.lat, b.lon))
      .slice(0, 24);
    merged.push(...list);
  }
  return merged.sort(
    (a, b) => milesBetween(lat, lon, a.lat, a.lon) - milesBetween(lat, lon, b.lat, b.lon),
  );
}

export const findPlaces = createServerFn({ method: "POST" })
  .validator((data: SearchInput) => ({
    q: (data.q ?? "").trim().slice(0, 80),
    lat: typeof data.lat === "number" ? data.lat : undefined,
    lon: typeof data.lon === "number" ? data.lon : undefined,
    miles: milesOf(data.miles),
  }))
  .handler(async ({ data }): Promise<PlaceSearch> => {
    let lat = data.lat;
    let lon = data.lon;
    let label = "Near you";
    if (lat === undefined || lon === undefined) {
      if (!data.q) throw new Error("Search a town, or use Near me.");
      const hit = await geocode(data.q);
      if (!hit) throw new Error("No U.S. town by that name.");
      lat = hit.lat;
      lon = hit.lon;
      label = hit.label;
    }
    const known = nearestKnown(lat, lon, data.miles);
    const [mapped, extras] = await Promise.all([
      overpass(lat, lon, Math.round(data.miles * 1609.34)).catch(() => null),
      publicPois(lat, lon, data.miles).catch(() => null),
    ]);
    const notice =
      mapped || extras ? null : "Extra pins did not load. Public campsites are still on the map.";
    const sky = await forecast(lat, lon).catch(() => null);
    return {
      label,
      lat,
      lon,
      places: mergePlaces(known, [...(mapped ?? []), ...(extras ?? [])], lat, lon),
      forecast: sky,
      notice,
    };
  });

async function alertsAt(lat: number, lon: number) {
  const response = await fetch(
    `https://api.weather.gov/alerts/active?point=${lat.toFixed(4)},${lon.toFixed(4)}`,
    {
      headers: { Accept: "application/geo+json", "User-Agent": UA },
      signal: AbortSignal.timeout(12000),
    },
  );
  if (!response.ok) return null;
  const data = (await response.json()) as { features?: { properties?: { event?: string } }[] };
  const events = (data.features ?? [])
    .map((feature) => feature.properties?.event)
    .filter((event): event is string => Boolean(event));
  return [...new Set(events)].slice(0, 4);
}

export type SkyBrief = {
  label: string;
  lat: number;
  lon: number;
  forecast: string | null;
  alerts: string[] | null;
};

export const skyAt = createServerFn({ method: "POST" })
  .validator((data: { q?: string; lat?: number; lon?: number }) => ({
    q: (data.q ?? "").trim().slice(0, 80),
    lat: typeof data.lat === "number" && Number.isFinite(data.lat) ? data.lat : undefined,
    lon: typeof data.lon === "number" && Number.isFinite(data.lon) ? data.lon : undefined,
  }))
  .handler(async ({ data }): Promise<SkyBrief> => {
    let lat = data.lat;
    let lon = data.lon;
    let label = "This spot";
    if (lat === undefined || lon === undefined) {
      if (!data.q) throw new Error("Search a town.");
      const hit = await geocode(data.q);
      if (!hit) throw new Error("No U.S. town by that name.");
      lat = hit.lat;
      lon = hit.lon;
      label = hit.label;
    }
    const [sky, alerts] = await Promise.all([forecast(lat, lon).catch(() => null), alertsAt(lat, lon)]);
    return { label, lat, lon, forecast: sky, alerts };
  });
