import { Link, createFileRoute } from "@tanstack/react-router";
import { GEAR, PRINCIPLES, RECIPES, siteById } from "@/data/catalog";
import { formatOz, formatRange, nightCount, nightLabel, todayISO } from "@/lib/format";
import { packingProgress } from "@/lib/packing";
import { useCamp } from "@/lib/store";
import { buttonClass, Photo, Ring } from "@/components/ui";
import { SiteCard } from "@/components/site-card";

export const Route = createFileRoute("/")({
  component: Home,
});

const FEATURED = ["mirror-tarn", "saltgrass", "red-rim", "high-larch"];

const SCOOP = [
  { href: "/van-life/", title: "Van life", detail: "The crew, the rig, and a Great Dane." },
  { href: "/dinner/", title: "The Dinner Scoop", detail: "Tonight's dinner, the week, and the grocery list." },
  { href: "/camp-map/", title: "Your old camp map", detail: "The original Scoop & Dude map, still on this site." },
  { href: "/projects/", title: "Projects", detail: "Faith, markets, the Amazon, art, and the rest." },
  { href: "/faith/", title: "Daily Faith", detail: "A verse and a hymn." },
  { href: "/markets/", title: "Markets", detail: "Stocks, oil, crops, and jobs in plain words." },
  { href: "/amazon/", title: "Amazon watch", detail: "The rainforest, in numbers." },
  { href: "/world-art/", title: "World art", detail: "Cave paintings through the modern." },
  { href: "/ai-survival-guide/", title: "AI survival guide", detail: "Plain talk about living with AI." },
  { href: "/printables/", title: "Printables", detail: "Planners from the road." },
  { href: "/friends/", title: "Friends", detail: "Pages for people far away." },
  { href: "/space-lab/", title: "Space lab", detail: "The sky, from the road." },
  { href: "https://laporteweathernow.com", title: "La Porte Weather Now", detail: "The radar back home." },
  { href: "https://www.etsy.com/shop/ScoopAndDude", title: "Etsy shop", detail: "Printables you can take with you." },
];

function Home() {
  const trips = useCamp((state) => state.trips);
  const savedSites = useCamp((state) => state.savedSites);
  const ownedGear = useCamp((state) => state.ownedGear);
  const today = todayISO();
  const upcoming = trips
    .filter((trip) => trip.end >= today)
    .sort((a, b) => a.start.localeCompare(b.start));
  const next = upcoming[0];
  const site = next ? siteById(next.siteId) : undefined;
  const progress = next ? packingProgress(next) : undefined;
  const nights = upcoming.reduce((sum, trip) => sum + nightCount(trip.start, trip.end), 0);
  const kitOz = GEAR.filter((item) => ownedGear.includes(item.id)).reduce((sum, item) => sum + item.oz, 0);
  const featured = FEATURED.map((id) => siteById(id)).filter((item) => item !== undefined);

  return (
    <div className="space-y-12">
      {next && site && progress ? (
        <article className="overflow-hidden rounded-3xl bg-ink text-cream shadow-card">
          <div className="relative aspect-poster md:aspect-hero">
            <Photo src={site.image} alt={site.imageAlt} priority className="absolute inset-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/10" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 p-5 md:p-8">
              <p className="text-sm font-medium text-cream/80">Next out</p>
              <div>
                <h1 className="font-display text-4xl tracking-tight text-cream md:text-6xl">{next.name}</h1>
                <p className="mt-2 max-w-xl text-cream/85">
                  {site.name} · {formatRange(next.start, next.end)} · {nightLabel(next.start, next.end)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Ring ratio={progress.ratio} label={`${progress.done} of ${progress.total} packed`} />
                <Link to="/trips/$tripId" params={{ tripId: next.id }} className={buttonClass("cream")}>
                  Open the list
                </Link>
              </div>
            </div>
          </div>
        </article>
      ) : (
        <header className="max-w-2xl">
          <p className="text-sm font-medium text-pine">A field companion</p>
          <h1 className="mt-1 font-display text-4xl tracking-tight text-ink md:text-6xl">Where the next fire is.</h1>
          <p className="mt-3 text-muted">No nights on the calendar yet. Pick a site and pack for the weather.</p>
          <Link to="/sites" className={buttonClass("ember", "mt-5")}>
            Find a site
          </Link>
        </header>
      )}

      <section id="scoop">
        <div className="mb-4">
          <p className="text-sm font-medium text-pine">Scoop & Dude</p>
          <h2 className="mt-1 font-display text-3xl text-ink">The rest of the place</h2>
          <p className="mt-2 max-w-xl text-muted">
            The camp map is Kindling. The van, dinner, and the other projects are on this same site.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {SCOOP.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="rounded-2xl bg-cream px-4 py-4 shadow-card"
            >
              <h3 className="font-display text-2xl text-ink">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.detail}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat value={String(nights)} label={nights === 1 ? "Night planned" : "Nights planned"} />
        <Stat value={String(savedSites.length)} label={savedSites.length === 1 ? "Site saved" : "Sites saved"} />
        <Stat value={formatOz(kitOz)} label="On the shelf" />
      </section>

      <section className="rounded-3xl bg-pine px-5 py-6 text-cream md:px-8">
        <p className="text-sm font-medium text-cream/80">Camp map</p>
        <h2 className="mt-1 font-display text-3xl text-cream md:text-4xl">Town, then the pins around it.</h2>
        <p className="mt-2 max-w-xl text-cream/85">
          Camps, water, dumps, waterfalls, trails, and the scenic spots worth pulling over for.
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link to="/map" className={buttonClass("cream")}>
            Open the map
          </Link>
          <Link to="/radar" search={{}} className="inline-flex min-h-11 items-center text-sm font-medium text-cream underline underline-offset-4">
            Storm radar
          </Link>
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl text-ink">Worth the miles</h2>
          <Link to="/sites" className="inline-flex min-h-11 items-center text-sm font-medium text-pine">
            All sites
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {featured.map((item) => (
            <SiteCard key={item.id} site={item} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-display text-3xl text-ink">From the coals</h2>
          <Link to="/kitchen" className="inline-flex min-h-11 items-center text-sm font-medium text-pine">
            All recipes
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {RECIPES.slice(0, 2).map((recipe) => (
            <Link
              key={recipe.id}
              to="/kitchen/$recipeId"
              params={{ recipeId: recipe.id }}
              className="overflow-hidden rounded-2xl bg-cream shadow-card"
            >
              <div className="aspect-food overflow-hidden">
                <Photo src={recipe.image} alt={recipe.imageAlt} />
              </div>
              <div className="p-4">
                <h3 className="font-display text-2xl text-ink">{recipe.name}</h3>
                <p className="mt-1 text-sm text-muted">{recipe.blurb}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-6 border-t border-ink/10 pt-8 md:grid-cols-3">
        {PRINCIPLES.map((item) => (
          <div key={item.title}>
            <h2 className="font-display text-2xl text-ink">{item.title}</h2>
            <p className="mt-2 text-sm text-muted">{item.body}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-cream px-3 py-4 shadow-card md:px-5">
      <p className="font-display text-2xl text-ink tabular-nums md:text-3xl">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}
