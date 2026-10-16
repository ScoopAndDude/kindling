export type TripStyle = "backpack" | "car" | "basecamp";
export type Access = "hike" | "drive" | "paddle";
export type Terrain = "forest" | "alpine" | "lakeside" | "desert" | "coast";

export type ExtraItem = {
  id: string;
  label: string;
  done: boolean;
};

export type Trip = {
  id: string;
  name: string;
  siteId: string;
  start: string;
  end: string;
  party: number;
  style: TripStyle;
  notes: string;
  checks: Record<string, boolean>;
  extras: ExtraItem[];
};
