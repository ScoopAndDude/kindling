import type { Place, PlaceFee } from "@/data/landmarks";

export type PublicCamp = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  fee: PlaceFee;
  area: string;
  detail: string;
};

type CampRow = [number, number, string, string, string, number, number];

const FEE: PlaceFee[] = ["free", "paid", "unknown"];

export function parsePublicCamps(payload: { camps?: CampRow[] }): PublicCamp[] {
  return (payload.camps ?? []).map((row, index) => {
    const [lat, lon, name, manager, state, fee, dispersed] = row;
    const area = [manager, state].filter(Boolean).join(" · ");
    return {
      id: `pub-${index}`,
      name,
      lat,
      lon,
      fee: FEE[fee] ?? "unknown",
      area,
      detail: dispersed
        ? "Dispersed camping on public land. Stay limits and fire rules change. Pack it all out."
        : "A public campground. The fee and the reservation rule are worth checking before you go.",
    };
  });
}

export function campPlace(camp: PublicCamp): Place {
  return {
    id: camp.id,
    name: camp.name,
    kind: "camp",
    lat: camp.lat,
    lon: camp.lon,
    fee: camp.fee,
    dogs: false,
    area: camp.area,
    detail: camp.detail,
    source: "map",
  };
}
