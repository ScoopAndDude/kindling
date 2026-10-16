import { useEffect, useMemo, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { cn } from "@/lib/cn";
import { parsePublicCamps, type PublicCamp } from "@/lib/public-camps";
import { PageIntro } from "@/components/ui";

export const Route = createFileRoute("/sites/")({
  component: SitesPage,
});

function SitesPage() {
  const [camps, setCamps] = useState<PublicCamp[]>([]);
  const [query, setQuery] = useState("");
  const [fee, setFee] = useState<"all" | "free" | "paid">("all");

  useEffect(() => {
    let cancel = false;
    void fetch("/data/public-camps.json")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancel && data) setCamps(parsePublicCamps(data));
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, []);

  const sites = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (needle.length < 2) return [];
    return camps
      .filter((camp) => {
        if (fee === "free" && camp.fee !== "free") return false;
        if (fee === "paid" && camp.fee !== "paid") return false;
        return `${camp.name} ${camp.area}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => {
        const rank = (name: string) => (name.toLowerCase().startsWith(needle) ? 0 : 1);
        return rank(a.name) - rank(b.name) || a.name.localeCompare(b.name);
      })
      .slice(0, 40);
  }, [camps, query, fee]);

  return (
    <div>
      <PageIntro kicker="Public land" title="Campgrounds already on the map">
        These are public campgrounds, not sample places. Search a name or a state, then open it on the map.
      </PageIntro>
      <div className="mb-6 space-y-3">
        <label className="block">
          <span className="sr-only">Search public campgrounds</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a campground or a state"
            className="h-11 w-full rounded-full bg-cream px-4 text-ink shadow-card outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Fee">
          {(
            [
              ["all", "Any fee"],
              ["free", "Listed free"],
              ["paid", "Fee"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={fee === id}
              onClick={() => setFee(id)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium",
                fee === id ? "bg-pine text-cream" : "bg-cream text-ink shadow-card",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {camps.length === 0 ? (
        <p className="text-muted">Loading public campgrounds.</p>
      ) : query.trim().length < 2 ? (
        <p className="text-muted">{camps.length.toLocaleString()} public campgrounds. Type at least two letters.</p>
      ) : sites.length === 0 ? (
        <p className="text-muted">Nothing under that name. Try the town or the state.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {sites.map((camp) => (
            <li key={camp.id}>
              <Link
                to="/map"
                search={{ lat: camp.lat, lon: camp.lon, name: camp.name }}
                className="block rounded-2xl bg-cream p-4 shadow-card"
              >
                <h2 className="font-display text-2xl text-ink">{camp.name}</h2>
                <p className="mt-1 text-sm text-muted">
                  {camp.area || "Public land"}
                  {camp.fee === "free" ? " · Listed free" : camp.fee === "paid" ? " · Fee" : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
