import type { Claim } from "./types";

export const CLAIMS: Claim[] = [
    // ── SIZE viz ──────────────────────────────────────────────────────────────

    {
        id: "s1",
        statement: "The Eiffel Tower is taller than Mount Fuji",
        answer: false,
        difficulty: "easy",
        category: "Size",
        explanation: "Mount Fuji stands 3,776 m tall — over 11× the Eiffel Tower's 330 m. The tower would look like a toy next to it.",
        viz: {
            type: "size",
            labelA: "Eiffel Tower", emojiA: "🗼", valueA: 330,
            labelB: "Mount Fuji", emojiB: "🗻", valueB: 3776,
            unit: "m tall",
        },
    },
    {
        id: "s2",
        statement: "A blue whale is heavier than a fully loaded Boeing 747",
        answer: false,
        difficulty: "medium",
        category: "Size",
        explanation: "A blue whale weighs ~150 tonnes. A fully loaded 747 weighs ~412 tonnes — nearly 3× heavier than Earth's largest animal.",
        viz: {
            type: "size",
            labelA: "Blue whale", emojiA: "🐋", valueA: 150000,
            labelB: "Boeing 747", emojiB: "✈️", valueB: 412000,
            unit: "kg",
        },
    },
    {
        id: "s3",
        statement: "Mount Everest is taller than the Mariana Trench is deep",
        answer: false,
        difficulty: "medium",
        category: "Size",
        explanation: "Everest reaches 8,849 m. The Mariana Trench plunges 11,034 m — more than 2 km deeper than Everest is tall.",
        viz: {
            type: "size",
            labelA: "Mount Everest", emojiA: "⛰️", valueA: 8849,
            labelB: "Mariana Trench", emojiB: "🌊", valueB: 11034,
            unit: "m",
        },
    },
    {
        id: "s4",
        statement: "The Statue of Liberty is taller than the Leaning Tower of Pisa",
        answer: true,
        difficulty: "easy",
        category: "Size",
        explanation: "The Statue of Liberty stands 93 m to the torch tip; the Leaning Tower is 56 m. Liberty wins by a comfortable 37 m.",
        viz: {
            type: "size",
            labelA: "Leaning Tower of Pisa", emojiA: "🏛️", valueA: 56,
            labelB: "Statue of Liberty", emojiB: "🗽", valueB: 93,
            unit: "m tall",
        },
    },
    {
        id: "s5",
        statement: "A polar bear outweighs a grizzly bear",
        answer: true,
        difficulty: "easy",
        category: "Size",
        explanation: "Male polar bears average ~500 kg; male grizzlies ~270 kg. Polar bears are the world's largest land carnivore.",
        viz: {
            type: "size",
            labelA: "Grizzly bear", emojiA: "🐻", valueA: 270,
            labelB: "Polar bear", emojiB: "🐻‍❄️", valueB: 500,
            unit: "kg",
        },
    },
    {
        id: "s6",
        statement: "The Great Pyramid of Giza is taller than the Eiffel Tower",
        answer: false,
        difficulty: "easy",
        category: "Size",
        explanation: "The Great Pyramid originally stood 146 m; today 138 m. The Eiffel Tower at 330 m is more than twice as tall.",
        viz: {
            type: "size",
            labelA: "Great Pyramid", emojiA: "🏔️", valueA: 138,
            labelB: "Eiffel Tower", emojiB: "🗼", valueB: 330,
            unit: "m tall",
        },
    },
    {
        id: "s7",
        statement: "An African elephant outweighs a white rhinoceros",
        answer: true,
        difficulty: "easy",
        category: "Size",
        explanation: "African elephants weigh up to 6,000 kg; white rhinos up to 2,300 kg. The elephant is the largest land animal.",
        viz: {
            type: "size",
            labelA: "White rhino", emojiA: "🦏", valueA: 2300,
            labelB: "African elephant", emojiB: "🐘", valueB: 6000,
            unit: "kg",
        },
    },

    // ── BAR viz ───────────────────────────────────────────────────────────────

    {
        id: "b1",
        statement: "A cheetah runs faster than a peregrine falcon dives",
        answer: false,
        difficulty: "medium",
        category: "Speed",
        explanation: "A cheetah tops out at ~120 km/h. A peregrine falcon dives at up to 390 km/h — the fastest movement of any animal on Earth.",
        viz: {
            type: "bar",
            labelA: "Cheetah (sprint)", emojiA: "🐆", valueA: 120,
            labelB: "Peregrine (dive)", emojiB: "🦅", valueB: 390,
            unit: "km/h",
        },
    },
    {
        id: "b2",
        statement: "The ISS travels faster than a rifle bullet",
        answer: true,
        difficulty: "hard",
        category: "Speed",
        explanation: "The ISS orbits at ~27,600 km/h. A typical rifle bullet travels ~3,600 km/h. The station moves nearly 8× faster.",
        viz: {
            type: "bar",
            labelA: "Rifle bullet", emojiA: "💥", valueA: 3600,
            labelB: "ISS", emojiB: "🛸", valueB: 27600,
            unit: "km/h",
        },
    },
    {
        id: "b3",
        statement: "Sound travels faster through water than through air",
        answer: true,
        difficulty: "medium",
        category: "Speed",
        explanation: "Sound travels at 343 m/s in air but 1,480 m/s in water — over 4× faster, because water molecules are packed tighter.",
        viz: {
            type: "bar",
            labelA: "Sound in air", emojiA: "🌬️", valueA: 343,
            labelB: "Sound in water", emojiB: "🌊", valueB: 1480,
            unit: "m/s",
        },
    },
    {
        id: "b4",
        statement: "The Amazon River is longer than the flight distance from London to New York",
        answer: true,
        difficulty: "medium",
        category: "Distance",
        explanation: "The Amazon stretches 6,992 km; the London–New York flight is 5,570 km. The river would overshoot JFK by 1,400 km.",
        viz: {
            type: "bar",
            labelA: "London → New York", emojiA: "✈️", valueA: 5570,
            labelB: "Amazon River", emojiB: "🌿", valueB: 6992,
            unit: "km",
        },
    },
    {
        id: "b5",
        statement: "A Formula 1 car goes faster than a commercial airplane cruises",
        answer: false,
        difficulty: "easy",
        category: "Speed",
        explanation: "An F1 car maxes out at ~372 km/h. A commercial airliner cruises at ~900 km/h — nearly 2.5× faster at 35,000 feet.",
        viz: {
            type: "bar",
            labelA: "F1 car (max)", emojiA: "🏎️", valueA: 372,
            labelB: "Airplane cruise", emojiB: "✈️", valueB: 900,
            unit: "km/h",
        },
    },
    {
        id: "b6",
        statement: "Neptune is more than 70× farther from the Sun than Mercury is",
        answer: true,
        difficulty: "hard",
        category: "Distance",
        explanation: "Mercury is ~58M km from the Sun; Neptune is ~4,495M km away — 77× farther. Our solar system is almost incomprehensibly large.",
        viz: {
            type: "bar",
            labelA: "Mercury → Sun", emojiA: "☿", valueA: 58,
            labelB: "Neptune → Sun", emojiB: "🔵", valueB: 4495,
            unit: "million km",
        },
    },

    // ── QUANTITY viz ─────────────────────────────────────────────────────────

    {
        id: "q1",
        statement: "There are more trees on Earth than stars in the Milky Way",
        answer: true,
        difficulty: "hard",
        category: "Quantity",
        explanation: "Earth has ~3 trillion trees; the Milky Way has ~200–400 billion stars. Trees outnumber stars by roughly 10 to 1.",
        viz: {
            type: "quantity",
            labelA: "Milky Way stars", emojiA: "⭐", countA: 300, realA: "~300 billion",
            labelB: "Trees on Earth", emojiB: "🌳", countB: 3000, realB: "~3 trillion",
        },
    },
    {
        id: "q2",
        statement: "There are more countries in Africa than in Europe and Asia combined",
        answer: false,
        difficulty: "medium",
        category: "Quantity",
        explanation: "Africa has 54 countries. Europe has 44 and Asia has 48 — combined 92. Africa has nearly half as many.",
        viz: {
            type: "quantity",
            labelA: "Africa countries", emojiA: "🌍", countA: 54, realA: "54 countries",
            labelB: "Europe + Asia countries", emojiB: "🌏", countB: 92, realB: "92 countries",
        },
    },
    {
        id: "q3",
        statement: "There are more species of beetles than all mammal species combined",
        answer: true,
        difficulty: "hard",
        category: "Quantity",
        explanation: "There are ~400,000 known beetle species vs ~6,400 mammal species. Biologist J.B.S. Haldane joked God has 'an inordinate fondness for beetles.'",
        viz: {
            type: "quantity",
            labelA: "Mammal species", emojiA: "🐾", countA: 6400, realA: "~6,400",
            labelB: "Beetle species", emojiB: "🐞", countB: 400000, realB: "~400,000",
        },
    },
    {
        id: "q4",
        statement: "Sharks kill more people per year than bees do",
        answer: false,
        difficulty: "medium",
        category: "Quantity",
        explanation: "Sharks kill ~10 people per year globally. Bees, wasps and hornets kill ~50+ per year. Sharks' reputation is wildly overstated.",
        viz: {
            type: "quantity",
            labelA: "Shark fatalities/yr", emojiA: "🦈", countA: 10, realA: "~10/year",
            labelB: "Bee/wasp fatalities/yr", emojiB: "🐝", countB: 50, realB: "~50+/year",
        },
    },
    {
        id: "q5",
        statement: "More tourists visit France each year than people live there",
        answer: true,
        difficulty: "medium",
        category: "Quantity",
        explanation: "France receives ~90 million tourists a year — the most of any country — while only ~68 million people actually live there.",
        viz: {
            type: "quantity",
            labelA: "French population", emojiA: "🇫🇷", countA: 68, realA: "~68 million",
            labelB: "Annual tourists", emojiB: "🧳", countB: 90, realB: "~90 million",
        },
    },
    {
        id: "q6",
        statement: "There are more stars in the Milky Way than grains of sand on all Earth's beaches",
        answer: false,
        difficulty: "hard",
        category: "Quantity",
        explanation: "The Milky Way has ~300 billion stars. Earth's beaches hold an estimated 7.5 quintillion grains of sand — 25 million times more.",
        viz: {
            type: "quantity",
            labelA: "Milky Way stars", emojiA: "⭐", countA: 1, realA: "~300 billion",
            labelB: "Sand grains on beaches", emojiB: "🏖️", countB: 25000000, realB: "7.5 quintillion",
        },
    },

    // ── TIME viz ─────────────────────────────────────────────────────────────

    {
        id: "t1",
        statement: "T-Rex lived closer in time to humans than to Stegosaurus",
        answer: true,
        difficulty: "hard",
        category: "History",
        explanation: "Stegosaurus died ~150 million years ago, T-Rex ~66 million years ago. Humans arrived ~0.3 million years ago — T-Rex is nearly twice as close to us.",
        viz: {
            type: "time",
            events: [
                { label: "Stegosaurus", emoji: "🦕", year: -150000000, display: "150 million BC" },
                { label: "T-Rex", emoji: "🦖", year: -66000000, display: "66 million BC" },
                { label: "Humans", emoji: "👤", year: -300000, display: "300,000 BC" },
            ],
        },
    },
    {
        id: "t2",
        statement: "Cleopatra lived closer in time to the Moon landing than to the Great Pyramid's construction",
        answer: true,
        difficulty: "hard",
        category: "History",
        explanation: "The Great Pyramid was built ~2560 BC, Cleopatra lived ~30 BC (2,530 years later), and the Moon landing was 1969 (1,999 years after Cleopatra). She's closer to NASA.",
        viz: {
            type: "time",
            events: [
                { label: "Great Pyramid", emoji: "🏔️", year: -2560, display: "2560 BC" },
                { label: "Cleopatra", emoji: "👑", year: -30, display: "30 BC" },
                { label: "Moon landing", emoji: "🌕", year: 1969, display: "1969 AD" },
            ],
        },
    },
    {
        id: "t3",
        statement: "The fax machine was invented after the telephone",
        answer: false,
        difficulty: "hard",
        category: "History",
        explanation: "Alexander Bain invented a basic fax machine in 1843. Alexander Graham Bell patented the telephone in 1876 — 33 years later. The fax is the elder tech.",
        viz: {
            type: "time",
            events: [
                { label: "Fax machine", emoji: "📠", year: 1843, display: "1843" },
                { label: "Telephone", emoji: "☎️", year: 1876, display: "1876" },
            ],
        },
    },
    {
        id: "t4",
        statement: "Woolly mammoths were still alive when the Great Pyramid was built",
        answer: true,
        difficulty: "hard",
        category: "History",
        explanation: "The Great Pyramid was built ~2560 BC. The last woolly mammoths on Wrangel Island went extinct ~1650 BC — 910 years after pyramid construction began.",
        viz: {
            type: "time",
            events: [
                { label: "Great Pyramid built", emoji: "🏔️", year: -2560, display: "2560 BC" },
                { label: "Last woolly mammoths die", emoji: "🦣", year: -1650, display: "1650 BC" },
            ],
        },
    },
    {
        id: "t5",
        statement: "The Roman Colosseum is older than the Great Wall of China",
        answer: false,
        difficulty: "medium",
        category: "History",
        explanation: "The Colosseum was completed in 80 AD. The Great Wall's main construction began in 221 BC — over 300 years earlier.",
        viz: {
            type: "time",
            events: [
                { label: "Great Wall begins", emoji: "🏯", year: -221, display: "221 BC" },
                { label: "Colosseum completed", emoji: "🏛️", year: 80, display: "80 AD" },
            ],
        },
    },
    {
        id: "t6",
        statement: "Oxford University is older than the Aztec Empire",
        answer: true,
        difficulty: "hard",
        category: "History",
        explanation: "Oxford began teaching around 1096 AD. The Aztec Empire was founded in 1428 AD — 332 years after students first studied at Oxford.",
        viz: {
            type: "time",
            events: [
                { label: "Oxford University", emoji: "🎓", year: 1096, display: "1096 AD" },
                { label: "Aztec Empire", emoji: "⚔️", year: 1428, display: "1428 AD" },
            ],
        },
    },
];

export function pickClaims(n: number): Claim[] {
    const arr = [...CLAIMS];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.slice(0, n);
}