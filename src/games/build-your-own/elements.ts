import type { Element } from "./types";

// ─── Helper ───────────────────────────────────────────────────────────────────
// Order-independent key so A+B and B+A always resolve the same way.
export function combineKey(a: string, b: string): string {
  return [a, b].sort().join("+");
}

// ─── Elements (55 total) ──────────────────────────────────────────────────────

export const ELEMENTS: Record<string, Element> = {
  // ── Tier 0 — Primordial ──────────────────────────────────────────────────
  fire:        { id: "fire",        name: "Fire",        emoji: "🔥", tier: 0 },
  water:       { id: "water",       name: "Water",       emoji: "💧", tier: 0 },
  earth:       { id: "earth",       name: "Earth",       emoji: "🌍", tier: 0 },
  air:         { id: "air",         name: "Air",         emoji: "🌬️", tier: 0 },

  // ── Tier 1 — Basic Reactions ─────────────────────────────────────────────
  steam:       { id: "steam",       name: "Steam",       emoji: "🌫️", tier: 1 },
  lava:        { id: "lava",        name: "Lava",        emoji: "🔴", tier: 1 },
  mud:         { id: "mud",         name: "Mud",         emoji: "🟤", tier: 1 },
  smoke:       { id: "smoke",       name: "Smoke",       emoji: "💨", tier: 1 },
  cloud:       { id: "cloud",       name: "Cloud",       emoji: "☁️", tier: 1 },
  dust:        { id: "dust",        name: "Dust",        emoji: "🌪️", tier: 1 },
  stone:       { id: "stone",       name: "Stone",       emoji: "🪨", tier: 1 },
  metal:       { id: "metal",       name: "Metal",       emoji: "⚙️", tier: 1 },
  rain:        { id: "rain",        name: "Rain",        emoji: "🌧️", tier: 1 },
  sand:        { id: "sand",        name: "Sand",        emoji: "🏜️", tier: 1 },
  storm:       { id: "storm",       name: "Storm",       emoji: "⛈️", tier: 1 },
  lightning:   { id: "lightning",   name: "Lightning",   emoji: "⚡", tier: 1 },

  // ── Tier 2 — Nature ──────────────────────────────────────────────────────
  grass:       { id: "grass",       name: "Grass",       emoji: "🌾", tier: 2 },
  plant:       { id: "plant",       name: "Plant",       emoji: "🌱", tier: 2 },
  tree:        { id: "tree",        name: "Tree",        emoji: "🌳", tier: 2 },
  forest:      { id: "forest",      name: "Forest",      emoji: "🌲", tier: 2 },
  mountain:    { id: "mountain",    name: "Mountain",    emoji: "⛰️", tier: 2 },
  river:       { id: "river",       name: "River",       emoji: "🏞️", tier: 2 },
  ocean:       { id: "ocean",       name: "Ocean",       emoji: "🌊", tier: 2 },
  swamp:       { id: "swamp",       name: "Swamp",       emoji: "🐊", tier: 2 },
  sky:         { id: "sky",         name: "Sky",         emoji: "🌌", tier: 2 },
  sun:         { id: "sun",         name: "Sun",         emoji: "☀️", tier: 2 },
  volcano:     { id: "volcano",     name: "Volcano",     emoji: "🗻", tier: 2 },
  flower:      { id: "flower",      name: "Flower",      emoji: "🌸", tier: 2 },
  glass:       { id: "glass",       name: "Glass",       emoji: "🔮", tier: 2 },

  // ── Tier 3 — Life ────────────────────────────────────────────────────────
  life:        { id: "life",        name: "Life",        emoji: "🧬", tier: 3 },
  fish:        { id: "fish",        name: "Fish",        emoji: "🐟", tier: 3 },
  bird:        { id: "bird",        name: "Bird",        emoji: "🐦", tier: 3 },
  insect:      { id: "insect",      name: "Insect",      emoji: "🐛", tier: 3 },
  animal:      { id: "animal",      name: "Animal",      emoji: "🐾", tier: 3 },
  human:       { id: "human",       name: "Human",       emoji: "👤", tier: 3 },
  honey:       { id: "honey",       name: "Honey",       emoji: "🍯", tier: 3 },

  // ── Tier 4 — Civilisation ─────────────────────────────────────────────────
  tool:        { id: "tool",        name: "Tool",        emoji: "🔨", tier: 4 },
  house:       { id: "house",       name: "House",       emoji: "🏠", tier: 4 },
  village:     { id: "village",     name: "Village",     emoji: "🏘️", tier: 4 },
  farm:        { id: "farm",        name: "Farm",        emoji: "🚜", tier: 4 },
  ship:        { id: "ship",        name: "Ship",        emoji: "🚢", tier: 4 },
  music:       { id: "music",       name: "Music",       emoji: "🎵", tier: 4 },
  clock:       { id: "clock",       name: "Clock",       emoji: "🕐", tier: 4 },
  time:        { id: "time",        name: "Time",        emoji: "⏳", tier: 4 },

  // ── Tier 5 — Technology ───────────────────────────────────────────────────
  technology:  { id: "technology",  name: "Technology",  emoji: "💡", tier: 5 },
  electricity: { id: "electricity", name: "Electricity", emoji: "🔌", tier: 5 },
  computer:    { id: "computer",    name: "Computer",    emoji: "💻", tier: 5 },
  internet:    { id: "internet",    name: "Internet",    emoji: "🌐", tier: 5 },
  airplane:    { id: "airplane",    name: "Airplane",    emoji: "✈️", tier: 5 },
  rocket:      { id: "rocket",      name: "Rocket",      emoji: "🚀", tier: 5 },
  robot:       { id: "robot",       name: "Robot",       emoji: "🤖", tier: 5 },

  // ── Tier 6 — Cosmic / Abstract ────────────────────────────────────────────
  space:       { id: "space",       name: "Space",       emoji: "🌠", tier: 6 },
  star:        { id: "star",        name: "Star",        emoji: "⭐", tier: 6 },
  satellite:   { id: "satellite",   name: "Satellite",   emoji: "📡", tier: 6 },
  wisdom:      { id: "wisdom",      name: "Wisdom",      emoji: "📚", tier: 6 },
  universe:    { id: "universe",    name: "Universe",    emoji: "🪐", tier: 6 },
};

export const TOTAL = Object.keys(ELEMENTS).length; // 55

// ─── Combinations ─────────────────────────────────────────────────────────────
// Maps combineKey(a, b) → result element id.
// Multiple paths to the same result are intentional (makes discovery feel open).

const c = combineKey; // shorthand

export const COMBINATIONS: Record<string, string> = {
  // ── Tier 0 → 1 ─────────────────────────────────────────────────────────
  [c("fire",  "water")]: "steam",
  [c("fire",  "earth")]: "lava",
  [c("fire",  "air")]:   "smoke",
  [c("water", "earth")]: "mud",
  [c("water", "air")]:   "cloud",
  [c("earth", "air")]:   "dust",

  // ── Tier 1 reactions ─────────────────────────────────────────────────────
  [c("lava",  "water")]:   "stone",
  [c("stone", "fire")]:    "metal",
  [c("cloud", "water")]:   "rain",
  [c("cloud", "cloud")]:   "storm",
  [c("storm", "metal")]:   "lightning",   // lightning rod concept
  [c("stone", "air")]:     "sand",        // erosion
  [c("stone", "stone")]:   "mountain",
  [c("sand",  "fire")]:    "glass",       // glassblowing
  [c("steam", "air")]:     "cloud",       // alternate cloud path

  // ── Tier 1 → 2 ───────────────────────────────────────────────────────────
  [c("mud",      "rain")]:     "grass",
  [c("earth",    "rain")]:     "grass",       // alternate
  [c("grass",    "water")]:    "plant",
  [c("mud",      "rain")]:     "plant",       // mud + rain = plants (overrides grass; last write wins — both are fine)
  [c("plant",    "earth")]:    "tree",
  [c("plant",    "water")]:    "tree",        // alternate
  [c("tree",     "tree")]:     "forest",
  [c("stone",    "earth")]:    "mountain",    // alternate
  [c("mountain", "water")]:    "river",
  [c("river",    "river")]:    "ocean",
  [c("river",    "water")]:    "ocean",       // alternate
  [c("mud",      "tree")]:     "swamp",
  [c("cloud",    "air")]:      "sky",
  [c("fire",     "sky")]:      "sun",
  [c("mountain", "lava")]:     "volcano",
  [c("plant",    "sun")]:      "flower",
  [c("grass",    "sun")]:      "flower",      // alternate

  // ── Tier 2 → 3 — Life! ───────────────────────────────────────────────────
  [c("mud",      "lightning")]: "life",       // primordial soup (classic)
  [c("swamp",    "lightning")]: "life",       // alternate primordial
  [c("ocean",    "life")]:      "fish",
  [c("water",    "life")]:      "fish",       // alternate
  [c("life",     "air")]:       "bird",
  [c("fish",     "air")]:       "bird",       // fish → amphibian → bird (fun)
  [c("plant",    "life")]:      "insect",
  [c("life",     "earth")]:     "animal",
  [c("animal",   "fire")]:      "human",      // Prometheus moment 🔥
  [c("insect",   "flower")]:    "honey",      // bee logic

  // ── Tier 3 → 4 — Civilisation ─────────────────────────────────────────────
  [c("human",   "stone")]:    "tool",
  [c("human",   "tree")]:     "house",
  [c("house",   "house")]:    "village",
  [c("village", "plant")]:    "farm",
  [c("human",   "grass")]:    "farm",         // alternate
  [c("human",   "ocean")]:    "ship",
  [c("human",   "river")]:    "ship",         // alternate
  [c("human",   "air")]:      "music",        // humans blowing air → music
  [c("sun",     "metal")]:    "clock",        // sundial
  [c("clock",   "human")]:    "time",         // humans conceived time

  // ── Tier 4 → 5 — Technology ───────────────────────────────────────────────
  [c("human",      "metal")]:       "technology",
  [c("tool",       "metal")]:       "technology",   // alternate
  [c("metal",      "lightning")]:   "electricity",
  [c("technology", "electricity")]: "computer",
  [c("computer",   "ocean")]:       "internet",     // undersea cables
  [c("computer",   "computer")]:    "internet",     // alternate: networks
  [c("bird",       "technology")]:  "airplane",     // Wright Brothers vibe
  [c("technology", "air")]:         "airplane",     // alternate
  [c("airplane",   "fire")]:        "rocket",
  [c("technology", "fire")]:        "rocket",       // alternate
  [c("computer",   "human")]:       "robot",
  [c("technology", "human")]:       "robot",        // alternate

  // ── Tier 5 → 6 — Cosmic ───────────────────────────────────────────────────
  [c("rocket",    "sky")]:    "space",
  [c("sky",       "sky")]:    "space",        // beyond the sky is space
  [c("fire",      "space")]:  "star",         // nuclear fusion = star
  [c("sun",       "space")]:  "star",         // the sun IS a star
  [c("rocket",    "space")]:  "satellite",
  [c("technology","space")]:  "satellite",    // alternate
  [c("time",      "human")]:  "wisdom",       // time + humans = wisdom
  [c("space",     "star")]:   "universe",     // the final combination ✨
  [c("star",      "star")]:   "universe",     // alternate
};