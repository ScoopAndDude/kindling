const FEDERAL = new Set(["USFS", "BLM", "NPS", "USACE", "USFWS", "BOR"]);

const AGENCY: [RegExp, string][] = [
  [/NY DEC/i, "https://www.dec.ny.gov/things-to-do/camping/campgrounds"],
  [/Michigan DNR/i, "https://www.michigan.gov/dnr/places/camping"],
  [/PA DCNR/i, "https://www.dcnr.pa.gov/Recreation/WhatToDo/Camping/Pages/default.aspx"],
  [/IDNR|Indiana DNR/i, "https://www.in.gov/dnr/state-parks/camping/"],
  [/Illinois DNR/i, "https://dnr.illinois.gov/recreation/camping.html"],
  [/Georgia DNR/i, "https://gastateparks.org/reservations"],
  [/Maine BPL/i, "https://www.maine.gov/dacf/parks/camping/index.shtml"],
  [/Florida|WMD/i, "https://www.floridastateparks.org/find-a-park"],
  [/California|CA State Parks/i, "https://www.reservecalifornia.com/"],
];

export function campRules(name: string, area: string) {
  const manager = area.split(" · ")[0]?.trim() ?? "";
  if (FEDERAL.has(manager)) {
    return {
      href: `https://www.recreation.gov/search?q=${encodeURIComponent(name)}`,
      label: "Reservations",
    };
  }
  const known = AGENCY.find(([pattern]) => pattern.test(manager));
  if (known) return { href: known[1], label: "Check the rules" };
  const query = `${name} ${manager} campground rules`.replace(/\s+/g, " ").trim();
  return {
    href: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
    label: "Check the rules",
  };
}
