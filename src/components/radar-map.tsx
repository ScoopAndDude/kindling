import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";

const FRAMES = ["-m50m", "-m45m", "-m40m", "-m35m", "-m30m", "-m25m", "-m20m", "-m15m", "-m10m", "-m05m", ""];
const RAIN = "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913{frame}/{z}/{x}/{y}.png";
const VEL = "https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/ridge::{site}-N0S-0/{z}/{x}/{y}.png";

function leafletOf(mod: typeof import("leaflet")) {
  return "tileLayer" in mod ? mod : (mod as unknown as { default: typeof import("leaflet") }).default;
}

function bucket() {
  return Math.floor(Date.now() / 300000);
}

export function RadarMap({
  lat,
  lon,
  mode,
  site,
}: {
  lat: number;
  lon: number;
  mode: "rain" | "velocity";
  site: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const rainRef = useRef<TileLayer[]>([]);
  const velRef = useRef<TileLayer | null>(null);
  const frameRef = useRef(FRAMES.length - 1);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stamp, setStamp] = useState("Now");

  useEffect(() => {
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setPlaying(true);
  }, []);

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let map: LeafletMap | null = null;
    let cancelled = false;
    void import("leaflet").then((mod) => {
      if (cancelled) return;
      const leaflet = leafletOf(mod);
      map = leaflet.map(node).setView([lat, lon], 8);
      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        })
        .addTo(map);
      mapRef.current = map;
      map.invalidateSize();
      setReady(true);
    });
    return () => {
      cancelled = true;
      rainRef.current = [];
      velRef.current = null;
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
    // Mount once. Later moves use flyTo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    mapRef.current?.flyTo([lat, lon], 8, { duration: 0.6 });
  }, [ready, lat, lon]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const map = mapRef.current;
    let cancelled = false;
    void import("leaflet").then((mod) => {
      if (cancelled || !mapRef.current) return;
      const leaflet = leafletOf(mod);
      for (const layer of rainRef.current) layer.remove();
      velRef.current?.remove();
      rainRef.current = [];
      velRef.current = null;
      const version = bucket();
      if (mode === "velocity") {
        const layer = leaflet
          .tileLayer(`${VEL.replace("{site}", site)}?v=${version}`, {
            opacity: 0.8,
            maxNativeZoom: 10,
            maxZoom: 18,
            attribution: 'Velocity: NOAA / <a href="https://mesonet.agron.iastate.edu/">IEM</a>',
          })
          .addTo(map);
        velRef.current = layer;
        setStamp("Latest scan");
        return;
      }
      rainRef.current = FRAMES.map((frame, index) => {
        const layer = leaflet
          .tileLayer(`${RAIN.replace("{frame}", frame)}?v=${version}`, {
            opacity: index === FRAMES.length - 1 ? 0.75 : 0,
            maxNativeZoom: 10,
            maxZoom: 18,
            attribution:
              index === FRAMES.length - 1
                ? 'Radar: NOAA / <a href="https://mesonet.agron.iastate.edu/">IEM</a>'
                : "",
          })
          .addTo(map);
        return layer;
      });
      frameRef.current = FRAMES.length - 1;
      setStamp("Now");
    });
    return () => {
      cancelled = true;
    };
  }, [ready, mode, site]);

  useEffect(() => {
    if (!ready || !playing || mode !== "rain") return;
    const id = window.setInterval(() => {
      const layers = rainRef.current;
      if (layers.length === 0) return;
      const next = (frameRef.current + 1) % layers.length;
      layers.forEach((layer, index) => layer.setOpacity(index === next ? 0.75 : 0));
      frameRef.current = next;
      const ago = (layers.length - 1 - next) * 5;
      setStamp(ago === 0 ? "Now" : `${ago} min ago`);
    }, 700);
    return () => window.clearInterval(id);
  }, [ready, playing, mode]);

  return (
    <div className="map-stage relative overflow-hidden rounded-3xl shadow-card">
      <div ref={host} className="h-full w-full" />
      <div className="absolute bottom-3 left-3 z-[500] flex items-center gap-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm font-medium text-cream"
          onClick={() => setPlaying((value) => !value)}
          disabled={mode === "velocity"}
        >
          {mode === "velocity" ? "Still" : playing ? "Pause" : "Play"}
        </button>
        <span className="inline-flex min-h-11 items-center rounded-full bg-cream px-4 text-sm font-medium text-ink shadow-card">
          {stamp}
        </span>
      </div>
    </div>
  );
}
