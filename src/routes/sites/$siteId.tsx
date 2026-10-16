import { Link, createFileRoute } from "@tanstack/react-router";
import { BackLink } from "@/components/ui";

export const Route = createFileRoute("/sites/$siteId")({
  component: SitePage,
});

function SitePage() {
  return (
    <div>
      <BackLink to="/sites" label="Public camps" />
      <h1 className="font-display text-4xl text-ink">That sample camp is gone.</h1>
      <p className="mt-3 max-w-xl text-muted">
        Kindling uses public campgrounds now. Search one by name, then open it on the map.
      </p>
      <Link to="/sites" className="mt-5 inline-flex min-h-11 items-center text-sm font-medium text-pine">
        Search public camps
      </Link>
    </div>
  );
}
