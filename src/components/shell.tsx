import { useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Backpack, CloudRain, Flame, House, Map, Package, Trees } from "lucide-react";
import { InstallApp } from "@/components/install-app";
import { useCamp } from "@/lib/store";

const NAV = [
  { to: "/", label: "Home", icon: House, exact: true },
  { to: "/map", label: "Map", icon: Map, exact: true },
  { to: "/radar", label: "Radar", icon: CloudRain, exact: true },
  { to: "/sites", label: "Sites", icon: Trees, exact: false },
  { to: "/trips", label: "Trips", icon: Backpack, exact: false },
  { to: "/kitchen", label: "Kitchen", icon: Flame, exact: false },
  { to: "/kit", label: "Kit", icon: Package, exact: true },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    void useCamp.persist.rehydrate();
  }, []);

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
          <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-ink">
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
          </div>
        </div>
      </header>
      <main id="content" className="mx-auto w-full max-w-5xl px-4 pt-6 pb-28 md:px-6 md:pt-10 md:pb-16">
        {children}
      </main>
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
