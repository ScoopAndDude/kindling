import type { Access, Terrain, TripStyle } from "@/lib/types";

export type Site = {
  id: string;
  name: string;
  region: string;
  terrain: Terrain;
  access: Access;
  elevation: string;
  season: string;
  difficulty: "Easy" | "Moderate" | "Rugged";
  fire: string;
  water: string;
  blurb: string;
  story: string;
  know: string[];
  amenities: string[];
  image: string;
  imageAlt: string;
};

export type CheckItem = {
  id: string;
  group: string;
  label: string;
  styles: TripStyle[];
};

export type GearItem = {
  id: string;
  name: string;
  category: string;
  oz: number;
  note: string;
};

export type Recipe = {
  id: string;
  name: string;
  minutes: number;
  serves: string;
  fire: string;
  blurb: string;
  image: string;
  imageAlt: string;
  ingredients: string[];
  steps: string[];
};

export const TERRAINS: { id: Terrain | "all"; label: string }[] = [
  { id: "all", label: "Anywhere" },
  { id: "forest", label: "Forest" },
  { id: "alpine", label: "Alpine" },
  { id: "lakeside", label: "Lakeside" },
  { id: "desert", label: "Desert" },
  { id: "coast", label: "Coast" },
];

export const APPROACHES: { id: Access | "all"; label: string }[] = [
  { id: "all", label: "Any approach" },
  { id: "hike", label: "On foot" },
  { id: "drive", label: "By car" },
  { id: "paddle", label: "By paddle" },
];

export const GROUPS = ["Shelter", "Sleep", "Kitchen", "Clothing", "Safety", "Camp"] as const;

export const SITES: Site[] = [
  {
    id: "cedar-basin",
    name: "Cedar Basin",
    region: "Olympic Peninsula, Washington",
    terrain: "forest",
    access: "hike",
    elevation: "1,240 ft",
    season: "June to October",
    difficulty: "Moderate",
    fire: "Rings in established sites",
    water: "Creek a few minutes below camp",
    blurb: "Old cedar, a creek you can hear from the bag, and nights that stay damp.",
    story:
      "The spur leaves a gravel road and drops into timber that has never been loud. Sword ferns slick the tread, and by the time the basin opens you can smell wet bark. Two or three pads sit under the biggest trunks, far enough apart that you only share the creek.",
    know: [
      "The last mile is rooty. Keep a dry pair of socks in the bag.",
      "Rain is the default. A groundsheet matters more than a fancy tent.",
      "Food stays in a canister. Hangs fail in these trees.",
    ],
    amenities: ["Vault toilet", "Established pads", "Creek water"],
    image: "/photos/cedar-basin.jpg",
    imageAlt: "Lantern-lit tent among mossy cedar trunks at dusk",
  },
  {
    id: "mirror-tarn",
    name: "Mirror Tarn",
    region: "Sawtooth Mountains, Idaho",
    terrain: "alpine",
    access: "hike",
    elevation: "8,640 ft",
    season: "Mid-July to September",
    difficulty: "Rugged",
    fire: "Stove only",
    water: "The tarn — filter it",
    blurb: "A granite bowl, a still lake, and a sunrise that hits the tent first.",
    story:
      "The trail climbs through whitebark until the basin suddenly has a floor of stone and snowmelt. Mirror Tarn sits in the middle, cold and exact. Sleep on the rock shelves above the outlet, well back from the fragile shore.",
    know: [
      "Afternoon storms build fast. Be off the pass by two.",
      "Nights drop below freezing even in August.",
      "No fires, and no camping on the meadow fringe.",
    ],
    amenities: ["No toilet", "Stove only", "Alpine water"],
    image: "/photos/mirror-tarn.jpg",
    imageAlt: "Small tent on a granite shelf above a still alpine lake",
  },
  {
    id: "red-rim",
    name: "Red Rim Wash",
    region: "Canyon country, Utah",
    terrain: "desert",
    access: "drive",
    elevation: "4,900 ft",
    season: "March to May, September to November",
    difficulty: "Easy",
    fire: "Stove only when the country is dry",
    water: "Bring every liter",
    blurb: "Red walls, a sandy wash, and stars that start before dinner.",
    story:
      "A short dirt road ends under a rim of sandstone. The site is a level bench with a stone ring that should usually stay cold, and a view that goes quiet once the highway noise dies. Summer is a bad idea. Spring and fall are the whole point.",
    know: [
      "There is no water and almost no shade after ten.",
      "Flash floods use this wash. Do not sleep in the channel.",
      "The dark crust is alive. Walk the sand, not the soil.",
    ],
    amenities: ["Stone ring", "No water", "Drive-up"],
    image: "/photos/red-rim.jpg",
    imageAlt: "Low tent in a red sandstone canyon at golden hour",
  },
  {
    id: "saltgrass",
    name: "Saltgrass Bluff",
    region: "Lost Coast, California",
    terrain: "coast",
    access: "hike",
    elevation: "180 ft",
    season: "May to October",
    difficulty: "Moderate",
    fire: "Only below the high-tide line, when allowed",
    water: "Seasonal creek — treat it",
    blurb: "Fog, saltgrass, and a bluff that keeps the ocean in its place.",
    story:
      "The trail crosses a logged bench and then the weather changes. Wind, grass, and a gray-green Pacific. Camp sits back from the edge on packed ground. Driftwood is for sitting, not for a bonfire. Read the tide table before you walk the beach miles.",
    know: [
      "Tides can close the beach route. Carry the chart.",
      "Wind is the real weather. Stake everything.",
      "Ravens are professionals. Store food like you mean it.",
    ],
    amenities: ["No toilet", "Creek in season", "Bluff camp"],
    image: "/photos/saltgrass.jpg",
    imageAlt: "Tent in coastal fog on a grassy bluff above the ocean",
  },
  {
    id: "stillwater",
    name: "Stillwater Bend",
    region: "Boundary Waters, Minnesota",
    terrain: "lakeside",
    access: "paddle",
    elevation: "1,380 ft",
    season: "May to September",
    difficulty: "Easy",
    fire: "Grates where they are provided",
    water: "The lake — filter it",
    blurb: "A canoe pull-out, white pines, and a lake that goes still at dusk.",
    story:
      "Stillwater Bend is the second portage in, which is far enough that motors are a rumor. The landing is a slab of granite, the pads are obvious, and the swimming is the kind you remember in February. Loons handle the night shift.",
    know: [
      "A permit is part of the plan. Don't improvise an entry point.",
      "Hang the food pack. This country still has black bears.",
      "Afternoon wind can stall a loaded canoe. Start early.",
    ],
    amenities: ["Fire grate", "Box latrine", "Canoe landing"],
    image: "/photos/stillwater.jpg",
    imageAlt: "Canoe pulled onto a pine shore beside a misty lake",
  },
  {
    id: "high-larch",
    name: "High Larch",
    region: "Colorado high country",
    terrain: "alpine",
    access: "hike",
    elevation: "10,200 ft",
    season: "Late July to September",
    difficulty: "Rugged",
    fire: "Stove only",
    water: "Snowmelt stream",
    blurb: "Golden larch, a thin wind, and a meadow you do not walk across.",
    story:
      "High Larch earns the name for about three weeks a year, when the trees turn and the trail is finally dry. Camp in the trees at the meadow edge, never in the grass. The sun leaves early behind the ridge, so cook while you still have it.",
    know: [
      "Altitude is the real difficulty. Sleep lower the night before if you can.",
      "Lightning uses this basin. A noon summit is already late.",
      "The meadow is closed to feet. Stay on the pad and the trail.",
    ],
    amenities: ["No toilet", "Stove only", "Stream water"],
    image: "/photos/high-larch.jpg",
    imageAlt: "Tent in a golden larch meadow with snowy peaks behind",
  },
  {
    id: "pinyon",
    name: "Pinyon Hollow",
    region: "Red rock country, Arizona",
    terrain: "desert",
    access: "drive",
    elevation: "4,400 ft",
    season: "October to April",
    difficulty: "Easy",
    fire: "Existing rings only, when not banned",
    water: "Bring it",
    blurb: "Pinyon shade, warm rock, and a sky that goes violet before dinner.",
    story:
      "A maintained dirt road finds a pocket of pinyon and juniper with two obvious sites and a cold ring between them. It is car camping without the campground voice. Days are for nearby trailheads. Nights belong to the chairs.",
    know: [
      "Fire bans are common, and they are not suggestions.",
      "Nights get sharper than the afternoon implies. Bring the quilt.",
      "There is no facility. Pack out every scrap of paper.",
    ],
    amenities: ["Fire ring", "No water", "Two sites"],
    image: "/photos/pinyon.jpg",
    imageAlt: "Camp chairs among pinyon pines and red rock at dusk",
  },
  {
    id: "fogline",
    name: "Fogline Meadow",
    region: "Mount Hood forest, Oregon",
    terrain: "forest",
    access: "drive",
    elevation: "3,800 ft",
    season: "June to October",
    difficulty: "Easy",
    fire: "Rings when they are not banned",
    water: "Piped spigot in season",
    blurb: "A meadow edge, fir in the fog, and a shake-down close to the car.",
    story:
      "Fogline is the site you use when you want to test the kit without testing your patience. The road is slow, the pad is level, and morning fog makes the meadow look like a lake. Good coffee country.",
    know: [
      "Weekends fill. Arriving Friday is the trick.",
      "Mosquitoes own July. A head net is lighter than regret.",
      "The spigot is seasonal. Carry a spare gallon anyway.",
    ],
    amenities: ["Fire ring", "Spigot in season", "Level pads"],
    image: "/photos/fogline.jpg",
    imageAlt: "Tent in a foggy fir forest at the edge of a meadow",
  },
];

export const CHECKLIST: CheckItem[] = [
  { id: "tent", group: "Shelter", label: "Tent or tarp", styles: ["backpack", "car", "basecamp"] },
  { id: "stakes", group: "Shelter", label: "Stakes and guylines", styles: ["backpack", "car", "basecamp"] },
  { id: "footprint", group: "Shelter", label: "Groundsheet", styles: ["backpack", "car", "basecamp"] },
  { id: "rainfly", group: "Shelter", label: "Extra rain fly", styles: ["backpack"] },
  { id: "bag", group: "Sleep", label: "Sleeping bag or quilt", styles: ["backpack", "car", "basecamp"] },
  { id: "pad", group: "Sleep", label: "Sleeping pad", styles: ["backpack", "car", "basecamp"] },
  { id: "pillow", group: "Sleep", label: "Pillow", styles: ["car", "basecamp"] },
  { id: "blanket", group: "Sleep", label: "Camp blanket", styles: ["basecamp"] },
  { id: "stove", group: "Kitchen", label: "Stove and fuel", styles: ["backpack", "car", "basecamp"] },
  { id: "pot", group: "Kitchen", label: "Pot with a lid", styles: ["backpack", "car", "basecamp"] },
  { id: "utensil", group: "Kitchen", label: "Utensils", styles: ["backpack", "car", "basecamp"] },
  { id: "spark", group: "Kitchen", label: "Lighter and matches", styles: ["backpack", "car", "basecamp"] },
  { id: "cooler", group: "Kitchen", label: "Cooler and ice", styles: ["car", "basecamp"] },
  { id: "skillet", group: "Kitchen", label: "Cast-iron skillet", styles: ["car", "basecamp"] },
  { id: "dutch", group: "Kitchen", label: "Dutch oven", styles: ["basecamp"] },
  { id: "coffee", group: "Kitchen", label: "Coffee kit", styles: ["backpack", "car", "basecamp"] },
  { id: "meals", group: "Kitchen", label: "Meals for every night", styles: ["backpack", "car", "basecamp"] },
  { id: "shell", group: "Clothing", label: "Rain shell", styles: ["backpack", "car", "basecamp"] },
  { id: "warm", group: "Clothing", label: "Warm layer", styles: ["backpack", "car", "basecamp"] },
  { id: "socks", group: "Clothing", label: "Spare socks", styles: ["backpack", "car", "basecamp"] },
  { id: "hat", group: "Clothing", label: "Sun hat", styles: ["backpack", "car", "basecamp"] },
  { id: "gloves", group: "Clothing", label: "Light gloves", styles: ["backpack"] },
  { id: "filter", group: "Safety", label: "Water filter or tablets", styles: ["backpack", "car", "basecamp"] },
  { id: "bottles", group: "Safety", label: "Bottles or bladder", styles: ["backpack", "car", "basecamp"] },
  { id: "aid", group: "Safety", label: "First-aid kit", styles: ["backpack", "car", "basecamp"] },
  { id: "lamp", group: "Safety", label: "Headlamp and spare cells", styles: ["backpack", "car", "basecamp"] },
  { id: "nav", group: "Safety", label: "Map and a way home", styles: ["backpack"] },
  { id: "bear", group: "Safety", label: "Food canister or hang kit", styles: ["backpack"] },
  { id: "whistle", group: "Safety", label: "Whistle", styles: ["backpack"] },
  { id: "chair", group: "Camp", label: "Camp chair", styles: ["car", "basecamp"] },
  { id: "lantern", group: "Camp", label: "Lantern", styles: ["car", "basecamp"] },
  { id: "table", group: "Camp", label: "Camp table", styles: ["basecamp"] },
  { id: "hammock", group: "Camp", label: "Hammock", styles: ["basecamp"] },
  { id: "trowel", group: "Camp", label: "Trowel and waste bags", styles: ["backpack", "car", "basecamp"] },
  { id: "repair", group: "Camp", label: "Repair kit", styles: ["backpack", "car", "basecamp"] },
];

export const GEAR: GearItem[] = [
  { id: "tent", name: "Two-person tent", category: "Shelter", oz: 42, note: "With the fly, without the footprint" },
  { id: "tarp", name: "Silnylon tarp", category: "Shelter", oz: 11, note: "For wet kitchens and vestibules" },
  { id: "stakes", name: "Stake kit", category: "Shelter", oz: 6, note: "Six stakes and a spare guyline" },
  { id: "quilt", name: "20° quilt", category: "Sleep", oz: 26, note: "Enough for alpine nights" },
  { id: "pad", name: "Sleeping pad", category: "Sleep", oz: 15, note: "The warmth is mostly this" },
  { id: "pillow", name: "Stuff pillow", category: "Sleep", oz: 3, note: "A spare shirt works too" },
  { id: "stove", name: "Canister stove", category: "Kitchen", oz: 3, note: "Plus a small canister, weighed separate" },
  { id: "pot", name: "900 ml pot", category: "Kitchen", oz: 5, note: "Lid doubles as a plate" },
  { id: "skillet", name: "Cast-iron skillet", category: "Kitchen", oz: 56, note: "Leave it when you are walking" },
  { id: "mug", name: "Enamel mug", category: "Kitchen", oz: 4, note: "Coffee and nothing else" },
  { id: "dutch", name: "Dutch oven", category: "Kitchen", oz: 96, note: "Cobbler duty. Not a backpack item." },
  { id: "shell", name: "Rain shell", category: "Clothing", oz: 10, note: "Worn, not packed, if the sky is already wrong" },
  { id: "puffy", name: "Insulated jacket", category: "Clothing", oz: 12, note: "Camp layer once you stop moving" },
  { id: "filter", name: "Water filter", category: "Safety", oz: 3, note: "Tablets as the backup" },
  { id: "lamp", name: "Headlamp", category: "Safety", oz: 3, note: "With a spare cell in the kit" },
  { id: "aid", name: "First-aid kit", category: "Safety", oz: 7, note: "Blister care earns its place" },
  { id: "canister", name: "Bear canister", category: "Safety", oz: 41, note: "Required in a lot of western forests" },
  { id: "chair", name: "Camp chair", category: "Camp", oz: 32, note: "The luxury that never goes in the pack" },
  { id: "lantern", name: "Lantern", category: "Camp", oz: 14, note: "Kinder than a headlamp at the table" },
  { id: "trowel", name: "Trowel", category: "Camp", oz: 2, note: "And the bags you hope not to need" },
];

export const SHELF_SKIP = ["dutch", "canister"];

export const RECIPES: Recipe[] = [
  {
    id: "trout",
    name: "Skillet trout",
    minutes: 20,
    serves: "2",
    fire: "Coals and a cast-iron skillet",
    blurb: "Skin-side first, lemon at the end, eaten straight from the pan.",
    image: "/photos/trout.jpg",
    imageAlt: "Trout searing in a cast-iron skillet over camp coals",
    ingredients: [
      "2 small trout, cleaned and patted dry",
      "Salt",
      "1 lemon",
      "A few sprigs of dill or thyme",
      "Oil or butter",
    ],
    steps: [
      "Rake a bed of coals and set the skillet on them until a drop of water skitters.",
      "Film the pan with oil. Salt the fish, including the cavity.",
      "Lay the trout in skin-side down. Leave it alone for about four minutes.",
      "Flip once, give it three more minutes, and tuck in the herbs and lemon.",
      "Rest a minute off the coals. The skin should crackle, not steam.",
    ],
  },
  {
    id: "cobbler",
    name: "Peach cobbler",
    minutes: 50,
    serves: "4",
    fire: "Dutch oven, coals above and below",
    blurb: "A lid full of coals, a biscuit top, and the smell that ends an argument.",
    image: "/photos/cobbler.jpg",
    imageAlt: "Peach cobbler in a dutch oven with the lid lifted",
    ingredients: [
      "4 ripe peaches, sliced, or one large can, drained",
      "3 tablespoons sugar, divided",
      "1 cup flour",
      "1 teaspoon baking powder",
      "1/4 teaspoon salt",
      "3/4 cup milk",
      "3 tablespoons butter",
    ],
    steps: [
      "Butter the inside of a 10-inch dutch oven, including the lid.",
      "Toss the peaches with 1 tablespoon of sugar and spread them in the pot.",
      "Stir flour, remaining sugar, baking powder, salt, and milk into a thick batter. Dollop it over the fruit. Dot with butter.",
      "Set the oven on a ring of coals and pile more coals on the lid — more on top than underneath.",
      "Bake about 35 minutes. The top is done when a twig comes out clean and the edges bubble.",
    ],
  },
  {
    id: "chili",
    name: "Coal chili",
    minutes: 45,
    serves: "4",
    fire: "A pot that can sit in the coals",
    blurb: "One pot, a long simmer, and enough for a cold second night.",
    image: "/photos/chili.jpg",
    imageAlt: "Enamel pot of chili sitting on glowing campfire coals",
    ingredients: [
      "1 onion, chopped",
      "2 cloves garlic",
      "1 pound ground beef, or two cans of beans for a meatless pot",
      "2 tablespoons chili powder",
      "1 teaspoon cumin",
      "1 can crushed tomatoes",
      "1 cup water or broth",
      "Salt",
    ],
    steps: [
      "Soften the onion in a little oil, then the garlic. Don't rush it.",
      "Brown the beef if you are using it, or rinse and add the beans.",
      "Stir in the spices until they smell toasted, then the tomatoes and water.",
      "Nestle the pot in coals, not in flame. Simmer until it thickens, about half an hour, stirring so the bottom does not catch.",
      "Salt at the end. It always needs more than you think.",
    ],
  },
  {
    id: "coffee",
    name: "Settle coffee",
    minutes: 8,
    serves: "2",
    fire: "Water just off the boil",
    blurb: "Cowboy coffee, done so the grounds stay in the pot.",
    image: "/photos/coffee.jpg",
    imageAlt: "Steaming enamel mug of black coffee on a stump",
    ingredients: [
      "6 tablespoons coarse coffee",
      "3 cups water",
      "A splash of cold water to settle the grounds",
    ],
    steps: [
      "Bring the water to a boil, then pull it off until the bubbles stop.",
      "Stir in the coffee and let it bloom for thirty seconds.",
      "Cover and steep four minutes. Do not boil it again.",
      "Drip a spoon of cold water over the surface so the grounds sink.",
      "Pour slowly. The last inch stays in the pot, grounds and all.",
    ],
  },
];

export const PRINCIPLES = [
  {
    title: "Plan the small things",
    body: "A known site, a real list, and a group that fits the pad.",
  },
  {
    title: "Walk the durable ground",
    body: "Rock, sand, or an existing pad. The meadow is not a bedroom.",
  },
  {
    title: "Pack out the boring trash",
    body: "Orange peel, twist ties, and the scrap you almost left in the ring.",
  },
];

export function siteById(id: string) {
  return SITES.find((site) => site.id === id);
}

export function recipeById(id: string) {
  return RECIPES.find((recipe) => recipe.id === id);
}
