import type { Place } from "@/data/landmarks";

export type RestStop = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  area: string;
  detail: string;
};

type Row = { n?: string; lat?: number; lon?: number; area?: string; t?: string };

const LABEL: Record<string, string> = {
  "Rest Area": "Rest area",
  "Welcome Center": "Welcome center",
  "Service Plaza": "Service plaza",
  Turnout: "Turnout",
};

export function parseRestStops(payload: Row[]): RestStop[] {
  const seen = new Set<string>();
  const stops: RestStop[] = [];
  for (const row of payload) {
    if (typeof row.lat !== "number" || typeof row.lon !== "number") continue;
    const name = row.n?.trim() || "Rest area";
    const key = `${row.lat.toFixed(3)}:${row.lon.toFixed(3)}:${name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const kind = LABEL[row.t ?? ""] ?? "Rest area";
    stops.push({
      id: `rest-${stops.length}`,
      name,
      lat: row.lat,
      lon: row.lon,
      area: row.area?.trim() ?? "",
      detail: `${kind}. A roadside stop, not a place to camp. Confirm it is open before you count on it.`,
    });
  }
  return stops;
}

export function restPlace(stop: RestStop): Place {
  return {
    id: stop.id,
    name: stop.name,
    kind: "rest",
    lat: stop.lat,
    lon: stop.lon,
    fee: "free",
    dogs: false,
    area: stop.area,
    detail: stop.detail,
    source: "map",
  };
}
