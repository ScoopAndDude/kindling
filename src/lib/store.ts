import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GEAR, SHELF_SKIP } from "@/data/catalog";
import type { Trip, TripStyle, Waypoint } from "@/lib/types";

type NewTrip = {
  name: string;
  siteId: string;
  start: string;
  end: string;
  party: number;
  style: TripStyle;
  notes?: string;
  lat?: number;
  lon?: number;
  overnight?: boolean;
  stops?: Waypoint[];
};

type CampState = {
  savedSites: string[];
  savedRecipes: string[];
  ownedGear: string[];
  trips: Trip[];
  toggleSite: (id: string) => void;
  toggleRecipe: (id: string) => void;
  toggleGear: (id: string) => void;
  addTrip: (trip: NewTrip) => string;
  addStop: (tripId: string, stop: Omit<Waypoint, "id">) => void;
  removeStop: (tripId: string, stopId: string) => void;
  updateTrip: (id: string, patch: Partial<Omit<Trip, "id">>) => void;
  removeTrip: (id: string) => void;
  toggleCheck: (tripId: string, itemId: string) => void;
  addExtra: (tripId: string, label: string) => void;
  toggleExtra: (tripId: string, extraId: string) => void;
  removeExtra: (tripId: string, extraId: string) => void;
  setNotes: (tripId: string, notes: string) => void;
};

function seedTrips(): Trip[] {
  return [];
}

const DEMO_TRIPS = new Set(["trip-cedar", "trip-stillwater", "trip-fogline"]);
const DEMO_SITES = new Set(["mirror-tarn", "saltgrass"]);

export const useCamp = create<CampState>()(
  persist(
    (set) => ({
      savedSites: [],
      savedRecipes: ["cobbler"],
      ownedGear: GEAR.map((item) => item.id).filter((id) => !SHELF_SKIP.includes(id)),
      trips: seedTrips(),
      toggleSite: (id) =>
        set((state) => ({
          savedSites: state.savedSites.includes(id)
            ? state.savedSites.filter((siteId) => siteId !== id)
            : [...state.savedSites, id],
        })),
      toggleRecipe: (id) =>
        set((state) => ({
          savedRecipes: state.savedRecipes.includes(id)
            ? state.savedRecipes.filter((recipeId) => recipeId !== id)
            : [...state.savedRecipes, id],
        })),
      toggleGear: (id) =>
        set((state) => ({
          ownedGear: state.ownedGear.includes(id)
            ? state.ownedGear.filter((gearId) => gearId !== id)
            : [...state.ownedGear, id],
        })),
      addTrip: (trip) => {
        const id = crypto.randomUUID();
        set((state) => ({
          trips: [
            {
              id,
              notes: trip.notes ?? "",
              checks: {},
              extras: [],
              name: trip.name,
              siteId: trip.siteId,
              start: trip.start,
              end: trip.end,
              party: trip.party,
              style: trip.style,
              lat: trip.lat,
              lon: trip.lon,
              overnight: trip.overnight,
              stops: trip.stops ?? [],
            },
            ...state.trips,
          ],
        }));
        return id;
      },
      addStop: (tripId, stop) =>
        set((state) => ({
          trips: state.trips.map((trip) => {
            if (trip.id !== tripId) return trip;
            const stops = trip.stops ?? [];
            const same = stops.some(
              (item) => item.name === stop.name && item.lat === stop.lat && item.lon === stop.lon,
            );
            if (same) return trip;
            return { ...trip, stops: [...stops, { ...stop, id: crypto.randomUUID() }] };
          }),
        })),
      removeStop: (tripId, stopId) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId ? { ...trip, stops: (trip.stops ?? []).filter((stop) => stop.id !== stopId) } : trip,
          ),
        })),
      updateTrip: (id, patch) =>
        set((state) => ({
          trips: state.trips.map((trip) => (trip.id === id ? { ...trip, ...patch } : trip)),
        })),
      removeTrip: (id) =>
        set((state) => ({
          trips: state.trips.filter((trip) => trip.id !== id),
        })),
      toggleCheck: (tripId, itemId) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? { ...trip, checks: { ...trip.checks, [itemId]: !trip.checks[itemId] } }
              : trip,
          ),
        })),
      addExtra: (tripId, label) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  extras: [...trip.extras, { id: crypto.randomUUID(), label, done: false }],
                }
              : trip,
          ),
        })),
      toggleExtra: (tripId, extraId) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? {
                  ...trip,
                  extras: trip.extras.map((extra) =>
                    extra.id === extraId ? { ...extra, done: !extra.done } : extra,
                  ),
                }
              : trip,
          ),
        })),
      removeExtra: (tripId, extraId) =>
        set((state) => ({
          trips: state.trips.map((trip) =>
            trip.id === tripId
              ? { ...trip, extras: trip.extras.filter((extra) => extra.id !== extraId) }
              : trip,
          ),
        })),
      setNotes: (tripId, notes) =>
        set((state) => ({
          trips: state.trips.map((trip) => (trip.id === tripId ? { ...trip, notes } : trip)),
        })),
    }),
    {
      name: "kindling-camp-v1",
      version: 2,
      skipHydration: true,
      migrate: (persisted) => {
        const state = persisted as { trips?: Trip[]; savedSites?: string[] };
        return {
          ...state,
          trips: (state.trips ?? []).filter((trip) => !DEMO_TRIPS.has(trip.id)),
          savedSites: (state.savedSites ?? []).filter((id) => !DEMO_SITES.has(id)),
        };
      },
    },
  ),
);
