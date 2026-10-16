import type { Access, TripStyle } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function utcDate(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function todayISO() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

export function shiftISO(iso: string, days: number) {
  const date = utcDate(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function nextWeekdayISO(weekday: number) {
  const today = todayISO();
  const day = utcDate(today).getUTCDay();
  let add = (weekday - day + 7) % 7;
  if (add === 0) add = 7;
  return shiftISO(today, add);
}

export function formatDay(iso: string) {
  const date = utcDate(iso);
  const [, month, day] = iso.split("-").map(Number);
  return `${DAYS[date.getUTCDay()]}, ${MONTHS[month - 1]} ${day}`;
}

export function formatRange(start: string, end: string) {
  return `${formatDay(start)} – ${formatDay(end)}`;
}

export function nightCount(start: string, end: string) {
  const ms = utcDate(end).getTime() - utcDate(start).getTime();
  return Math.max(0, Math.round(ms / 86_400_000));
}

export function nightLabel(start: string, end: string) {
  const nights = nightCount(start, end);
  return nights === 1 ? "1 night" : `${nights} nights`;
}

export function formatOz(oz: number) {
  const pounds = Math.floor(oz / 16);
  const rest = oz % 16;
  if (pounds <= 0) return `${rest} oz`;
  if (rest === 0) return `${pounds} lb`;
  return `${pounds} lb ${rest} oz`;
}

export function approachLabel(access: Access) {
  if (access === "hike") return "On foot";
  if (access === "drive") return "By car";
  return "By paddle";
}

export const STYLE_LABEL: Record<TripStyle, string> = {
  backpack: "Backpack",
  car: "Car camp",
  basecamp: "Basecamp",
};

export function defaultStyle(access: Access): TripStyle {
  return access === "drive" ? "car" : "backpack";
}
