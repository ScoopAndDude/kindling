import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { KIND_LABEL, LANDMARKS, type Place, type PlaceKind } from "@/data/landmarks";
import { milesBetween } from "@/lib/geo";
import { nextWeekdayISO, shiftISO } from "@/lib/format";
import { findPlaces } from "@/lib/places";
import { cn } from "@/lib/cn";
import { useCamp } from "@/lib/store";
import { CampMap } from "@/components/camp-map";
import { Button, PageIntro } from "@/components/ui";
import { campPlace, parsePublicCamps, type PublicCamp } from "@/lib/public-camps";
import { parseRestStops, restPlace, type RestStop } from "@/lib/rest-stops";

export const Route = createFileRoute("/map")({
  component: MapPage,
});

const FILTERS: { id: PlaceKind; label: string }[] = [
  { id: "camp", label: "Camps" },
  { id: "waterfall", label: "Waterfalls" },
  { id: "scenic", label: "Scenic" },
  { id: "trail", label: "Trails" },
  { id: "water", label: "Water" },
  { id: "dump", label: "Dumps" },
  { id: "rest", label: "Rest areas" },
  { id: "shower", label: "Showers" },
];

const HOME = { lat: 41.6081, lon: -86.7189, label: "La Porte, Indiana" };

function MapPage() {
  const navigate = useNavigate();
  const addTrip = useCamp((state) => state.addTrip);
  const search = useServerFn(findPlaces);
  const [query, setQuery] = useState(HOME.label);
  const [miles, setMiles] = useState<25 | 50 | 100>(100);
  const [kinds, setKinds] = useState<PlaceKind[]>(FILTERS.map((item) => item.id));
  const [freeOnly, setFreeOnly] = useState(false);
  const [places, setPlaces] = useState<Place[]>(LANDMARKS);
  const [origin, setOrigin] = useState<{ lat: number; lon: number; label: string } | null>(HOME);
  const [view, setView] = useState({ lat: HOME.lat, lon: HOME.lon, zoom: 10 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [forecast, setForecast] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [camps, setCamps] = useState<PublicCamp[]>([]);
  const [stops, setStops] = useState<RestStop[]>([]);

  useEffect(() => {
    let cancel = false;
    void fetch("/data/public-camps.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancel && data) setCamps(parsePublicCamps(data));
      })
      .catch(() => undefined);
    void fetch("/data/rest-areas.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancel && Array.isArray(data)) setStops(parseRestStops(data));
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    void runSearch({ q: HOME.label });
    // Load the home town once. Later searches come from the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publicNear = useMemo(() => {
    if (!origin || !kinds.includes("camp")) return [];
    return camps
      .filter((camp) => !freeOnly || camp.fee === "free")
      .map((camp) => ({ camp, miles: milesBetween(origin.lat, origin.lon, camp.lat, camp.lon) }))
      .filter((item) => item.miles <= miles)
      .sort((a, b) => a.miles - b.miles);
  }, [camps, origin, miles, freeOnly, kinds]);

  const stopsNear = useMemo(() => {
    if (!origin || !kinds.includes("rest")) return [];
    return stops
      .map((stop) => ({ stop, miles: milesBetween(origin.lat, origin.lon, stop.lat, stop.lon) }))
      .filter((item) => item.miles <= miles)
      .sort((a, b) => a.miles - b.miles);
  }, [stops, origin, miles, kinds]);

  const shown = useMemo(() => {
    const listed = publicNear.slice(0, 40).map((item) => campPlace(item.camp));
    const roadside = stopsNear.slice(0, 30).map((item) => restPlace(item.stop));
    return [...listed, ...roadside, ...places]
      .filter((place) => kinds.includes(place.kind))
      .filter((place) => !freeOnly || place.fee === "free")
      .filter((place) => !origin || milesBetween(origin.lat, origin.lon, place.lat, place.lon) <= miles)
      .map((place) => ({
        place,
        miles: origin ? milesBetween(origin.lat, origin.lon, place.lat, place.lon) : null,
      }))
      .sort((a, b) => {
        if (a.miles === null || b.miles === null) return a.place.name.localeCompare(b.place.name);
        return a.miles - b.miles;
      });
  }, [places, camps, kinds, freeOnly, origin, miles, publicNear, stopsNear]);

  const pins = useMemo(
    () => shown.map((item) => item.place).filter((place) => !place.id.startsWith("pub-") && !place.id.startsWith("rest-")),
    [shown],
  );
  const mapStops = useMemo(() => (kinds.includes("rest") ? stops : []), [stops, kinds]);
  const mapCamps = useMemo(() => {
    if (!kinds.includes("camp")) return [];
    return freeOnly ? camps.filter((camp) => camp.fee === "free") : camps;
  }, [camps, kinds, freeOnly]);

  function toggleKind(kind: PlaceKind) {
    setKinds((current) => {
      if (current.includes(kind)) {
        const next = current.filter((item) => item !== kind);
        return next.length === 0 ? current : next;
      }
      return [...current, kind];
    });
  }

  async function runSearch(input: { q?: string; lat?: number; lon?: number }) {
    setPending(true);
    setError("");
    try {
      const result = await search({ data: { ...input, miles } });
      setPlaces(result.places);
      setOrigin({ lat: result.lat, lon: result.lon, label: result.label });
      setView({ lat: result.lat, lon: result.lon, zoom: miles <= 25 ? 10 : miles <= 50 ? 9 : 8 });
      setForecast(result.forecast);
      setNotice(result.notice);
      setSelectedId(result.places[0]?.id ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The map search failed.");
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = query.trim();
    if (!q) {
      setError("Search a town.");
      return;
    }
    void runSearch({ q });
  }

  function nearMe() {
    if (!navigator.geolocation) {
      setError("This browser cannot share a location. Search a town instead.");
      return;
    }
    setPending(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void runSearch({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      () => {
        setPending(false);
        setError("Location stayed off. Search a town instead.");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  function showKnown() {
    setPlaces(LANDMARKS);
    setOrigin(null);
    setView({ lat: 39.8, lon: -98.6, zoom: 4 });
    setForecast(null);
    setNotice(null);
    setError("");
    setSelectedId(null);
  }

  function pack(place: Place) {
    const start = nextWeekdayISO(5);
    const id = addTrip({
      name: place.name,
      siteId: "map",
      start,
      end: shiftISO(start, 2),
      party: 2,
      style: place.kind === "camp" || place.kind === "dump" ? "car" : "backpack",
      notes: `${KIND_LABEL[place.kind]}${place.area ? ` · ${place.area}` : ""}. ${place.detail} Confirm the rules before you stay.`.trim(),
    });
    void navigate({ to: "/trips/$tripId", params: { tripId: id } });
  }

  return (
    <div className="space-y-5">
      <PageIntro kicker="Camp map" title="Find the night, and the reason to stop.">
        Search a U.S. town. Public campgrounds cover the country. Rest areas, welcome centers, and service plazas are on the map with the water, dumps, and scenic stops.
      </PageIntro>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label className="block flex-1">
          <span className="sr-only">Town</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="La Porte, Indiana"
            className="h-11 w-full rounded-full bg-cream px-4 text-ink shadow-card outline-none"
          />
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Looking" : "Search"}
          </Button>
          <Button type="button" variant="ghost" className="shadow-card" onClick={nearMe} disabled={pending}>
            Near me
          </Button>
        </div>
      </form>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Distance">
        {([25, 50, 100] as const).map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={miles === value}
            onClick={() => setMiles(value)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium",
              miles === value ? "bg-pine text-cream" : "bg-cream text-ink shadow-card",
            )}
          >
            {value} mi
          </button>
        ))}
        <button
          type="button"
          aria-pressed={freeOnly}
          onClick={() => setFreeOnly((value) => !value)}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium",
            freeOnly ? "bg-pine text-cream" : "bg-cream text-ink shadow-card",
          )}
        >
          Listed free
        </button>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="What to show">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={kinds.includes(item.id)}
            onClick={() => toggleKind(item.id)}
            className={cn(
              "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium",
              kinds.includes(item.id) ? "bg-ink text-cream" : "bg-cream text-ink shadow-card",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      {error ? <p className="text-sm font-medium text-ink">{error}</p> : null}
      {forecast ? <p className="text-sm text-muted">{forecast}</p> : null}
      {origin ? (
        <Link
          to="/radar"
          search={{ lat: origin.lat, lon: origin.lon, name: origin.label }}
          className="inline-flex min-h-11 items-center text-sm font-medium text-pine"
        >
          Radar over {origin.label}
        </Link>
      ) : null}
      {notice ? <p className="text-sm text-muted">{notice}</p> : null}
      <div className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <CampMap
            places={pins}
            camps={mapCamps}
            stops={mapStops}
            lat={view.lat}
            lon={view.lon}
            zoom={view.zoom}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              const place =
                places.find((item) => item.id === id) ??
                (camps.find((camp) => camp.id === id) ? campPlace(camps.find((camp) => camp.id === id)!) : undefined) ??
                (stops.find((stop) => stop.id === id) ? restPlace(stops.find((stop) => stop.id === id)!) : undefined);
              if (place) setView({ lat: place.lat, lon: place.lon, zoom: Math.max(view.zoom, 11) });
            }}
          />
          <p className="mt-2 text-sm text-muted">
            {camps.length === 0
              ? "Loading public campsites."
              : origin
                ? `${publicNear.length} public camps and ${stopsNear.length} rest stops within ${miles} miles. Green dots are free camps. Orange dots are rest areas, welcome centers, and service plazas.`
                : `${camps.length.toLocaleString()} public campsites and ${stops.length.toLocaleString()} rest stops. Orange dots are rest areas, welcome centers, and service plazas.`}
            {" "}
            Source: American Adventurer public-land records. Check the rules before you stay.
          </p>
        </div>
        <div className="lg:col-span-2">
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-ink">
              {origin ? origin.label : "Known spots"}
              <span className="ml-2 font-sans text-base font-medium text-muted">{shown.length}</span>
            </h2>
            {origin ? (
              <button type="button" onClick={showKnown} className="min-h-11 text-sm font-medium text-pine">
                Whole map
              </button>
            ) : null}
          </div>
          {shown.length === 0 ? (
            <p className="text-muted">Nothing in this filter. Widen the miles or turn a layer back on.</p>
          ) : (
            <ul className="max-h-[36rem] space-y-2 overflow-auto pr-1">
              {shown.map(({ place, miles: away }) => (
                <li key={place.id}>
                  <div
                    className={cn(
                      "rounded-2xl bg-cream p-3 shadow-card",
                      selectedId === place.id && "ring-2 ring-pine",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(place.id);
                        setView({ lat: place.lat, lon: place.lon, zoom: 12 });
                      }}
                      className="w-full text-left"
                    >
                      <p className="text-sm text-pine">{KIND_LABEL[place.kind]}</p>
                      <p className="font-display text-xl text-ink">{place.name}</p>
                      <p className="text-sm text-muted">
                        {place.area || "Mapped nearby"}
                        {away !== null ? ` · ${away < 10 ? away.toFixed(1) : Math.round(away)} mi` : ""}
                        {place.fee === "free" ? " · Listed free" : place.fee === "paid" ? " · Fee" : ""}
                      </p>
                    </button>
                    <Button variant="ember" className="mt-3" onClick={() => pack(place)}>
                      Pack for this
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
