import { createFileRoute } from "@tanstack/react-router";

/*
 * The real front page is the static public/index.html, which the host serves
 * for "/" before the app ever runs. This route only shows if the app itself is
 * asked for "/", so it points both ways with plain links (full page loads).
 */
export const Route = createFileRoute("/")({
  component: HomeFallback,
});

function HomeFallback() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="font-display text-3xl text-ink">Scoop &amp; Dude</p>
      <p className="mt-2 text-muted">Pick where you want to go.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <a href="/" className="inline-flex min-h-11 items-center rounded-full bg-pine px-5 text-sm font-medium text-cream">
          Home page
        </a>
        <a href="/map" className="inline-flex min-h-11 items-center rounded-full bg-cream px-5 text-sm font-medium text-ink shadow-card">
          Camp map
        </a>
      </div>
    </div>
  );
}
