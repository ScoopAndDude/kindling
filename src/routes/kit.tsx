import { createFileRoute } from "@tanstack/react-router";
import { GEAR } from "@/data/catalog";
import { formatOz } from "@/lib/format";
import { cn } from "@/lib/cn";
import { useCamp } from "@/lib/store";
import { PageIntro } from "@/components/ui";

export const Route = createFileRoute("/kit")({
  component: KitPage,
});

function KitPage() {
  const owned = useCamp((state) => state.ownedGear);
  const toggle = useCamp((state) => state.toggleGear);
  const categories = [...new Set(GEAR.map((item) => item.category))];
  const total = GEAR.filter((item) => owned.includes(item.id)).reduce((sum, item) => sum + item.oz, 0);

  return (
    <div>
      <PageIntro kicker="The shelf" title={formatOz(total)}>
        Weight of what you already own. Chairs and the skillet stay home when the miles get serious.
      </PageIntro>
      <div className="space-y-8">
        {categories.map((category) => (
          <section key={category}>
            <h2 className="font-display text-2xl text-ink">{category}</h2>
            <ul className="mt-3 divide-y divide-ink/10">
              {GEAR.filter((item) => item.category === category).map((item) => {
                const has = owned.includes(item.id);
                return (
                  <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-ink">{item.name}</p>
                      <p className="text-sm text-muted">
                        {item.note} · <span className="tabular-nums">{formatOz(item.oz)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-pressed={has}
                      onClick={() => toggle(item.id)}
                      className={cn(
                        "inline-flex min-h-11 min-w-28 items-center justify-center rounded-full px-4 text-sm font-medium",
                        has ? "bg-pine text-cream" : "bg-cream text-ink shadow-card",
                      )}
                    >
                      {has ? "In the kit" : "Need this"}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
