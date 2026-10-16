import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { milesBetween } from "@/lib/geo";
import { skyAt } from "@/lib/places";
import { cn } from "@/lib/cn";
import { Button, PageIntro } from "@/components/ui";
import { RadarMap } from "@/components/radar-map";

const LAPORTE = { lat: 41.6081, lon: -86.7189, name: "La Porte, Indiana" };
const SITES = [
  { id: "IWX", name: "North Webster", lat: 41.3586, lon: -85.7 },
  { id: "LOT", name: "Chicago", lat: 41.6044, lon: -88.0847 },
] as const;

function finite(value: unknown) {
  const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(number) ? number : undefined;
}

export const Route = createFileRoute("/radar")({
  validateSearch: (search: Record<string, unknown>): { lat?: number; lon?: number; name?: string } => {
    const lat = finite(search.lat);
    const lon = finite(search.lon);
    const name = typeof search.name === "string" ? search.name.slice(0, 80) : undefined;
    return {
      ...(lat !== undefined ? { lat } : {}),
      ...(lon !== undefined ? { lon } : {}),
      ...(name ? { name } : {}),
    };
  },
  component: RadarPage,
});

function nearerSite(lat: number, lon: number) {
  return SITES.slice().sort(
    (a, b) => milesBetween(lat, lon, a.lat, a.lon) - milesBetween(lat, lon, b.lat, b.lon),
  )[0];
}

function RadarPage() {
  const initial = Route.useSearch();
  const lookup = useServerFn(skyAt);
  const [query, setQuery] = useState("");
  const [spot, setSpot] = useState({
    lat: initial.lat ?? LAPORTE.lat,
    lon: initial.lon ?? LAPORTE.lon,
    name: initial.name || LAPORTE.name,
  });
  const [mode, setMode] = useState<"rain" | "velocity">("rain");
  const [forecast, setForecast] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<string[] | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const site = nearerSite(spot.lat, spot.lon);

  useEffect(() => {
    let cancelled = false;
    void lookup({ data: { lat: spot.lat, lon: spot.lon } })
      .then((brief) => {
        if (cancelled) return;
        setForecast(brief.forecast);
        setAlerts(brief.alerts);
      })
      .catch(() => {
        if (!cancelled) setAlerts(null);
      });
    return () => {
      cancelled = true;
    };
    // The first point only. Later searches set the brief themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(input: { q?: string; lat?: number; lon?: number; name?: string }) {
    setPending(true);
    setError("");
    try {
      const brief = await lookup({ data: input });
      setSpot({ lat: brief.lat, lon: brief.lon, name: input.name || brief.label });
      setForecast(brief.forecast);
      setAlerts(brief.alerts);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The radar search failed.");
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
    void run({ q });
  }

  function nearMe() {
    if (!navigator.geolocation) {
      setError("This browser cannot share a location. Search a town instead.");
      return;
    }
    setPending(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void run({ lat: position.coords.latitude, lon: position.coords.longitude, name: "Near you" });
      },
      () => {
        setPending(false);
        setError("Location stayed off. Search a town instead.");
      },
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  return (
    <div className="space-y-5">
      <PageIntro kicker="Storm radar" title={spot.name}>
        The same NOAA NEXRAD loop La Porte Weather Now uses, from the Iowa Environmental Mesonet. About five
        minutes behind the sky.
      </PageIntro>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label className="block flex-1">
          <span className="sr-only">Town</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="A town, or the camp"
            className="h-11 w-full rounded-full bg-cream px-4 text-ink shadow-card outline-none"
          />
        </label>
        <div className="flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Looking" : "Center"}
          </Button>
          <Button type="button" variant="ghost" className="shadow-card" onClick={nearMe} disabled={pending}>
            Near me
          </Button>
        </div>
      </form>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Radar product">
        <button
          type="button"
          aria-pressed={mode === "rain"}
          onClick={() => setMode("rain")}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium",
            mode === "rain" ? "bg-pine text-cream" : "bg-cream text-ink shadow-card",
          )}
        >
          Rain
        </button>
        <button
          type="button"
          aria-pressed={mode === "velocity"}
          onClick={() => setMode("velocity")}
          className={cn(
            "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium",
            mode === "velocity" ? "bg-pine text-cream" : "bg-cream text-ink shadow-card",
          )}
        >
          Velocity
        </button>
        <Link
          to="/map"
          className="inline-flex min-h-11 items-center rounded-full bg-cream px-4 text-sm font-medium text-ink shadow-card"
        >
          Camp map
        </Link>
      </div>
      {error ? <p className="text-sm font-medium text-ink">{error}</p> : null}
      {alerts && alerts.length > 0 ? (
        <p className="rounded-2xl bg-ember px-4 py-3 text-sm font-medium text-cream">
          NWS: {alerts.join(" · ")}
        </p>
      ) : (
        <p className="text-sm text-muted">
          {alerts ? "No active NWS alerts at this point." : "Checking National Weather Service alerts."}
        </p>
      )}
      {forecast ? <p className="text-sm text-muted">{forecast}</p> : null}
      <RadarMap lat={spot.lat} lon={spot.lon} mode={mode} site={site.id} />
      <p className="text-sm text-muted">
        {mode === "rain"
          ? "Green is light. Yellow is heavier. Red is intense. The loop is the last 50 minutes."
          : `Storm-relative velocity from ${site.name}. Green blows toward that radar, red away. Bright green beside bright red is rotation.`}
      </p>
    </div>
  );
}
