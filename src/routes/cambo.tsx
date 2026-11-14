import { createFileRoute, redirect } from "@tanstack/react-router";

// scoopanddude.com/Cambo (Luna's roof and woodstove fundraiser, Nov. 14, 2026) is a static page
// in public/Cambo/. Static files only match with the exact capitals, so /cambo, /CAMBO and the
// like land here and get sent to /Cambo/. A Vercel redirect rule can't do this job: Vercel route
// patterns match without regard to case, so one caught /Cambo/ too and looped.
export const Route = createFileRoute("/cambo")({
  beforeLoad: () => {
    throw redirect({ href: "/Cambo/", reloadDocument: true });
  },
});
