import type { Comparison } from "./types";

export const COMPARISONS: Comparison[] = [
  // ── Easy ──────────────────────────────────────────────────────────────────
  {
    id: 1,
    prompt: "How many times longer is a Blue Whale than a Human?",
    metric: "Length",
    itemA: { name: "Human",      emoji: "🧍" },
    itemB: { name: "Blue Whale", emoji: "🐋" },
    ratio: 14.5,
    maxGuess: 50,
    difficulty: "easy",
    fact: "A blue whale is ~29 m long vs an average human's 1.7 m — about 17× longer. It's the largest animal that has ever existed.",
  },
  {
    id: 2,
    prompt: "How many times taller is the Eiffel Tower than a London double-decker bus?",
    metric: "Height",
    itemA: { name: "Double-decker bus", emoji: "🚌" },
    itemB: { name: "Eiffel Tower",      emoji: "🗼" },
    ratio: 94,
    maxGuess: 300,
    difficulty: "easy",
    fact: "The Eiffel Tower stands 330 m tall. A London bus is ~4.4 m — making the tower 75× taller. Impressive for 1889!",
  },
  {
    id: 3,
    prompt: "How many times heavier is an African Elephant than a Labrador?",
    metric: "Mass",
    itemA: { name: "Labrador", emoji: "🐕" },
    itemB: { name: "African Elephant", emoji: "🐘" },
    ratio: 187,
    maxGuess: 500,
    difficulty: "easy",
    fact: "An African elephant weighs ~6,000 kg; a Labrador ~32 kg. That's 187× heavier — enough to fill a small swimming pool.",
  },
  {
    id: 4,
    prompt: "How many times wider is a human hair than a red blood cell?",
    metric: "Diameter",
    itemA: { name: "Red blood cell", emoji: "🔴" },
    itemB: { name: "Human hair",     emoji: "🧵" },
    ratio: 10,
    maxGuess: 50,
    difficulty: "easy",
    fact: "A human hair is ~70 µm across; a red blood cell is ~7 µm — so your hair is about 10× wider. Both invisible to the naked eye.",
  },
  {
    id: 5,
    prompt: "How many times taller is Mount Everest than the Burj Khalifa?",
    metric: "Height",
    itemA: { name: "Burj Khalifa",  emoji: "🏢" },
    itemB: { name: "Mount Everest", emoji: "⛰️" },
    ratio: 10.7,
    maxGuess: 40,
    difficulty: "easy",
    fact: "Everest: 8,849 m. Burj Khalifa: 828 m. The mountain is 10.7× taller — and has no air conditioning.",
  },

  // ── Medium ─────────────────────────────────────────────────────────────────
  {
    id: 6,
    prompt: "How many times larger is Earth's diameter than the Moon's?",
    metric: "Diameter",
    itemA: { name: "Moon",  emoji: "🌕" },
    itemB: { name: "Earth", emoji: "🌍" },
    ratio: 3.67,
    maxGuess: 20,
    difficulty: "medium",
    fact: "Earth's diameter is 12,742 km vs the Moon's 3,475 km — just 3.7× larger. Most people overestimate this hugely.",
  },
  {
    id: 7,
    prompt: "How many times farther is the Moon than the International Space Station?",
    metric: "Distance from Earth",
    itemA: { name: "ISS",  emoji: "🛸" },
    itemB: { name: "Moon", emoji: "🌕" },
    ratio: 1090,
    maxGuess: 5000,
    difficulty: "medium",
    fact: "The ISS orbits at ~400 km. The Moon is ~384,400 km away — over 1,000× further. The ISS is practically in your backyard.",
  },
  {
    id: 8,
    prompt: "How many times heavier is a Boeing 747 than a Formula 1 car?",
    metric: "Mass",
    itemA: { name: "Formula 1 car", emoji: "🏎️" },
    itemB: { name: "Boeing 747",    emoji: "✈️" },
    ratio: 434,
    maxGuess: 1000,
    difficulty: "medium",
    fact: "A loaded 747 weighs ~412,000 kg; an F1 car just 798 kg. You'd need 516 F1 cars to match one jumbo jet.",
  },
  {
    id: 9,
    prompt: "How many times taller is Mount Everest than a cruising airplane?",
    metric: "Altitude",
    itemA: { name: "Cruising airplane", emoji: "✈️" },
    itemB: { name: "Mount Everest",     emoji: "⛰️" },
    ratio: 0.88,  // actually Everest is lower — let's flip
    // Flip: airplane cruises at ~10,700m, Everest is 8,849m
    // So airplane altitude > Everest. Airplane is the larger.
    // Let me redo: "How much higher does a cruising plane fly than Everest's peak?"
    // ratio = 10700/8849 = 1.21
    maxGuess: 10,
    difficulty: "medium",
    fact: "Planes cruise at ~10,700 m, Everest is 8,849 m. Planes fly just 1.2× higher — but in a pressurised cabin with snacks.",
  },
  {
    id: 10,
    prompt: "How many times longer is the Amazon River than the River Thames?",
    metric: "Length",
    itemA: { name: "River Thames", emoji: "🏞️" },
    itemB: { name: "Amazon River", emoji: "🌊" },
    ratio: 20.5,
    maxGuess: 80,
    difficulty: "medium",
    fact: "The Amazon is 6,992 km long; the Thames just 346 km — the Amazon is ~20× longer and carries 20% of all fresh water discharged into Earth's oceans.",
  },
  {
    id: 11,
    prompt: "How many times heavier is the Great Wall of China than the Empire State Building?",
    metric: "Mass",
    itemA: { name: "Empire State Building", emoji: "🏙️" },
    itemB: { name: "Great Wall of China",   emoji: "🏯" },
    ratio: 374,
    maxGuess: 2000,
    difficulty: "medium",
    fact: "The Great Wall weighs ~374 billion kg; the Empire State Building ~365 million kg. The Wall is ~1,000× heavier.",
  },
  {
    id: 12,
    prompt: "How many times wider is Jupiter than Earth?",
    metric: "Diameter",
    itemA: { name: "Earth",   emoji: "🌍" },
    itemB: { name: "Jupiter", emoji: "🪐" },
    ratio: 11.2,
    maxGuess: 50,
    difficulty: "medium",
    fact: "Jupiter's diameter is 142,984 km vs Earth's 12,742 km — 11× wider. You could fit 1,300 Earths inside Jupiter by volume.",
  },

  // ── Hard / Surprising ──────────────────────────────────────────────────────
  {
    id: 13,
    prompt: "How many times wider is the Sun than Earth?",
    metric: "Diameter",
    itemA: { name: "Earth", emoji: "🌍" },
    itemB: { name: "Sun",   emoji: "☀️" },
    ratio: 109,
    maxGuess: 500,
    difficulty: "hard",
    fact: "The Sun's diameter is 1,392,700 km vs Earth's 12,742 km — 109× wider. Yet the Sun is a completely average star.",
  },
  {
    id: 14,
    prompt: "How many times larger is UY Scuti (the largest known star) than our Sun?",
    metric: "Diameter",
    itemA: { name: "Sun",      emoji: "☀️" },
    itemB: { name: "UY Scuti", emoji: "🌟" },
    ratio: 1700,
    maxGuess: 5000,
    difficulty: "hard",
    fact: "UY Scuti's radius is ~1,700× the Sun's. If placed at the Sun's centre, it would engulf Jupiter's orbit entirely.",
  },
  {
    id: 15,
    prompt: "How many times farther is Neptune than the Moon from Earth?",
    metric: "Distance from Earth",
    itemA: { name: "Moon",    emoji: "🌕" },
    itemB: { name: "Neptune", emoji: "🔵" },
    ratio: 11600,
    maxGuess: 50000,
    difficulty: "hard",
    fact: "Neptune averages 4.4 billion km away; the Moon is 384,400 km. Neptune is ~11,600× further — Voyager 2 took 12 years to reach it.",
  },
  {
    id: 16,
    prompt: "How many times wider is a human hair than a DNA strand?",
    metric: "Width",
    itemA: { name: "DNA strand",  emoji: "🧬" },
    itemB: { name: "Human hair",  emoji: "🧵" },
    ratio: 29000,
    maxGuess: 100000,
    difficulty: "hard",
    fact: "A DNA double helix is ~2.5 nanometres wide; human hair ~70 µm. Hair is nearly 30,000× wider — yet both are invisible without magnification.",
  },
  {
    id: 17,
    prompt: "How many times longer is the observable universe than the Milky Way?",
    metric: "Diameter",
    itemA: { name: "Milky Way",          emoji: "🌌" },
    itemB: { name: "Observable Universe", emoji: "🪐" },
    ratio: 930,
    maxGuess: 5000,
    difficulty: "hard",
    fact: "The Milky Way is ~100,000 light-years across; the observable universe is ~93 billion — about 930,000× wider. We are very, very small.",
  },
  {
    id: 18,
    prompt: "How many times heavier is a neutron star than the Sun?",
    metric: "Mass",
    itemA: { name: "Sun",          emoji: "☀️" },
    itemB: { name: "Neutron Star", emoji: "💫" },
    ratio: 2,
    maxGuess: 20,
    difficulty: "hard",
    fact: "A typical neutron star is 1–2 solar masses — but compressed into a sphere just 20 km wide. A teaspoon would weigh a billion tonnes.",
  },
  {
    id: 19,
    prompt: "How many times longer is a blue whale than an ant?",
    metric: "Length",
    itemA: { name: "Ant",        emoji: "🐜" },
    itemB: { name: "Blue Whale", emoji: "🐋" },
    ratio: 14500,
    maxGuess: 50000,
    difficulty: "hard",
    fact: "A carpenter ant is ~2 mm; a blue whale is ~29 m — 14,500× longer. Both are alive on the same planet right now.",
  },
  {
    id: 20,
    prompt: "How many times taller is the tallest tsunami wave ever recorded than Big Ben?",
    metric: "Height",
    itemA: { name: "Big Ben",               emoji: "🕐" },
    itemB: { name: "Lituya Bay Mega-Tsunami", emoji: "🌊" },
    ratio: 6.9,
    maxGuess: 30,
    difficulty: "hard",
    fact: "The Lituya Bay 1958 megatsunami reached 524 m — nearly 7× taller than Big Ben (96 m). It stripped trees off the mountainside.",
  },
];

// Fix the plane/Everest comparison (id 9) — flip items so ratio > 1
// Patch inline:
COMPARISONS[8] = {
  ...COMPARISONS[8],
  prompt: "How much higher does a cruising airplane fly than the peak of Mount Everest?",
  itemA: { name: "Mount Everest",     emoji: "⛰️" },
  itemB: { name: "Cruising airplane", emoji: "✈️" },
  ratio: 1.21,
  maxGuess: 10,
  fact: "Planes cruise at ~10,700 m, Everest peaks at 8,849 m — planes fly just 1.2× higher, but in a pressurised cabin with snacks.",
};

export function pickRounds(count = 5, seed?: number): typeof COMPARISONS {
  // Deterministic shuffle via seed (for daily mode)
  const rng = seed !== undefined
    ? (() => { let s = seed; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })()
    : Math.random;

  const arr = [...COMPARISONS];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
}

export function dateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}