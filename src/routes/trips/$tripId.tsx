import { useState } from "react";
import { Link, useNavigate, createFileRoute } from "@tanstack/react-router";
import { Check, Trash2 } from "lucide-react";
import { GROUPS, siteById } from "@/data/catalog";
import { formatRange, nightLabel, STYLE_LABEL } from "@/lib/format";
import { itemsFor, packingProgress } from "@/lib/packing";
import { cn } from "@/lib/cn";
import { useCamp } from "@/lib/store";
import type { TripStyle } from "@/lib/types";
import { BackLink, Button, fieldClasses, Meter, Photo } from "@/components/ui";

export const Route = createFileRoute("/trips/$tripId")({
  component: TripPage,
});

function TripPage() {
  const { tripId } = Route.useParams();
  const navigate = useNavigate();
  const trip = useCamp((state) => state.trips.find((item) => item.id === tripId));
  const toggleCheck = useCamp((state) => state.toggleCheck);
  const addExtra = useCamp((state) => state.addExtra);
  const toggleExtra = useCamp((state) => state.toggleExtra);
  const removeExtra = useCamp((state) => state.removeExtra);
  const setNotes = useCamp((state) => state.setNotes);
  const updateTrip = useCamp((state) => state.updateTrip);
  const removeTrip = useCamp((state) => state.removeTrip);
  const [extra, setExtra] = useState("");
  const [confirming, setConfirming] = useState(false);

  if (!trip) {
    return (
      <div>
        <BackLink to="/trips" label="All trips" />
        <h1 className="font-display text-4xl text-ink">That trip is gone.</h1>
      </div>
    );
  }

  const site = siteById(trip.siteId);
  const progress = packingProgress(trip);
  const items = itemsFor(trip.style);

  function onAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = extra.trim();
    if (!label || !trip) return;
    addExtra(trip.id, label);
    setExtra("");
  }

  return (
    <div>
      <BackLink to="/trips" label="All trips" />
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-sm font-medium text-pine">{site?.region ?? "Campsite"}</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight text-ink md:text-5xl">{trip.name}</h1>
          <p className="mt-2 text-muted">
            {formatRange(trip.start, trip.end)} · {nightLabel(trip.start, trip.end)} · {trip.party}{" "}
            {trip.party === 1 ? "person" : "people"}
          </p>
          <div className="mt-4 flex items-center gap-4">
            <p className="text-sm tabular-nums text-ink">
              {progress.done} of {progress.total} packed
            </p>
            <div className="max-w-xs flex-1">
              <Meter ratio={progress.ratio} />
            </div>
          </div>

          <div className="mt-8 space-y-6">
            {GROUPS.map((group) => {
              const groupItems = items.filter((item) => item.group === group);
              if (groupItems.length === 0) return null;
              return (
                <section key={group}>
                  <h2 className="font-display text-2xl text-ink">{group}</h2>
                  <ul className="mt-2">
                    {groupItems.map((item) => {
                      const checked = Boolean(trip.checks[item.id]);
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            aria-pressed={checked}
                            onClick={() => toggleCheck(trip.id, item.id)}
                            className="flex min-h-11 w-full items-center gap-3 text-left"
                          >
                            <span
                              className={cn(
                                "grid size-5 shrink-0 place-items-center rounded-md",
                                checked ? "bg-pine text-cream" : "bg-cream shadow-card",
                              )}
                              aria-hidden="true"
                            >
                              {checked ? <Check className="size-3.5" /> : null}
                            </span>
                            <span className={cn(checked ? "text-muted line-through" : "text-ink")}>
                              {item.label}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
            <section>
              <h2 className="font-display text-2xl text-ink">Added</h2>
              <ul className="mt-2">
                {trip.extras.map((item) => (
                  <li key={item.id} className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-pressed={item.done}
                      onClick={() => toggleExtra(trip.id, item.id)}
                      className="flex min-h-11 flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-md",
                          item.done ? "bg-pine text-cream" : "bg-cream shadow-card",
                        )}
                        aria-hidden="true"
                      >
                        {item.done ? <Check className="size-3.5" /> : null}
                      </span>
                      <span className={cn(item.done ? "text-muted line-through" : "text-ink")}>
                        {item.label}
                      </span>
                    </button>
                    <button
                      type="button"
                      aria-label={`Remove ${item.label}`}
                      onClick={() => removeExtra(trip.id, item.id)}
                      className="grid size-11 place-items-center rounded-full text-muted hover:text-ink"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={onAdd} className="mt-3 flex gap-2">
                <label className="sr-only" htmlFor="extra-item">
                  Add a packing line
                </label>
                <input
                  id="extra-item"
                  value={extra}
                  onChange={(event) => setExtra(event.target.value)}
                  placeholder="Add a line"
                  className={fieldClasses()}
                />
                <Button type="submit">Add</Button>
              </form>
            </section>
          </div>
        </div>

        <aside className="space-y-4">
          {site ? (
            <Link
              to="/sites/$siteId"
              params={{ siteId: site.id }}
              className="block overflow-hidden rounded-2xl bg-cream shadow-card"
            >
              <div className="aspect-card overflow-hidden">
                <Photo src={site.image} alt={site.imageAlt} />
              </div>
              <div className="p-4">
                <p className="text-sm text-muted">{site.region}</p>
                <h2 className="font-display text-2xl text-ink">{site.name}</h2>
                <p className="mt-1 text-sm text-muted">{site.fire}</p>
              </div>
            </Link>
          ) : null}
          <label className="block text-sm font-medium text-ink">
            How you are going
            <select
              value={trip.style}
              onChange={(event) => updateTrip(trip.id, { style: event.target.value as TripStyle })}
              className={fieldClasses("mt-1")}
            >
              {(Object.keys(STYLE_LABEL) as TripStyle[]).map((style) => (
                <option key={style} value={style}>
                  {STYLE_LABEL[style]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-ink">
            Field notes
            <textarea
              value={trip.notes}
              onChange={(event) => setNotes(trip.id, event.target.value)}
              rows={6}
              placeholder="Weather, water, the thing you wish you had brought."
              className="mt-1 w-full rounded-xl bg-cream p-3 text-ink shadow-card outline-none"
            />
          </label>
          {confirming ? (
            <div className="rounded-2xl bg-cream p-4 shadow-card">
              <p className="text-sm text-ink">Remove this trip? The list goes with it.</p>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="ember"
                  onClick={() => {
                    removeTrip(trip.id);
                    void navigate({ to: "/trips" });
                  }}
                >
                  Remove
                </Button>
                <Button variant="ghost" onClick={() => setConfirming(false)}>
                  Keep
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="inline-flex min-h-11 items-center text-sm font-medium text-muted hover:text-ink"
            >
              Remove this trip
            </button>
          )}
        </aside>
      </div>
    </div>
  );
}
