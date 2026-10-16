import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Site } from "@/data/catalog";
import { approachLabel } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useCamp } from "@/lib/store";
import { Photo } from "@/components/ui";

export function SiteCard({ site }: { site: Site }) {
  const saved = useCamp((state) => state.savedSites.includes(site.id));
  const toggleSite = useCamp((state) => state.toggleSite);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-cream shadow-card">
      <button
        type="button"
        aria-pressed={saved}
        aria-label={saved ? `Unsave ${site.name}` : `Save ${site.name}`}
        onClick={() => toggleSite(site.id)}
        className={cn(
          "absolute top-3 right-3 z-10 grid size-11 place-items-center rounded-full",
          saved ? "bg-cream text-ember" : "bg-ink/45 text-cream",
        )}
      >
        <Heart className={cn("size-5", saved && "fill-ember")} aria-hidden="true" />
      </button>
      <Link
        to="/sites/$siteId"
        params={{ siteId: site.id }}
        className="flex flex-1 flex-col focus-visible:outline-none"
      >
        <div className="aspect-card overflow-hidden">
          <Photo
            src={site.image}
            alt={site.imageAlt}
            className="transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <p className="text-sm text-muted">{site.region}</p>
          <h3 className="font-display text-2xl text-ink">{site.name}</h3>
          <p className="text-sm text-muted">{site.blurb}</p>
          <p className="mt-2 text-sm text-ink">
            {approachLabel(site.access)} · {site.season}
          </p>
        </div>
      </Link>
    </article>
  );
}
