import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { APPROACHES, SITES, TERRAINS } from "@/data/catalog";
import type { Access, Terrain } from "@/lib/types";
import { cn } from "@/lib/cn";
import { PageIntro } from "@/components/ui";
import { SiteCard } from "@/components/site-card";

export const Route = createFileRoute("/sites/")({
  component: SitesPage,
});

function SitesPage() {
  const [terrain, setTerrain] = useState<Terrain | "all">("all");
  const [access, setAccess] = useState<Access | "all">("all");
  const [query, setQuery] = useState("");

  const sites = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return SITES.filter((site) => {
      if (terrain !== "all" && site.terrain !== terrain) return false;
      if (access !== "all" && site.access !== access) return false;
      if (!needle) return true;
      return `${site.name} ${site.region} ${site.blurb}`.toLowerCase().includes(needle);
    });
  }, [terrain, access, query]);

  return (
    <div>
      <PageIntro kicker="Eight places" title="Where to put the tent">
        Quiet sites, not reservation desks. Save the ones that fit the season.
      </PageIntro>
      <div className="mb-6 space-y-3">
        <label className="block">
          <span className="sr-only">Search campsites</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search a name or a region"
            className="h-11 w-full rounded-full bg-cream px-4 text-ink shadow-card outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Terrain">
          {TERRAINS.map((item) => (
            <FilterChip
              key={item.id}
              pressed={terrain === item.id}
              onClick={() => setTerrain(item.id)}
              label={item.label}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Approach">
          {APPROACHES.map((item) => (
            <FilterChip
              key={item.id}
              pressed={access === item.id}
              onClick={() => setAccess(item.id)}
              label={item.label}
            />
          ))}
        </div>
      </div>
      {sites.length === 0 ? (
        <p className="text-muted">Nothing under that name. Try another terrain.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  pressed,
  onClick,
  label,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 items-center rounded-full px-4 text-sm font-medium",
        pressed ? "bg-pine text-cream" : "bg-cream text-ink shadow-card",
      )}
    >
      {label}
    </button>
  );
}
