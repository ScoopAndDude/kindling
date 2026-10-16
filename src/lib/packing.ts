import { CHECKLIST } from "@/data/catalog";
import type { Trip, TripStyle } from "@/lib/types";

export function itemsFor(style: TripStyle) {
  return CHECKLIST.filter((item) => item.styles.includes(style));
}

export function packingProgress(trip: Trip) {
  const items = itemsFor(trip.style);
  const done =
    items.filter((item) => trip.checks[item.id]).length +
    trip.extras.filter((extra) => extra.done).length;
  const total = items.length + trip.extras.length;
  return { done, total, ratio: total === 0 ? 0 : done / total };
}
