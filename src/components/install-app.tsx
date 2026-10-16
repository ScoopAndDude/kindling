import { useEffect, useState } from "react";
import { buttonClass } from "@/components/ui";

type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos() {
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as { standalone?: boolean }).standalone))
  );
}

export function InstallApp() {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const onInstalled = () => {
      setInstalled(true);
      setHelp(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (import.meta.env.PROD && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const links = [...document.querySelectorAll('link[rel="manifest"]')];
    const ours = links.find((link) => link.getAttribute("href") === "/manifest.webmanifest");
    if (ours) {
      for (const link of links) {
        if (link !== ours) link.remove();
      }
      document.head.insertBefore(ours, document.head.firstChild);
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  async function install() {
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setPrompt(null);
      if (choice.outcome === "accepted") setInstalled(true);
      return;
    }
    if (isIos()) {
      window.location.assign("/?install=1&platform=ios");
      return;
    }
    setHelp((open) => !open);
  }

  return (
    <div className="relative">
      <button type="button" className={buttonClass("ember", "px-4")} onClick={() => void install()}>
        Install
      </button>
      {help ? (
        <div className="fixed top-16 right-4 z-50 w-72 rounded-2xl bg-cream p-4 text-sm text-ink shadow-card md:right-6">
          <p className="font-medium">Add Kindling to this device</p>
          <p className="mt-2 text-muted">
            On a computer, open the browser menu and choose Install Kindling. On a phone, use the
            browser menu, or Share, then Add to Home Screen.
          </p>
          <a href="/?install=1&platform=ios" className="mt-3 inline-flex min-h-11 items-center font-medium text-pine">
            iPhone steps
          </a>
        </div>
      ) : null}
    </div>
  );
}
