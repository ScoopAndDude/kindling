import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import "leaflet/dist/leaflet.css";
import { KIND_LABEL, type Place, type PlaceFee } from "@/data/landmarks";
import type { PublicCamp } from "@/lib/public-camps";

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

function paintCamps(
  leaflet: Leaflet,
  map: LeafletMap,
  layer: LayerGroup,
  camps: PublicCamp[],
  selectedId: string | null,
  onSelect: (id: string) => void,
  canvas: ReturnType<Leaflet["canvas"]>,
) {
  layer.clearLayers();
  if (camps.length === 0) return;
  const bounds = map.getBounds().pad(0.2);
  const zoom = map.getZoom();
  const visible = camps.filter((camp) => bounds.contains([camp.lat, camp.lon]));
  const step = zoom < 5 ? 1.4 : zoom < 8 ? 0.45 : 0;

  if (step === 0) {
    for (const camp of visible.slice(0, 2500)) {
      const on = camp.id === selectedId;
      const marker = leaflet.circleMarker([camp.lat, camp.lon], {
        renderer: canvas,
        radius: on ? 7 : 4,
        weight: on ? 2 : 1,
        color: on ? "#c45a2a" : "#f3efe4",
        fillColor: fillFor(camp.fee),
        fillOpacity: 0.92,
      });
      marker.bindPopup(
        `<strong>${escapeHtml(camp.name)}</strong><br/><span>Public camp${camp.area ? ` · ${escapeHtml(camp.area)}` : ""}</span>`,
      );
      marker.on("click", () => onSelect(camp.id));
      marker.addTo(layer);
      if (on) marker.openPopup();
    }
    return;
  }

  const cells = new Map<string, { lat: number; lon: number; n: number; camp: PublicCamp }>();
  for (const camp of visible) {
    const key = `${Math.round(camp.lat / step)}:${Math.round(camp.lon / step)}`;
    const cell = cells.get(key);
    if (!cell) cells.set(key, { lat: camp.lat, lon: camp.lon, n: 1, camp });
    else {
      cell.n += 1;
      cell.lat += camp.lat;
      cell.lon += camp.lon;
    }
  }
  for (const cell of cells.values()) {
    const lat = cell.lat / cell.n;
    const lon = cell.lon / cell.n;
    if (cell.n === 1) {
      const camp = cell.camp;
      const marker = leaflet.circleMarker([camp.lat, camp.lon], {
        renderer: canvas,
        radius: 4,
        weight: 1,
        color: "#f3efe4",
        fillColor: fillFor(camp.fee),
        fillOpacity: 0.92,
      });
      marker.on("click", () => onSelect(camp.id));
      marker.addTo(layer);
      continue;
    }
    const marker = leaflet.circleMarker([lat, lon], {
      renderer: canvas,
      radius: Math.min(16, 6 + Math.log2(cell.n) * 2),
      weight: 1,
      color: "#f3efe4",
      fillColor: "#2c4a34",
      fillOpacity: 0.85,
    });
    marker.bindTooltip(`${cell.n} public camps`, { direction: "top" });
    marker.on("click", () => {
      map.setView([lat, lon], Math.min(zoom + 2, 9));
    });
    marker.addTo(layer);
  }
}

export function CampMap({
  places,
  camps,
  lat,
  lon,
  zoom,
  selectedId,
  onSelect,
}: {
  places: Place[];
  camps: PublicCamp[];
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
  const campsRef = useRef(camps);
  const selectedRef = useRef(selectedId);
  const leafletRef = useRef<Leaflet | null>(null);
  const canvasRef = useRef<ReturnType<Leaflet["canvas"]> | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  campsRef.current = camps;
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
      leafletRef.current = leaflet;
      canvasRef.current = leaflet.canvas({ padding: 0.5 });
      const redraw = () => {
        if (!dotsRef.current || !map || !canvasRef.current) return;
        paintCamps(
          leaflet,
          map,
          dotsRef.current,
          campsRef.current,
          selectedRef.current,
          (id) => onSelectRef.current(id),
          canvasRef.current,
        );
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
    if (!ready || !mapRef.current || !dotsRef.current || !leafletRef.current || !canvasRef.current) return;
    paintCamps(
      leafletRef.current,
      mapRef.current,
      dotsRef.current,
      camps,
      selectedId,
      (id) => onSelectRef.current(id),
      canvasRef.current,
    );
  }, [ready, camps, selectedId]);

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
          `<strong>${escapeHtml(place.name)}</strong><br/><span>${escapeHtml(KIND_LABEL[place.kind])}${place.area ? ` · ${escapeHtml(place.area)}` : ""}</span>`,
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
