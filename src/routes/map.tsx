import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { KIND_LABEL, LANDMARKS, type Place, type PlaceKind } from "@/data/landmarks";
import { milesBetween } from "@/lib/geo";
import { nextWeekdayISO, shiftISO, todayISO } from "@/lib/format";
import { findPlaces } from "@/lib/places";
import { cn } from "@/lib/cn";
import { useCamp } from "@/lib/store";
import { CampMap } from "@/components/camp-map";
import { Button, PageIntro } from "@/components/ui";
import { campPlace, parsePublicCamps, type PublicCamp } from "@/lib/public-camps";
import { parseRestStops, restPlace, type RestStop } from "@/lib/rest-stops";
import { parseScenic, scenicPlace, type ScenicSpot } from "@/lib/scenic";
import { usState } from "@/lib/states";
import { campRules } from "@/lib/rules";

function asNumber(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) ? number : undefined;
}

export const Route = createFileRoute("/map")({
  validateSearch: (search: Record<string, unknown>): { lat?: number; lon?: number; name?: string } => {
    const lat = asNumber(search.lat);
    const lon = asNumber(search.lon);
    const name = typeof search.name === "string" ? search.name : undefined;
    return {
      ...(lat === undefined ? {} : { lat }),
      ...(lon === undefined ? {} : { lon }),
      ...(name === undefined ? {} : { name }),
    };
  },
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

function placeLabel(place: { area: string; lat: number; lon: number }) {
  return place.area || usState(place.lat, place.lon);
}

function MapPage() {
  const focus = Route.useSearch();
  const navigate = useNavigate();
  const addTrip = useCamp((state) => state.addTrip);
  const addStop = useCamp((state) => state.addStop);
  const trips = useCamp((state) => state.trips);
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [stayAsk, setStayAsk] = useState<Place | null>(null);
  const [chooseTrip, setChooseTrip] = useState(false);
  const [camps, setCamps] = useState<PublicCamp[]>([]);
  const [stops, setStops] = useState<RestStop[]>([]);
  const [scenic, setScenic] = useState<ScenicSpot[]>([]);

  useEffect(() => {
    let cancel = false;
    void fetch("/data/public-camps.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancel && data) setCamps(parsePublicCamps(data));
      })
      .catch(() => undefined);
    void fetch("/data/scenic.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancel && Array.isArray(data)) setScenic(parseScenic(data));
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
    if (focus.lat === undefined || focus.lon === undefined || camps.length === 0) return;
    let best: PublicCamp | undefined;
    let bestMiles = 0.3;
    for (const camp of camps) {
      const away = milesBetween(focus.lat, focus.lon, camp.lat, camp.lon);
      if (away < bestMiles) {
        best = camp;
        bestMiles = away;
      }
    }
    if (best) {
      setSelectedId(best.id);
      setView({ lat: best.lat, lon: best.lon, zoom: 12 });
    }
  }, [camps, focus.lat, focus.lon]);

  useEffect(() => {
    if (focus.lat !== undefined && focus.lon !== undefined) {
      if (focus.name) setQuery(focus.name);
      void runSearch({ lat: focus.lat, lon: focus.lon });
      return;
    }
    if (!navigator.geolocation) {
      void runSearch({ q: HOME.label });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setQuery("Near you");
        void runSearch({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      () => {
        void runSearch({ q: HOME.label });
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 },
    );
    // Start near the phone when it can share a location. Otherwise La Porte.
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

  const scenicNear = useMemo(() => {
    if (!origin) return [];
    return scenic
      .filter((spot) => kinds.includes(spot.kind))
      .map((spot) => ({ spot, miles: milesBetween(origin.lat, origin.lon, spot.lat, spot.lon) }))
      .filter((item) => item.miles <= miles)
      .sort((a, b) => a.miles - b.miles);
  }, [scenic, origin, miles, kinds]);

  const shown = useMemo(() => {
    const listed = publicNear.slice(0, 40).map((item) => campPlace(item.camp));
    const roadside = stopsNear.slice(0, 30).map((item) => restPlace(item.stop));
    const scenery = scenicNear.slice(0, 40).map((item) => scenicPlace(item.spot));
    return [...listed, ...roadside, ...scenery, ...places]
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
  }, [places, camps, kinds, freeOnly, origin, miles, publicNear, stopsNear, scenicNear]);

  const groups = useMemo(() => {
    const campItems = publicNear.slice(0, 5).map((item) => ({ place: campPlace(item.camp), miles: item.miles }));
    const restItems = stopsNear.slice(0, 5).map((item) => ({ place: restPlace(item.stop), miles: item.miles }));
    const scenicItems = scenicNear.slice(0, 5).map((item) => ({ place: scenicPlace(item.spot), miles: item.miles }));
    const other = places
      .filter((place) => place.kind === "water" || place.kind === "dump" || place.kind === "shower")
      .filter((place) => kinds.includes(place.kind))
      .filter((place) => !freeOnly || place.fee === "free")
      .map((place) => ({
        place,
        miles: origin ? milesBetween(origin.lat, origin.lon, place.lat, place.lon) : null,
      }))
      .filter((item) => item.miles === null || item.miles <= miles)
      .sort((a, b) => (a.miles ?? 0) - (b.miles ?? 0))
      .slice(0, 5);
    return [
      { title: "Closest camps", items: campItems },
      { title: "Closest rest stops", items: restItems },
      { title: "Closest scenic spots", items: scenicItems },
      { title: "Closest water and dumps", items: other },
    ].filter((group) => group.items.length > 0);
  }, [publicNear, stopsNear, scenicNear, places, kinds, freeOnly, origin, miles]);

  const pins = useMemo(
    () => shown.map((item) => item.place).filter((place) => !place.id.startsWith("pub-") && !place.id.startsWith("rest-") && !place.id.startsWith("scene-")),
    [shown],
  );
  const mapStops = useMemo(() => (kinds.includes("rest") ? stops : []), [stops, kinds]);
  const mapScenic = useMemo(
    () => scenic.filter((spot) => kinds.includes(spot.kind)),
    [scenic, kinds],
  );
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

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || !searchOpen) return [];
    const hits: { id: string; name: string; area: string; kind: string; lat: number; lon: number }[] = [];
    for (const camp of camps) {
      if (`${camp.name} ${camp.area}`.toLowerCase().includes(q)) {
        hits.push({ id: camp.id, name: camp.name, area: camp.area, kind: "Public camp", lat: camp.lat, lon: camp.lon });
      }
    }
    for (const stop of stops) {
      if (`${stop.name} ${stop.area}`.toLowerCase().includes(q)) {
        hits.push({ id: stop.id, name: stop.name, area: stop.area, kind: "Rest stop", lat: stop.lat, lon: stop.lon });
      }
    }
    for (const spot of scenic) {
      if (`${spot.name} ${spot.area}`.toLowerCase().includes(q)) {
        hits.push({
          id: spot.id,
          name: spot.name,
          area: spot.area,
          kind: spot.kind === "waterfall" ? "Waterfall" : spot.kind === "trail" ? "Trailhead" : "Viewpoint",
          lat: spot.lat,
          lon: spot.lon,
        });
      }
    }
    const rank = (name: string) => (name.toLowerCase().startsWith(q) ? 0 : name.toLowerCase().includes(q) ? 1 : 2);
    return hits.sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name)).slice(0, 8);
  }, [query, camps, stops, scenic, searchOpen]);

  function pickSpot(spot: { id: string; name: string; lat: number; lon: number }) {
    setQuery(spot.name);
    setSelectedId(spot.id);
    setView({ lat: spot.lat, lon: spot.lon, zoom: 12 });
    setError("");
    setSearchOpen(false);
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

  function styleFor(kind: Place["kind"]) {
    return kind === "trail" || kind === "waterfall" ? "backpack" : "car";
  }

  function pack(place: Place) {
    const start = nextWeekdayISO(5);
    const id = addTrip({
      name: place.name,
      siteId: "map",
      start,
      end: shiftISO(start, 2),
      party: 2,
      style: styleFor(place.kind),
      notes: `${KIND_LABEL[place.kind]}${placeLabel(place) ? ` · ${placeLabel(place)}` : ""}. ${place.detail} Confirm the rules before you stay.`.trim(),
      lat: place.lat,
      lon: place.lon,
      overnight: true,
    });
    void navigate({ to: "/trips/$tripId", params: { tripId: id } });
  }

  function upcomingTrips() {
    const today = todayISO();
    return trips.filter((trip) => trip.end >= today).sort((a, b) => a.start.localeCompare(b.start));
  }

  function keepStop(place: Place, tripId?: string) {
    const stop = {
      name: place.name,
      kind: KIND_LABEL[place.kind],
      area: placeLabel(place),
      lat: place.lat,
      lon: place.lon,
    };
    const upcoming = upcomingTrips();
    const target = tripId ? upcoming.find((trip) => trip.id === tripId) : upcoming.length === 1 ? upcoming[0] : undefined;
    if (target) {
      addStop(target.id, stop);
      setStayAsk(null);
      setChooseTrip(false);
      void navigate({ to: "/trips/$tripId", params: { tripId: target.id } });
      return;
    }
    const today = todayISO();
    const id = addTrip({
      name: place.name,
      siteId: "stop",
      start: today,
      end: today,
      party: 1,
      style: styleFor(place.kind),
      notes: `${KIND_LABEL[place.kind]} · a stop, not a night.`,
      lat: place.lat,
      lon: place.lon,
      overnight: false,
      stops: [{ ...stop, id: "stop-0" }],
    });
    setStayAsk(null);
    setChooseTrip(false);
    void navigate({ to: "/trips/$tripId", params: { tripId: id } });
  }

  function requestPack(place: Place) {
    if (place.kind === "camp") {
      pack(place);
      return;
    }
    setChooseTrip(false);
    setStayAsk(place);
  }

  const selected =
    (selectedId &&
      (shown.find((item) => item.place.id === selectedId)?.place ??
        (camps.find((camp) => camp.id === selectedId) ? campPlace(camps.find((camp) => camp.id === selectedId)!) : undefined) ??
        (stops.find((stop) => stop.id === selectedId) ? restPlace(stops.find((stop) => stop.id === selectedId)!) : undefined) ??
        (scenic.find((spot) => spot.id === selectedId) ? scenicPlace(scenic.find((spot) => spot.id === selectedId)!) : undefined) ??
        places.find((place) => place.id === selectedId))) ||
    null;

  return (
    <div className="space-y-5">
      <PageIntro kicker="Camp map" title="Find the night, and the reason to stop.">
        Search a U.S. town. Public campgrounds cover the country. Rest areas, welcome centers, and service plazas are on the map with the water, dumps, and scenic stops.
      </PageIntro>
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
        <button
          type="button"
          onClick={nearMe}
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-full bg-cream px-4 text-sm font-medium text-ink shadow-card disabled:opacity-60"
        >
          Near me
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
      <div className="space-y-4">
        <div className="relative">
          <form onSubmit={onSubmit} className="absolute top-3 right-3 left-14 z-[500]">
            <label className="block">
              <span className="sr-only">Search the map</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
                placeholder="Search a town, camp, or rest stop"
                className="h-12 w-full rounded-full bg-cream/95 pr-28 pl-4 text-ink shadow-card outline-none backdrop-blur"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="absolute top-1 right-1 inline-flex h-10 items-center rounded-full bg-pine px-4 text-sm font-medium text-cream disabled:opacity-60"
            >
              {pending ? "Looking" : "Search"}
            </button>
            {suggestions.length > 0 ? (
              <ul className="mt-2 max-h-72 overflow-auto rounded-2xl bg-cream shadow-card">
                {suggestions.map((spot) => (
                  <li key={spot.id}>
                    <button
                      type="button"
                      onClick={() => pickSpot(spot)}
                      className="flex min-h-11 w-full flex-col items-start justify-center px-4 py-2 text-left hover:bg-paper"
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
          </form>
          <div className="relative">
          <CampMap
            places={pins}
            camps={mapCamps}
            stops={mapStops}
            scenic={mapScenic}
            lat={view.lat}
            lon={view.lon}
            zoom={view.zoom}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              const place =
                places.find((item) => item.id === id) ??
                (camps.find((camp) => camp.id === id) ? campPlace(camps.find((camp) => camp.id === id)!) : undefined) ??
                (stops.find((stop) => stop.id === id) ? restPlace(stops.find((stop) => stop.id === id)!) : undefined) ??
                (scenic.find((spot) => spot.id === id) ? scenicPlace(scenic.find((spot) => spot.id === id)!) : undefined);
              if (place) setView({ lat: place.lat, lon: place.lon, zoom: Math.max(view.zoom, 11) });
            }}
          />
          {selected ? (
            <div className="absolute right-3 bottom-3 left-3 z-[500] rounded-2xl bg-cream p-3 shadow-card">
              <p className="text-sm text-pine">{KIND_LABEL[selected.kind]}</p>
              <p className="font-display text-2xl text-ink">{selected.name}</p>
              <p className="text-sm text-muted">{placeLabel(selected) || "Mapped spot"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selected.lat.toFixed(5)},${selected.lon.toFixed(5)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-medium text-cream"
                >
                  Directions
                </a>
                <Button variant="ember" onClick={() => requestPack(selected)}>
                  {selected.kind === "camp" ? "Pack for this" : "Staying here?"}
                </Button>
                {selected.kind === "camp" ? (
                  <a
                    href={campRules(selected.name, selected.area).href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-full bg-cream px-4 text-sm font-medium text-ink shadow-card"
                  >
                    {campRules(selected.name, selected.area).label}
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
          </div>
          <p className="mt-2 text-sm text-muted">
            {camps.length === 0
              ? "Loading public campsites."
              : origin
                ? `${publicNear.length} public camps, ${stopsNear.length} rest stops, and ${scenicNear.length} scenic spots within ${miles} miles. Green camps, orange rest stops, blue waterfalls, purple viewpoints, dark trails.`
                : `${camps.length.toLocaleString()} public campsites and ${stops.length.toLocaleString()} rest stops. Orange dots are rest areas, welcome centers, and service plazas.`}
            {" "}
            Source: American Adventurer public-land records. Check the rules before you stay.
          </p>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl text-ink">
              {origin ? origin.label : "Known spots"}
            </h2>
            {origin ? (
              <button type="button" onClick={showKnown} className="min-h-11 text-sm font-medium text-pine">
                Whole map
              </button>
            ) : null}
          </div>
          {stayAsk ? (
            <div className="mb-4 rounded-2xl bg-cream p-4 shadow-card">
              <p className="font-display text-2xl text-ink">Staying the night at {stayAsk.name}?</p>
              <p className="mt-1 text-sm text-muted">
                A waterfall, viewpoint, trail, or rest stop is just a stop unless you are camping there.
              </p>
              {chooseTrip ? (
                <div className="mt-3 flex flex-col items-start gap-2">
                  <p className="text-sm text-ink">Which trip should this stop go on?</p>
                  {upcomingTrips().map((trip) => (
                    <Button key={trip.id} variant="ghost" className="shadow-card" onClick={() => keepStop(stayAsk, trip.id)}>
                      {trip.name}
                    </Button>
                  ))}
                  <Button variant="ember" onClick={() => keepStop(stayAsk, "new")}>
                    Save as its own stop
                  </Button>
                </div>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="ember"
                    onClick={() => {
                      pack(stayAsk);
                      setStayAsk(null);
                      setChooseTrip(false);
                    }}
                  >
                    Yes, pack for the night
                  </Button>
                  <Button
                    variant="ghost"
                    className="shadow-card"
                    onClick={() => {
                      if (upcomingTrips().length > 1) setChooseTrip(true);
                      else keepStop(stayAsk);
                    }}
                  >
                    Just a stop
                  </Button>
                </div>
              )}
            </div>
          ) : null}
          {groups.length === 0 ? (
            <p className="text-muted">
              {origin
                ? "Nothing in this filter. Widen the miles or turn a layer back on."
                : "Search a town to see the closest camps, rest stops, and scenic spots."}
            </p>
          ) : (
            <div className="space-y-6">
              {groups.map((group) => (
                <section key={group.title}>
                  <h3 className="font-display text-2xl text-ink">{group.title}</h3>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {group.items.map(({ place, miles: away }) => (
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
                              {placeLabel(place) || "Mapped nearby"}
                              {away !== null ? ` · ${away < 10 ? away.toFixed(1) : Math.round(away)} mi` : ""}
                              {place.fee === "free" ? " · Listed free" : place.fee === "paid" ? " · Fee" : ""}
                            </p>
                          </button>
                          <div className="mt-3 flex flex-wrap gap-2">
                          <Button variant="ember" onClick={() => requestPack(place)}>
                            {place.kind === "camp" ? "Pack for this" : "Staying here?"}
                          </Button>
                          {place.kind === "camp" ? (
                            <a
                              href={campRules(place.name, place.area).href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-11 items-center text-sm font-medium text-pine"
                            >
                              {campRules(place.name, place.area).label}
                            </a>
                          ) : null}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
