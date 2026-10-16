import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CHECKLIST, GEAR, SHELF_SKIP } from "@/data/catalog";
import { nextWeekdayISO, shiftISO, todayISO } from "@/lib/format";
import type { Trip, TripStyle } from "@/lib/types";

type NewTrip = {
  name: string;
  siteId: string;
  start: string;
  end: string;
  party: number;
  style: TripStyle;
  notes?: string;
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
  updateTrip: (id: string, patch: Partial<Omit<Trip, "id">>) => void;
  removeTrip: (id: string) => void;
  toggleCheck: (tripId: string, itemId: string) => void;
  addExtra: (tripId: string, label: string) => void;
  toggleExtra: (tripId: string, extraId: string) => void;
  removeExtra: (tripId: string, extraId: string) => void;
  setNotes: (tripId: string, notes: string) => void;
};

function seedTrips(): Trip[] {
  const start = nextWeekdayISO(5);
  const later = shiftISO(todayISO(), 21);
  const pastStart = shiftISO(todayISO(), -18);
  const carIds = CHECKLIST.filter((item) => item.styles.includes("car")).map((item) => item.id);
  const pastChecks = Object.fromEntries(carIds.map((id) => [id, true]));

  return [
    {
      id: "trip-cedar",
      name: "Cedar Basin weekend",
      siteId: "cedar-basin",
      start,
      end: shiftISO(start, 2),
      party: 2,
      style: "backpack",
      notes:
        "Water is a short walk down the spur. Canister required — the firs hold a lot of bear traffic in fall.",
      checks: {
        tent: true,
        stakes: true,
        bag: true,
        pad: true,
        stove: true,
        pot: true,
        spark: true,
        shell: true,
        filter: true,
        lamp: true,
      },
      extras: [],
    },
    {
      id: "trip-stillwater",
      name: "Stillwater with the cousins",
      siteId: "stillwater",
      start: later,
      end: shiftISO(later, 3),
      party: 4,
      style: "car",
      notes: "",
      checks: {},
      extras: [],
    },
    {
      id: "trip-fogline",
      name: "Fogline shake-down",
      siteId: "fogline",
      start: pastStart,
      end: shiftISO(pastStart, 2),
      party: 2,
      style: "car",
      notes: "Fog sat in the meadow until midmorning. The lantern earned its weight.",
      checks: pastChecks,
      extras: [],
    },
  ];
}

export const useCamp = create<CampState>()(
  persist(
    (set) => ({
      savedSites: ["mirror-tarn", "saltgrass"],
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
            },
            ...state.trips,
          ],
        }));
        return id;
      },
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
    { name: "kindling-camp-v1", skipHydration: true },
  ),
);
