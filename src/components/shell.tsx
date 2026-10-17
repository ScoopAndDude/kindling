import { useEffect, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Backpack, CloudRain, Flame, Map, Package, Trees } from "lucide-react";
import { InstallApp } from "@/components/install-app";
import { useCamp } from "@/lib/store";

const NAV = [
  { to: "/map", label: "Map", icon: Map, exact: true },
  { to: "/radar", label: "Radar", icon: CloudRain, exact: true },
  { to: "/sites", label: "Sites", icon: Trees, exact: false },
  { to: "/trips", label: "Trips", icon: Backpack, exact: false },
  { to: "/kitchen", label: "Kitchen", icon: Flame, exact: false },
  { to: "/kit", label: "Kit", icon: Package, exact: true },
] as const;

const SCOOP = [
  { href: "/rebecca-schlief/", title: "Remembering Mom" },
  { href: "/van-life/", title: "Van life" },
  { href: "/dinner/", title: "The Dinner Scoop" },
  { href: "/camp-map/", title: "Old camp map" },
  { href: "/projects/", title: "Projects" },
  { href: "/faith/", title: "Daily Faith" },
  { href: "/markets/", title: "Markets" },
  { href: "/amazon/", title: "Amazon watch" },
  { href: "/world-art/", title: "World art" },
  { href: "/ai-survival-guide/", title: "AI survival guide" },
  { href: "/printables/", title: "Printables" },
  { href: "/friends/", title: "Friends" },
  { href: "/space-lab/", title: "Space lab" },
  { href: "/english/", title: "English" },
  { href: "https://laporteweathernow.com", title: "La Porte Weather Now" },
  { href: "https://www.etsy.com/shop/ScoopAndDude", title: "Etsy shop" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useCamp.persist.rehydrate();
  }, []);
  const wide = useRouterState({ select: (state) => state.location.pathname === "/map" });
  const home = wide;

  return (
    <div className="min-h-screen">
      <div className="range-sky" aria-hidden="true" />
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-cream focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 md:px-6">
          <Link to="/map" className="inline-flex min-h-11 items-center gap-2 text-ink">
            <span className="grid size-8 place-items-center rounded-full bg-pine text-cream" aria-hidden="true">
              <Flame className="size-4" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-2xl tracking-tight">Kindling</span>
              <span className="text-[11px] font-medium text-muted">Scoop & Dude</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <InstallApp />
            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.exact }}
                activeProps={{
                  className:
                    "inline-flex min-h-11 items-center rounded-full bg-pine/10 px-2 text-sm font-medium text-pine",
                }}
                inactiveProps={{
                  className:
                    "inline-flex min-h-11 items-center rounded-full px-2 text-sm font-medium text-muted hover:text-ink",
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
            <a
              href="/rebecca-schlief/"
              className="hidden min-h-11 items-center rounded-full px-2 text-sm font-medium text-muted hover:text-ink md:inline-flex"
            >
              Remembering Mom
            </a>
          </div>
        </div>
      </header>
      <main
        id="content"
        className={
          wide
            ? "mx-auto w-full max-w-[90rem] px-3 pt-4 pb-8 md:px-5"
            : "mx-auto w-full max-w-5xl px-4 pt-6 pb-10 md:px-6 md:pt-10"
        }
      >
        {children}
      </main>
      {home ? <MemorialCard /> : null}
      <footer className="border-t border-ink/10 bg-paper/80">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 pb-28 sm:grid-cols-2 md:px-6 md:pb-10">
          <nav aria-label="Kindling">
            <p className="text-sm font-medium text-pine">Kindling</p>
            <ul className="mt-3 flex flex-col">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="inline-flex min-h-11 items-center text-sm text-ink">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="Scoop and Dude">
            <p className="text-sm font-medium text-pine">Scoop & Dude</p>
            <ul className="mt-3 columns-2">
              {SCOOP.map((item) => (
                <li key={item.href}>
                  <a href={item.href} className="inline-flex min-h-11 items-center text-sm text-ink">
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </footer>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-paper/95 backdrop-blur-md md:hidden"
        aria-label="Primary"
      >
        <ul className="mx-auto flex max-w-lg items-stretch px-1 pb-2">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to} className="flex-1">
                <Link
                  to={item.to}
                  activeOptions={{ exact: item.exact }}
                  activeProps={{
                    className:
                      "flex min-h-14 w-full flex-col items-center justify-center gap-1 text-xs font-medium text-pine",
                  }}
                  inactiveProps={{
                    className:
                      "flex min-h-14 w-full flex-col items-center justify-center gap-1 text-xs font-medium text-muted",
                  }}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function MemorialCard() {
  return (
    <section aria-labelledby="memorial-card-h" className="mx-auto w-full max-w-5xl px-4 pb-10 md:px-6">
      <a
        href="/rebecca-schlief/"
        className="flex items-center gap-4 rounded-2xl bg-cream p-4 shadow-card outline outline-1 -outline-offset-1 outline-ink/10 transition-colors hover:bg-paper sm:gap-5 sm:p-5"
      >
        <img
          src="/assets/img/becky-portrait-206.jpg"
          alt="Becky Schlief smiling, wearing glasses"
          width={206}
          height={206}
          loading="lazy"
          decoding="async"
          className="size-20 flex-none rounded-full object-cover ring-4 ring-ember/40 sm:size-24"
        />
        <span className="flex flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-pine">In loving memory</span>
          <span id="memorial-card-h" className="font-display text-2xl leading-tight text-ink">
            My mom, Becky Schlief
          </span>
          <span className="text-sm text-muted">Remembering her, and still looking for answers.</span>
          <span className="mt-1 text-sm font-medium text-pine">Read her story &rarr;</span>
        </span>
      </a>
    </section>
  );
}
