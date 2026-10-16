import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { KIND_LABEL, type Place, type PlaceFee } from "@/data/landmarks";
import type { PublicCamp } from "@/lib/public-camps";
import type { RestStop } from "@/lib/rest-stops";
import type { ScenicSpot } from "@/lib/scenic";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function leafletOf(mod: typeof import("leaflet")) {
  return "divIcon" in mod ? mod : (mod as unknown as { default: typeof import("leaflet") }).default;
}

type Leaflet = ReturnType<typeof leafletOf>;

function fillFor(fee: PlaceFee) {
  if (fee === "free") return "#2c4a34";
  if (fee === "paid") return "#1a2218";
  return "#6b6558";
}

type MapDot = { id: string; name: string; lat: number; lon: number; area: string; fee?: PlaceFee; kind?: string };

function directionsHref(lat: number, lon: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat.toFixed(5)},${lon.toFixed(5)}`;
}

function scenicFill(kind?: string) {
  if (kind === "waterfall") return "#1d6a8a";
  if (kind === "trail") return "#3f5c32";
  return "#6b4c7a";
}

function paintDots(
  leaflet: Leaflet,
  map: LeafletMap,
  layer: LayerGroup,
  dots: MapDot[],
  selectedId: string | null,
  onSelect: (id: string) => void,
  canvas: ReturnType<Leaflet["canvas"]>,
  tone: "camp" | "stop" | "scenic",
) {
  layer.clearLayers();
  if (dots.length === 0) return;
  const bounds = map.getBounds().pad(0.2);
  const zoom = map.getZoom();
  const visible = dots.filter((dot) => bounds.contains([dot.lat, dot.lon]));
  const step = zoom < 5 ? 1.4 : zoom < 8 ? 0.45 : 0;
  const fill = (dot: MapDot) =>
    tone === "stop" ? "#c45a2a" : tone === "scenic" ? scenicFill(dot.kind) : fillFor(dot.fee ?? "unknown");
  const noun = (dot: MapDot) =>
    tone === "stop" ? "Rest stop" : tone === "scenic" ? (dot.kind === "waterfall" ? "Waterfall" : dot.kind === "trail" ? "Trailhead" : "Viewpoint") : "Public camp";

  if (step === 0) {
    for (const dot of visible.slice(0, 2500)) {
      const on = dot.id === selectedId;
      const marker = leaflet.circleMarker([dot.lat, dot.lon], {
        renderer: canvas,
        radius: on ? 7 : tone === "stop" ? 5 : 4,
        weight: on ? 2 : 1,
        color: on ? "#c45a2a" : "#f3efe4",
        fillColor: fill(dot),
        fillOpacity: 0.92,
      });
      marker.bindPopup(
        `<strong>${escapeHtml(dot.name)}</strong><br/><span>${escapeHtml(noun(dot))}${dot.area ? ` · ${escapeHtml(dot.area)}` : ""}</span><br/><a href="${directionsHref(dot.lat, dot.lon)}" target="_blank" rel="noopener">Directions</a>`,
      );
      marker.on("click", () => onSelect(dot.id));
      marker.addTo(layer);
      if (on) marker.openPopup();
    }
    return;
  }

  const cells = new Map<string, { lat: number; lon: number; n: number; dot: MapDot }>();
  for (const dot of visible) {
    const key = `${Math.round(dot.lat / step)}:${Math.round(dot.lon / step)}`;
    const cell = cells.get(key);
    if (!cell) cells.set(key, { lat: dot.lat, lon: dot.lon, n: 1, dot });
    else {
      cell.n += 1;
      cell.lat += dot.lat;
      cell.lon += dot.lon;
    }
  }
  for (const cell of cells.values()) {
    const lat = cell.lat / cell.n;
    const lon = cell.lon / cell.n;
    if (cell.n === 1) {
      const dot = cell.dot;
      const marker = leaflet.circleMarker([dot.lat, dot.lon], {
        renderer: canvas,
        radius: tone === "stop" ? 5 : 4,
        weight: 1,
        color: "#f3efe4",
        fillColor: fill(dot),
        fillOpacity: 0.92,
      });
      marker.bindPopup(
        `<strong>${escapeHtml(dot.name)}</strong><br/><span>${escapeHtml(noun(dot))}${dot.area ? ` · ${escapeHtml(dot.area)}` : ""}</span><br/><a href="${directionsHref(dot.lat, dot.lon)}" target="_blank" rel="noopener">Directions</a>`,
      );
      marker.on("click", () => onSelect(dot.id));
      marker.addTo(layer);
      continue;
    }
    const marker = leaflet.circleMarker([lat, lon], {
      renderer: canvas,
      radius: Math.min(16, 6 + Math.log2(cell.n) * 2),
      weight: 1,
      color: "#f3efe4",
      fillColor: tone === "stop" ? "#c45a2a" : tone === "scenic" ? "#1d6a8a" : "#2c4a34",
      fillOpacity: 0.85,
    });
    marker.bindTooltip(`${cell.n} ${tone === "stop" ? "rest stops" : tone === "scenic" ? "scenic spots" : "public camps"}`, { direction: "top" });
    marker.on("click", () => {
      map.setView([lat, lon], Math.min(zoom + 2, 9));
    });
    marker.addTo(layer);
  }
}

export function CampMap({
  places,
  camps,
  stops,
  scenic,
  lat,
  lon,
  zoom,
  selectedId,
  onSelect,
}: {
  places: Place[];
  camps: PublicCamp[];
  stops: RestStop[];
  scenic: ScenicSpot[];
  lat: number;
  lon: number;
  zoom: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const dotsRef = useRef<LayerGroup | null>(null);
  const stopsRef = useRef<LayerGroup | null>(null);
  const scenicRef = useRef<LayerGroup | null>(null);
  const campsRef = useRef(camps);
  const stopsDataRef = useRef(stops);
  const scenicDataRef = useRef(scenic);
  const selectedRef = useRef(selectedId);
  const leafletRef = useRef<Leaflet | null>(null);
  const canvasRef = useRef<ReturnType<Leaflet["canvas"]> | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  campsRef.current = camps;
  stopsDataRef.current = stops;
  scenicDataRef.current = scenic;
  selectedRef.current = selectedId;
  onSelectRef.current = onSelect;

  useEffect(() => {
    const node = host.current;
    if (!node) return;
    let map: LeafletMap | null = null;
    let cancelled = false;
    void import("leaflet").then((mod) => {
      if (cancelled) return;
      const leaflet = leafletOf(mod);
      map = leaflet.map(node).setView([39.8, -98.6], 4);
      leaflet
        .tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        })
        .addTo(map);
      layerRef.current = leaflet.layerGroup().addTo(map);
      dotsRef.current = leaflet.layerGroup().addTo(map);
      stopsRef.current = leaflet.layerGroup().addTo(map);
      scenicRef.current = leaflet.layerGroup().addTo(map);
      leafletRef.current = leaflet;
      canvasRef.current = leaflet.canvas({ padding: 0.5 });
      const redraw = () => {
        if (!map || !canvasRef.current || !leafletRef.current) return;
        if (dotsRef.current) {
          paintDots(
            leafletRef.current,
            map,
            dotsRef.current,
            campsRef.current,
            selectedRef.current,
            (id) => onSelectRef.current(id),
            canvasRef.current,
            "camp",
          );
        }
        if (stopsRef.current) {
          paintDots(
            leafletRef.current,
            map,
            stopsRef.current,
            stopsDataRef.current,
            selectedRef.current,
            (id) => onSelectRef.current(id),
            canvasRef.current,
            "stop",
          );
        }
        if (scenicRef.current) {
          paintDots(
            leafletRef.current,
            map,
            scenicRef.current,
            scenicDataRef.current,
            selectedRef.current,
            (id) => onSelectRef.current(id),
            canvasRef.current,
            "scenic",
          );
        }
      };
      map.on("moveend", redraw);
      mapRef.current = map;
      redraw();
      setReady(true);
    });
    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      layerRef.current = null;
      dotsRef.current = null;
      stopsRef.current = null;
      scenicRef.current = null;
      leafletRef.current = null;
      canvasRef.current = null;
      setReady(false);
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    mapRef.current?.flyTo([lat, lon], zoom, { duration: 0.6 });
  }, [ready, lat, lon, zoom]);

  useEffect(() => {
    if (!ready || !mapRef.current || !leafletRef.current || !canvasRef.current) return;
    if (dotsRef.current) {
      paintDots(
        leafletRef.current,
        mapRef.current,
        dotsRef.current,
        camps,
        selectedId,
        (id) => onSelectRef.current(id),
        canvasRef.current,
        "camp",
      );
    }
    if (stopsRef.current) {
      paintDots(
        leafletRef.current,
        mapRef.current,
        stopsRef.current,
        stops,
        selectedId,
        (id) => onSelectRef.current(id),
        canvasRef.current,
        "stop",
      );
    }
    if (scenicRef.current) {
      paintDots(
        leafletRef.current,
        mapRef.current,
        scenicRef.current,
        scenic,
        selectedId,
        (id) => onSelectRef.current(id),
        canvasRef.current,
        "scenic",
      );
    }
  }, [ready, camps, stops, scenic, selectedId]);

  useEffect(() => {
    if (!ready || !layerRef.current) return;
    let cancelled = false;
    void import("leaflet").then((mod) => {
      if (cancelled || !layerRef.current) return;
      const leaflet = leafletOf(mod);
      layerRef.current.clearLayers();
      for (const place of places) {
        const on = place.id === selectedId;
        const icon = leaflet.divIcon({
          className: "pin-wrap",
          html: `<span class="map-pin map-pin-${place.kind}${on ? " map-pin-on" : ""}"></span>`,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
        const marker = leaflet.marker([place.lat, place.lon], { icon });
        marker.bindPopup(
          `<strong>${escapeHtml(place.name)}</strong><br/><span>${escapeHtml(KIND_LABEL[place.kind])}${place.area ? ` · ${escapeHtml(place.area)}` : ""}</span><br/><a href="${directionsHref(place.lat, place.lon)}" target="_blank" rel="noopener">Directions</a>`,
        );
        marker.on("click", () => onSelectRef.current(place.id));
        marker.addTo(layerRef.current);
        if (on) marker.openPopup();
      }
    });
    return () => {
      cancelled = true;
    };
  }, [ready, places, selectedId]);

  return <div ref={host} className="map-stage overflow-hidden rounded-3xl shadow-card" />;
}
