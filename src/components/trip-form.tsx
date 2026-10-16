import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SITES, siteById } from "@/data/catalog";
import { defaultStyle, nightLabel, nextWeekdayISO, shiftISO } from "@/lib/format";
import { useCamp } from "@/lib/store";
import type { TripStyle } from "@/lib/types";
import { Button, fieldClasses } from "@/components/ui";

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
  const [name, setName] = useState(initialSite.name);
  const [nameTouched, setNameTouched] = useState(false);
  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(shiftISO(initialStart, 2));
  const [party, setParty] = useState(2);
  const [error, setError] = useState("");

  const site = siteById(siteId) ?? SITES[0];
  const walkInCar = site.access !== "drive" && style === "car";

  function onSite(nextId: string) {
    const next = siteById(nextId);
    setSiteId(nextId);
    if (!next) return;
    setStyle(defaultStyle(next.access));
    if (!nameTouched) setName(next.name);
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
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
      name: trimmed,
      siteId,
      start,
      end,
      party,
      style,
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
            onChange={(event) => {
              setNameTouched(true);
              setName(event.target.value);
            }}
            className={fieldClasses("mt-1")}
          />
        </label>
        {lockSite ? (
          <p className="text-sm text-muted sm:col-span-2">
            At <span className="font-medium text-ink">{site.name}</span> · {site.region}
          </p>
        ) : (
          <label className="block text-sm font-medium text-ink sm:col-span-2">
            Campsite
            <select
              value={siteId}
              onChange={(event) => onSite(event.target.value)}
              className={fieldClasses("mt-1")}
            >
              {SITES.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
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
