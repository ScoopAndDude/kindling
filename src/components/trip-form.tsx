import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { SITES, siteById } from "@/data/catalog";
import { KIND_LABEL, LANDMARKS } from "@/data/landmarks";
import { defaultStyle, nightLabel, nextWeekdayISO, shiftISO } from "@/lib/format";
import { parsePublicCamps } from "@/lib/public-camps";
import { parseRestStops } from "@/lib/rest-stops";
import { useCamp } from "@/lib/store";
import type { TripStyle } from "@/lib/types";
import { Button, fieldClasses } from "@/components/ui";

type Spot = {
  id: string;
  name: string;
  area: string;
  kind: string;
  lat: number;
  lon: number;
  key: string;
};

function rank(spot: Spot, query: string) {
  const name = spot.name.toLowerCase();
  if (name.startsWith(query)) return 0;
  if (name.includes(query)) return 1;
  return 2;
}

export function TripForm({
  defaultSiteId,
  lockSite = false,
}: {
  defaultSiteId?: string;
  lockSite?: boolean;
}) {
  const navigate = useNavigate();
  const addTrip = useCamp((state) => state.addTrip);
  const initialSite = siteById(defaultSiteId ?? "") ?? SITES[0];
  const initialStart = nextWeekdayISO(5);
  const [siteId, setSiteId] = useState(initialSite.id);
  const [style, setStyle] = useState<TripStyle>(defaultStyle(initialSite.access));
  const [name, setName] = useState(lockSite ? initialSite.name : "");
  const [where, setWhere] = useState("");
  const [picked, setPicked] = useState<Spot | null>(null);
  const [spots, setSpots] = useState<Spot[]>([]);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(shiftISO(initialStart, 2));
  const [party, setParty] = useState(2);
  const [error, setError] = useState("");

  const site = siteById(siteId) ?? SITES[0];
  const walkInCar = lockSite && site.access !== "drive" && style === "car";

  useEffect(() => {
    if (lockSite) return;
    let cancel = false;
    void Promise.all([
      fetch("/data/public-camps.json").then((response) => (response.ok ? response.json() : null)),
      fetch("/data/rest-areas.json").then((response) => (response.ok ? response.json() : null)),
    ])
      .then(([camps, rests]) => {
        if (cancel) return;
        const next: Spot[] = [];
        for (const camp of parsePublicCamps(camps ?? {})) {
          next.push({
            id: camp.id,
            name: camp.name,
            area: camp.area,
            kind: "Public camp",
            lat: camp.lat,
            lon: camp.lon,
            key: `${camp.name} ${camp.area}`.toLowerCase(),
          });
        }
        for (const stop of parseRestStops(Array.isArray(rests) ? rests : [])) {
          next.push({
            id: stop.id,
            name: stop.name,
            area: stop.area,
            kind: "Rest stop",
            lat: stop.lat,
            lon: stop.lon,
            key: `${stop.name} ${stop.area}`.toLowerCase(),
          });
        }
        for (const place of LANDMARKS) {
          next.push({
            id: place.id,
            name: place.name,
            area: place.area,
            kind: KIND_LABEL[place.kind],
            lat: place.lat,
            lon: place.lon,
            key: `${place.name} ${place.area}`.toLowerCase(),
          });
        }
        setSpots(next);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [lockSite]);

  const matches = useMemo(() => {
    const query = where.trim().toLowerCase();
    if (query.length < 2 || picked || spots.length === 0) return [];
    return spots
      .filter((spot) => spot.key.includes(query))
      .sort((a, b) => rank(a, query) - rank(b, query))
      .slice(0, 8);
  }, [where, spots, picked]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    const place = where.trim();
    if (!lockSite && !picked) {
      setError("Pick a public camp, rest stop, or known spot from the list.");
      return;
    }
    if (!trimmed && !place) {
      setError("Give the trip a name.");
      return;
    }
    if (!start || !end || end <= start) {
      setError("Stay at least one night — the end date has to land after the start.");
      return;
    }
    if (party < 1 || party > 12) {
      setError("Party size should be between 1 and 12.");
      return;
    }
    const id = addTrip({
      name: trimmed || picked?.name || place,
      siteId: lockSite ? siteId : "custom",
      start,
      end,
      party,
      style,
      notes: lockSite ? undefined : picked ? `${picked.kind}${picked.area ? ` · ${picked.area}` : ""}` : place,
      lat: picked?.lat,
      lon: picked?.lon,
    });
    void navigate({ to: "/trips/$tripId", params: { tripId: id } });
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-cream p-5 shadow-card md:p-6">
      <h2 className="font-display text-3xl text-ink">Plan this one</h2>
      <p className="mt-2 text-sm text-muted">
        {nightLabel(start, end)} · {party} {party === 1 ? "person" : "people"}
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-ink sm:col-span-2">
          Trip name
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Optional. Defaults to the place."
            className={fieldClasses("mt-1")}
          />
        </label>
        {lockSite ? (
          <p className="text-sm text-muted sm:col-span-2">
            At <span className="font-medium text-ink">{site.name}</span> · {site.region}
          </p>
        ) : (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink">
              Where
              <input
                value={where}
                onChange={(event) => {
                  setWhere(event.target.value);
                  setPicked(null);
                }}
                placeholder="Search a public camp or rest stop"
                className={fieldClasses("mt-1")}
              />
            </label>
            <p className="mt-2 text-sm text-muted">
              Public camps, rest areas, and known stops already mapped.{" "}
              <Link to="/map" className="font-medium text-pine">
                Or pick one on the map.
              </Link>
            </p>
            {where.trim().length >= 2 && spots.length === 0 ? (
              <p className="mt-2 text-sm text-muted">Loading the public spots…</p>
            ) : null}
            {picked ? (
              <p className="mt-2 text-sm text-ink">
                {picked.kind}
                {picked.area ? ` · ${picked.area}` : ""}
              </p>
            ) : null}
            {matches.length > 0 ? (
              <ul className="mt-2 overflow-hidden rounded-xl bg-paper shadow-card">
                {matches.map((spot) => (
                  <li key={spot.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setPicked(spot);
                        setWhere(spot.name);
                        if (!name.trim()) setName(spot.name);
                      }}
                      className="flex min-h-11 w-full flex-col items-start justify-center px-3 py-2 text-left hover:bg-cream"
                    >
                      <span className="text-ink">{spot.name}</span>
                      <span className="text-sm text-muted">
                        {spot.kind}
                        {spot.area ? ` · ${spot.area}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        )}
        <label className="block text-sm font-medium text-ink">
          Start
          <input
            type="date"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className={fieldClasses("mt-1")}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          End
          <input
            type="date"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            className={fieldClasses("mt-1")}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          People
          <input
            type="number"
            min={1}
            max={12}
            value={party}
            onChange={(event) => setParty(Number(event.target.value))}
            className={fieldClasses("mt-1")}
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          How you are going
          <select
            value={style}
            onChange={(event) => setStyle(event.target.value as TripStyle)}
            className={fieldClasses("mt-1")}
          >
            <option value="backpack">Backpack</option>
            <option value="car">Car camp</option>
            <option value="basecamp">Basecamp</option>
          </select>
        </label>
      </div>
      {walkInCar ? (
        <p className="mt-3 text-sm text-muted">
          This site is not a drive-up. A car list will pack the chairs you cannot carry.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm font-medium text-ink">{error}</p> : null}
      <Button type="submit" variant="ember" className="mt-5">
        Save this trip
      </Button>
    </form>
  );
}
