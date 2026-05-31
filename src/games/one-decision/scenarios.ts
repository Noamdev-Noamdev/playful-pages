import type { Scenario } from "./types";

// ─── Add new scenarios here — everything else picks them up automatically ─────

export const SCENARIOS: Scenario[] = [
  // ── Scenario 1: City Location ────────────────────────────────────────────
  {
    id: "city",
    question: "Where do you build your city?",
    subtitle: "One choice. Generations of consequences.",
    choices: [
      {
        id: "coast",
        label: "The Coast",
        tagline: "Rich trade, restless seas",
        events: [
          {
            id: "c1",
            progress: 10,
            title: "Port Established",
            description: "Ships arrive. Trade begins. The city breathes.",
            changes: { population: 8, economy: 10, environment: -3 },
          },
          {
            id: "c2",
            progress: 28,
            title: "Trade Routes Open",
            description: "Merchants flood in. Wealth multiplies rapidly.",
            changes: { population: 12, economy: 15, environment: -4 },
          },
          {
            id: "c3",
            progress: 48,
            title: "City Booms",
            description: "Population doubles. Buildings reach for the sky.",
            changes: { population: 18, economy: 12, environment: -8 },
          },
          {
            id: "c4",
            progress: 68,
            title: "Hurricane Season",
            description: "A brutal storm. Infrastructure badly damaged.",
            changes: { population: -6, economy: -12, environment: -8 },
          },
          {
            id: "c5",
            progress: 88,
            title: "Coastal Flooding",
            description: "Rising seas claim the lower districts permanently.",
            changes: { population: -10, economy: -15, environment: -12 },
          },
        ],
        endStats: { population: 70, economy: 62, environment: 28 },
        finalOutcome:
          "Your coastal city grew rich and fast — but the sea always collects its debt. Climate risk now looms over everything built.",
      },
      {
        id: "mountains",
        label: "The Mountains",
        tagline: "Slow growth, deep roots",
        events: [
          {
            id: "m1",
            progress: 12,
            title: "Settlement Founded",
            description: "A hardy community takes root in the sheltered valley.",
            changes: { population: 5, economy: 4, environment: -2 },
          },
          {
            id: "m2",
            progress: 30,
            title: "Mining Begins",
            description: "Rich ore veins discovered. The economy surges.",
            changes: { population: 8, economy: 14, environment: -7 },
          },
          {
            id: "m3",
            progress: 50,
            title: "Hydroelectric Power",
            description: "Rivers tamed. Clean energy powers a new wave of growth.",
            changes: { population: 10, economy: 12, environment: 8 },
          },
          {
            id: "m4",
            progress: 70,
            title: "Tourism Boom",
            description: "Hikers and skiers discover your spectacular peaks.",
            changes: { population: 8, economy: 14, environment: -4 },
          },
          {
            id: "m5",
            progress: 88,
            title: "Regional Capital",
            description: "Stability draws investment from across the country.",
            changes: { population: 12, economy: 10, environment: -3 },
          },
        ],
        endStats: { population: 66, economy: 80, environment: 72 },
        finalOutcome:
          "Mountain cities grow slowly but build lasting wealth. Yours became a model of sustainable, stable development.",
      },
      {
        id: "desert",
        label: "The Desert",
        tagline: "Harsh land, hidden riches",
        events: [
          {
            id: "d1",
            progress: 10,
            title: "Oasis Settlement",
            description: "A small but stubborn community forms around the springs.",
            changes: { population: 4, economy: 3, environment: -1 },
          },
          {
            id: "d2",
            progress: 28,
            title: "Oil Discovered",
            description: "Black gold. Wealth floods in overnight.",
            changes: { population: 14, economy: 22, environment: -12 },
          },
          {
            id: "d3",
            progress: 48,
            title: "Water Crisis",
            description: "Aquifers run dry. The desert fights back hard.",
            changes: { population: -8, economy: -6, environment: -14 },
          },
          {
            id: "d4",
            progress: 68,
            title: "Desalination Plants",
            description: "Engineering conquers thirst. Cautious growth resumes.",
            changes: { population: 10, economy: -4, environment: -3 },
          },
          {
            id: "d5",
            progress: 88,
            title: "Solar Revolution",
            description: "Endless sun becomes endless, clean power.",
            changes: { population: 6, economy: 10, environment: 12 },
          },
        ],
        endStats: { population: 62, economy: 68, environment: 38 },
        finalOutcome:
          "Your desert city defied nature — booming on oil before pivoting to solar. Fragile, but surprisingly resilient.",
      },
    ],
  },

  // ── Scenario 2: Energy Choice ────────────────────────────────────────────
  {
    id: "energy",
    question: "How does your nation power itself?",
    subtitle: "One policy shapes your future for decades.",
    choices: [
      {
        id: "fossil",
        label: "Fossil Fuels",
        tagline: "Cheap today, costly tomorrow",
        events: [
          {
            id: "f1",
            progress: 10,
            title: "Plants Online",
            description: "Coal and gas power the grid. The economy surges.",
            changes: { economy: 15, environment: -8 },
          },
          {
            id: "f2",
            progress: 28,
            title: "Industrial Boom",
            description: "Manufacturing explodes. Cities grow overnight.",
            changes: { population: 14, economy: 18, environment: -10 },
          },
          {
            id: "f3",
            progress: 50,
            title: "Smog Crisis",
            description: "Air quality plummets. Health costs soar nationwide.",
            changes: { population: -8, economy: -5, environment: -15 },
          },
          {
            id: "f4",
            progress: 70,
            title: "Climate Damage",
            description: "Extreme weather disrupts infrastructure across the country.",
            changes: { population: -6, economy: -12, environment: -12 },
          },
          {
            id: "f5",
            progress: 88,
            title: "Resource Depletion",
            description: "Reserves running critically low. An energy crisis looms.",
            changes: { population: -5, economy: -10, environment: -8 },
          },
        ],
        endStats: { population: 50, economy: 72, environment: 14 },
        finalOutcome:
          "Fast growth, steep decline. Your economy boomed — then slowly choked on its own exhaust.",
      },
      {
        id: "nuclear",
        label: "Nuclear",
        tagline: "Powerful, precise, polarising",
        events: [
          {
            id: "n1",
            progress: 12,
            title: "Reactor Construction",
            description: "Massive upfront cost. Years of careful building begins.",
            changes: { economy: -8, environment: 4 },
          },
          {
            id: "n2",
            progress: 30,
            title: "Grid Goes Live",
            description: "Abundant clean energy flows across the nation.",
            changes: { population: 8, economy: 14, environment: 8 },
          },
          {
            id: "n3",
            progress: 52,
            title: "Energy Independence",
            description: "No fuel imports needed. Trade balance transforms.",
            changes: { population: 10, economy: 16, environment: 6 },
          },
          {
            id: "n4",
            progress: 70,
            title: "Minor Incident",
            description: "A scare at one plant. Public trust momentarily shaken.",
            changes: { population: -5, economy: -8, environment: -3 },
          },
          {
            id: "n5",
            progress: 88,
            title: "Safety Record Restored",
            description: "Decades of safe operation rebuild public confidence.",
            changes: { population: 8, economy: 10, environment: 5 },
          },
        ],
        endStats: { population: 72, economy: 74, environment: 68 },
        finalOutcome:
          "A bold bet that largely paid off. Energy-independent, clean grid — though public trust required constant tending.",
      },
      {
        id: "renewables",
        label: "Renewables",
        tagline: "Slow start, bright horizon",
        events: [
          {
            id: "r1",
            progress: 10,
            title: "Wind Farms Built",
            description: "Turbines dot the landscape. The grid slowly fills.",
            changes: { economy: -4, environment: 10 },
          },
          {
            id: "r2",
            progress: 28,
            title: "Solar Expansion",
            description: "Panels spread across rooftops. Energy costs fall.",
            changes: { economy: 6, environment: 12 },
          },
          {
            id: "r3",
            progress: 50,
            title: "Grid Reaches Scale",
            description: "Renewables now power 60% of the entire nation.",
            changes: { population: 8, economy: 10, environment: 10 },
          },
          {
            id: "r4",
            progress: 70,
            title: "Energy Surplus",
            description: "Selling green power to neighbouring countries.",
            changes: { population: 8, economy: 14, environment: 8 },
          },
          {
            id: "r5",
            progress: 88,
            title: "Green Economy",
            description: "Clean tech industries flock to your nation.",
            changes: { population: 12, economy: 16, environment: 14 },
          },
        ],
        endStats: { population: 72, economy: 64, environment: 95 },
        finalOutcome:
          "The slow path proved wisest. Your nation became a global model — thriving economy, pristine environment.",
      },
    ],
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
