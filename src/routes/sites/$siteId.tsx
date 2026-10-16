import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { siteById } from "@/data/catalog";
import { approachLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useCamp } from "@/lib/store";
import { BackLink, Button, Photo } from "@/components/ui";
import { TripForm } from "@/components/trip-form";

export const Route = createFileRoute("/sites/$siteId")({
  component: SitePage,
});

function SitePage() {
  const { siteId } = Route.useParams();
  const site = siteById(siteId);
  const saved = useCamp((state) => state.savedSites.includes(siteId));
  const toggleSite = useCamp((state) => state.toggleSite);

  if (!site) {
    return (
      <div>
        <BackLink to="/sites" label="All sites" />
        <h1 className="font-display text-4xl text-ink">That site is not on the list.</h1>
      </div>
    );
  }

  const facts = [
    ["Approach", approachLabel(site.access)],
    ["Elevation", site.elevation],
    ["Season", site.season],
    ["Walking", site.difficulty],
    ["Fire", site.fire],
    ["Water", site.water],
  ];

  return (
    <div className="space-y-8">
      <div>
        <BackLink to="/sites" label="All sites" />
        <div className="overflow-hidden rounded-3xl">
          <div className="aspect-poster md:aspect-hero">
            <Photo src={site.image} alt={site.imageAlt} priority />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-pine">{site.region}</p>
            <h1 className="mt-1 font-display text-4xl tracking-tight text-ink md:text-5xl">{site.name}</h1>
            <p className="mt-3 text-muted">{site.story}</p>
          </div>
          <Button
            variant={saved ? "pine" : "ghost"}
            className={cn(!saved && "shadow-card")}
            aria-pressed={saved}
            onClick={() => toggleSite(site.id)}
          >
            <Heart className={cn("size-4", saved && "fill-cream")} aria-hidden="true" />
            {saved ? "Saved" : "Save site"}
          </Button>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {facts.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-cream px-4 py-3 shadow-card">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <section>
        <h2 className="font-display text-3xl text-ink">Before you go</h2>
        <ul className="mt-4 space-y-3">
          {site.know.map((item) => (
            <li key={item} className="rounded-2xl bg-cream px-4 py-3 text-ink shadow-card">
              {item}
            </li>
          ))}
        </ul>
        <ul className="mt-4 flex flex-wrap gap-2">
          {site.amenities.map((item) => (
            <li key={item} className="rounded-full bg-pine/10 px-3 py-2 text-sm text-pine">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <TripForm defaultSiteId={site.id} lockSite />
    </div>
  );
}
