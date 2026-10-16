import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { siteById } from "@/data/catalog";
import { formatRange, nightLabel, todayISO, STYLE_LABEL } from "@/lib/format";
import { packingProgress } from "@/lib/packing";
import { useCamp } from "@/lib/store";
import { Button, Meter, PageIntro, Photo } from "@/components/ui";
import { TripForm } from "@/components/trip-form";

export const Route = createFileRoute("/trips/")({
  component: TripsPage,
});

function TripsPage() {
  const trips = useCamp((state) => state.trips);
  const [planning, setPlanning] = useState(false);
  const today = todayISO();
  const upcoming = trips
    .filter((trip) => trip.end >= today)
    .sort((a, b) => a.start.localeCompare(b.start));
  const earlier = trips
    .filter((trip) => trip.end < today)
    .sort((a, b) => b.start.localeCompare(a.start));

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageIntro kicker="The calendar" title="Trips">
          Nights you are actually taking. Name the place, then pack for it.
        </PageIntro>
        <Button variant="ember" onClick={() => setPlanning((open) => !open)}>
          {planning ? "Close" : "Plan a trip"}
        </Button>
      </div>
      {planning ? <TripForm /> : null}
      <TripList title="Coming up" trips={upcoming} empty="Nothing ahead yet. Plan a night, or pack a stop from the map." />
      <TripList title="Earlier" trips={earlier} empty="No past trips yet." />
    </div>
  );
}

function TripList({
  title,
  trips,
  empty,
}: {
  title: string;
  trips: ReturnType<typeof useCamp.getState>["trips"];
  empty: string;
}) {
  return (
    <section>
      <h2 className="font-display text-3xl text-ink">{title}</h2>
      {trips.length === 0 ? (
        <p className="mt-3 text-muted">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {trips.map((trip) => {
            const site = siteById(trip.siteId);
            const progress = packingProgress(trip);
            return (
              <li key={trip.id}>
                <Link
                  to="/trips/$tripId"
                  params={{ tripId: trip.id }}
                  className="flex gap-4 rounded-2xl bg-cream p-3 shadow-card"
                >
                  {site ? (
                    <div className="aspect-card w-28 shrink-0 overflow-hidden rounded-xl sm:w-40">
                      <Photo src={site.image} alt={site.imageAlt} />
                    </div>
                  ) : null}
                  <div className="min-w-0 flex-1 py-1">
                    <h3 className="font-display text-2xl text-ink">{trip.name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {trip.overnight === false
                        ? "A stop"
                        : `${site ? `${site.name} · ` : ""}${STYLE_LABEL[trip.style]}`}
                    </p>
                    <p className="text-sm text-muted">
                      {formatRange(trip.start, trip.end)}
                      {trip.overnight === false ? " · A stop, not a night" : ` · ${nightLabel(trip.start, trip.end)}`}
                    </p>
                    {trip.overnight === false ? (
                      <p className="mt-3 text-sm text-ink">
                        {(trip.stops ?? []).length === 1 ? "1 stop saved" : `${(trip.stops ?? []).length} stops saved`}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm tabular-nums text-ink">
                        {progress.done} of {progress.total} packed
                        {(trip.stops ?? []).length > 0 ? ` · ${(trip.stops ?? []).length} stops` : ""}
                      </p>
                    )}
                    <div className="mt-2 max-w-xs">
                      <Meter ratio={progress.ratio} />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
