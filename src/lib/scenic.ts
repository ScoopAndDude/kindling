import type { Place, PlaceKind } from "@/data/landmarks";
import { usState } from "@/lib/states";

export type ScenicSpot = {
  id: string;
  name: string;
  kind: Extract<PlaceKind, "waterfall" | "scenic" | "trail">;
  lat: number;
  lon: number;
  area: string;
};

type Row = { n?: string; lat?: number; lon?: number; k?: string; area?: string };

const KINDS = new Set(["waterfall", "scenic", "trail"]);

export function parseScenic(payload: Row[]): ScenicSpot[] {
  const seen = new Set<string>();
  const spots: ScenicSpot[] = [];
  for (const row of payload) {
    if (typeof row.lat !== "number" || typeof row.lon !== "number") continue;
    if (!row.k || !KINDS.has(row.k)) continue;
    const name = row.n?.trim();
    if (!name) continue;
    const key = `${row.lat.toFixed(3)}:${row.lon.toFixed(3)}:${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    spots.push({
      id: `scene-${spots.length}`,
      name,
      kind: row.k as ScenicSpot["kind"],
      lat: row.lat,
      lon: row.lon,
      area: row.area?.trim() ?? "",
    });
  }
  return spots;
}

export function scenicPlace(spot: ScenicSpot): Place {
  const detail =
    spot.kind === "waterfall"
      ? "A mapped waterfall. Flow changes with the season. Stay on the trail."
      : spot.kind === "trail"
        ? "A mapped trailhead. Check length, weather, and whether a permit is required."
        : "A mapped viewpoint. The light is better early or late, and the edge is not a trail.";
  return {
    id: spot.id,
    name: spot.name,
    kind: spot.kind,
    lat: spot.lat,
    lon: spot.lon,
    fee: "unknown",
    dogs: false,
    area: spot.area || usState(spot.lat, spot.lon),
    detail,
    source: "map",
  };
}
