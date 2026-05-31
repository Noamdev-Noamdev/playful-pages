import { Radio } from "lucide-react";
import { useState, useEffect, CSSProperties } from "react";
import type { Game } from "./types";
import { WinOverlay } from "./_WinOverlay";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────────────────────── */

type CellKind = "empty" | "constraint" | "blocked";

interface PCell {
    kind: CellKind;
    req?: number; // required coverage (constraint cells only)
}

interface Puzzle {
    id: number;
    title: string;
    hint: string;
    grid: PCell[][];
}

/* ─────────────────────────────────────────────────────────────────────────────
   Cell factories (shorthand for puzzle definitions)
───────────────────────────────────────────────────────────────────────────── */

const E = (): PCell => ({ kind: "empty" });
const B = (): PCell => ({ kind: "blocked" });
const N = (n: number): PCell => ({ kind: "constraint", req: n });

const GS = 6; // grid size

/* ─────────────────────────────────────────────────────────────────────────────
   Puzzle definitions
   Each solution is verified by hand (solutions shown in comments only).

   Signal rule: a tower at (r,c) emits in all 4 cardinal directions; the beam
   travels until it hits a BLOCKED tile or the grid edge. Blocked tiles are
   not covered. Constraint tiles are NOT blocked — beams pass through them.
   Coverage of a tile = number of towers whose beam reaches it.
───────────────────────────────────────────────────────────────────────────── */

const PUZZLES: Puzzle[] = [
    {
        id: 1,
        title: "Introduction",
        hint: "Each number is the exact signal count that cell must receive.",
        // Solution: towers at (1,2) and (4,4)
        // (0,2)→col2 T1=1  (1,4)→row1+col4=2  (1,5)→row1=1
        // (4,0)→row4=1  (4,2)→col2+row4=2  (5,4)→col4=1
        grid: [
            [E(), E(), N(1), E(), E(), E()],
            [E(), E(), E(), E(), N(2), N(1)],
            [E(), E(), E(), E(), E(), E()],
            [E(), E(), E(), E(), E(), E()],
            [N(1), E(), N(2), E(), E(), E()],
            [E(), E(), E(), E(), N(1), E()],
        ],
    },
    {
        id: 2,
        title: "Crossroads",
        hint: "Three towers must form a triangle of intersecting signals.",
        // Solution: towers at (0,3), (3,0), (5,5)
        // (0,0)→row0+col0=2  (0,5)→row0+col5=2  (1,3)→col3=1
        // (3,4)→row3=1  (3,5)→row3+col5=2  (5,1)→row5=1  (5,3)→col3+row5=2
        grid: [
            [N(2), E(), E(), E(), E(), N(2)],
            [E(), E(), E(), N(1), E(), E()],
            [E(), E(), E(), E(), E(), E()],
            [E(), E(), E(), E(), N(1), N(2)],
            [E(), E(), E(), E(), E(), E()],
            [E(), N(1), E(), N(2), E(), E()],
        ],
    },
    {
        id: 3,
        title: "Barrier",
        hint: "A blocked tile cuts the signal — plan your towers around it.",
        // Blocker at (3,2).  Solution: towers at (0,2), (4,4), (5,0)
        // T1=(0,2): col2 down stops at blocker → covers (1,2),(2,2) only
        // (0,0)→row0+col0=2  (0,4)→row0+col4=2  (1,2)→col2 T1=1
        // (4,0)→row4+col0=2  (4,2)→row4 T2=1 (col2 blocked)
        // (5,2)→row5 T3=1 (col2 blocked)  (5,4)→row5+col4=2
        grid: [
            [N(2), E(), E(), E(), N(2), E()],
            [E(), E(), N(1), E(), E(), E()],
            [E(), E(), E(), E(), E(), E()],
            [E(), E(), B(), E(), E(), E()],
            [N(2), E(), N(1), E(), E(), E()],
            [E(), E(), N(1), E(), N(2), E()],
        ],
    },
    {
        id: 4,
        title: "Compression",
        hint: "Two barriers fragment the grid — find the right gaps.",
        // Blockers at (0,3) and (5,2).  Solution: towers at (0,5), (3,2), (4,0)
        // T2=(0,5): row0 left blocked at (0,3) → only covers (0,4)
        // T1=(3,2): col2 down blocked at (5,2) → covers (4,2) only below tower
        // (0,0)→col0 T3=1  (0,2)→col2 T1=1 [T2 row0 blocked]
        // (3,0)→row3 T1 + col0 T3=2  (4,2)→col2 T1 + row4 T3=2
        // (4,5)→row4 T3 + col5 T2=2  (5,5)→col5 T2=1
        grid: [
            [N(1), E(), N(1), B(), E(), E()],
            [E(), E(), E(), E(), E(), E()],
            [E(), E(), E(), E(), E(), E()],
            [N(2), E(), E(), E(), E(), E()],
            [E(), E(), N(2), E(), E(), N(2)],
            [E(), E(), B(), E(), E(), N(1)],
        ],
    },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Core logic
───────────────────────────────────────────────────────────────────────────── */

function makeTowers(): boolean[][] {
    return Array.from({ length: GS }, () => new Array<boolean>(GS).fill(false));
}

function computeCoverage(grid: PCell[][], towers: boolean[][]): number[][] {
    const cov = Array.from({ length: GS }, () => new Array<number>(GS).fill(0));
    for (let r = 0; r < GS; r++) {
        for (let c = 0; c < GS; c++) {
            if (!towers[r][c]) continue;
            for (const [dr, dc] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as [number, number][]) {
                let nr = r + dr, nc = c + dc;
                while (nr >= 0 && nr < GS && nc >= 0 && nc < GS) {
                    if (grid[nr][nc].kind === "blocked") break;
                    cov[nr][nc]++;
                    nr += dr;
                    nc += dc;
                }
            }
        }
    }
    return cov;
}

function checkWin(grid: PCell[][], cov: number[][]): boolean {
    const hasConstraint = grid.some(row => row.some(c => c.kind === "constraint"));
    if (!hasConstraint) return false;
    return grid.every((row, r) =>
        row.every((cell, c) => cell.kind !== "constraint" || cov[r][c] === cell.req)
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Signal Game — main component
───────────────────────────────────────────────────────────────────────────── */

function SignalGame() {
    const [puzzleIdx, setPuzzleIdx] = useState(0);
    const [towers, setTowers] = useState<boolean[][]>(makeTowers);
    const [history, setHistory] = useState<boolean[][][]>([]);
    const [won, setWon] = useState(false);
    const [pulseKey, setPulseKey] = useState("");

    const puzzle = PUZZLES[puzzleIdx];
    const coverage = computeCoverage(puzzle.grid, towers);
    const solved = checkWin(puzzle.grid, coverage);

    // Delay win overlay slightly so the last satisfaction animation can play
    useEffect(() => {
        if (solved && !won) {
            const t = setTimeout(() => setWon(true), 420);
            return () => clearTimeout(t);
        }
    }, [solved, won]);

    const handleClick = (r: number, c: number) => {
        if (won || puzzle.grid[r][c].kind !== "empty") return;
        const placing = !towers[r][c];
        setHistory(h => [...h, towers.map(row => [...row])]);
        setTowers(prev => {
            const next = prev.map(row => [...row]);
            next[r][c] = !next[r][c];
            return next;
        });
        if (placing) {
            const key = `${r}-${c}-${Date.now()}`;
            setPulseKey(key);
            setTimeout(() => setPulseKey(k => (k === key ? "" : k)), 500);
        }
    };

    const doReset = () => { setHistory([]); setTowers(makeTowers()); setWon(false); };
    const doUndo = () => {
        if (!history.length) return;
        setTowers(history[history.length - 1]);
        setHistory(h => h.slice(0, -1));
    };
    const doNext = () => {
        setPuzzleIdx(i => (i + 1) % PUZZLES.length);
        setHistory([]); setTowers(makeTowers()); setWon(false);
    };

    // Progress counters
    const totalConstraints = puzzle.grid.flat().filter(c => c.kind === "constraint").length;
    const satisfiedCount = puzzle.grid.reduce((acc, row, r) =>
        acc + row.filter((cell, c) => cell.kind === "constraint" && coverage[r][c] === cell.req).length
        , 0);

    const controls = [
        { label: "Reset", fn: doReset, disabled: false },
        { label: "Undo", fn: doUndo, disabled: history.length === 0 },
        { label: "Next →", fn: doNext, disabled: false },
    ];

    return (
        <>
            {/* ── Keyframes ─────────────────────────────────────────────────────── */}
            <style>{`
        @keyframes sig-tower-in {
          0%   { transform: scale(0); opacity: 0; }
          65%  { transform: scale(1.3); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes sig-beam-in {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
        .sig-tower-bounce {
          animation: sig-tower-in 0.38s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .sig-grid-cell:hover {
          border-color: rgba(34, 211, 238, 0.35) !important;
        }
        .sig-btn:hover:not(:disabled) {
          border-color: rgba(100, 116, 139, 0.8) !important;
          color: rgb(226, 232, 240) !important;
        }
      `}</style>

            <div className="space-y-4">

                {/* ── Puzzle header ────────────────────────────────────────────────── */}
                <div className="text-center" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{
                        fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
                        color: "rgba(148,163,184,0.5)",
                    }}>
                        Puzzle {puzzle.id} of {PUZZLES.length}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "rgb(226,232,240)" }}>
                        {puzzle.title}
                    </span>
                    <span style={{ fontSize: 12, color: "rgba(148,163,184,0.6)", maxWidth: 320, margin: "0 auto" }}>
                        {puzzle.hint}
                    </span>
                </div>

                {/* ── Progress ─────────────────────────────────────────────────────── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ fontSize: 11, color: "rgba(148,163,184,0.45)" }}>
                        {satisfiedCount}/{totalConstraints} satisfied
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                        {PUZZLES.map((_, i) => (
                            <div key={i} style={{
                                width: 7, height: 7, borderRadius: "50%",
                                background: i < puzzleIdx
                                    ? "rgba(34,211,238,0.35)"
                                    : i === puzzleIdx
                                        ? "rgb(34,211,238)"
                                        : "rgba(100,116,139,0.3)",
                                boxShadow: i === puzzleIdx ? "0 0 6px rgba(34,211,238,0.7)" : "none",
                                transition: "background 0.3s, box-shadow 0.3s",
                            }} />
                        ))}
                    </div>
                </div>

                {/* ── Game board ───────────────────────────────────────────────────── */}
                <div className="rounded-3xl border-2 border-foreground bg-card p-4 sm:p-6">
                    <div style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${GS}, 1fr)`,
                        gap: 5,
                        maxWidth: 352,
                        margin: "0 auto",
                    }}>
                        {puzzle.grid.map((row, r) =>
                            row.map((cell, c) => (
                                <GridCell
                                    key={`${r}-${c}`}
                                    cell={cell}
                                    hasTower={towers[r][c]}
                                    cov={coverage[r][c]}
                                    pulsing={towers[r][c] && pulseKey.startsWith(`${r}-${c}-`)}
                                    onClick={() => handleClick(r, c)}
                                />
                            ))
                        )}
                    </div>

                    {/* Legend */}
                    <div style={{
                        marginTop: 16,
                        display: "flex", justifyContent: "center", gap: 20,
                        fontSize: 11, color: "rgba(148,163,184,0.4)",
                    }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{
                                display: "inline-block", width: 8, height: 8, borderRadius: "50%",
                                background: "rgb(34,211,238)",
                                boxShadow: "0 0 5px rgba(34,211,238,0.9)",
                            }} />
                            click to place
                        </span>
                        <span>× blocks signal</span>
                        <span style={{ color: "rgba(52,211,153,0.5)" }}>■ = satisfied</span>
                    </div>
                </div>

                {/* ── Controls ─────────────────────────────────────────────────────── */}
                <div style={{ display: "flex", justifyContent: "center", gap: 8 }}>
                    {controls.map(({ label, fn, disabled }) => (
                        <button
                            key={label}
                            className="sig-btn"
                            onClick={fn}
                            disabled={disabled}
                            style={{
                                padding: "7px 18px",
                                fontSize: 13,
                                borderRadius: 10,
                                border: "1px solid rgba(100,116,139,0.4)",
                                background: "transparent",
                                color: disabled ? "rgba(100,116,139,0.28)" : "rgba(148,163,184,0.75)",
                                cursor: disabled ? "not-allowed" : "pointer",
                                transition: "border-color 0.15s, color 0.15s",
                            } as CSSProperties}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* ── Win overlay ──────────────────────────────────────────────────── */}
                <WinOverlay
                    show={won}
                    onPlayAgain={doNext}
                    message="Signal Complete!"
                    sub={
                        puzzleIdx < PUZZLES.length - 1
                            ? "Next puzzle incoming…"
                            : "All puzzles cleared — loop continues!"
                    }
                />
            </div>
        </>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   GridCell component
───────────────────────────────────────────────────────────────────────────── */

interface GridCellProps {
    cell: PCell;
    hasTower: boolean;
    cov: number;
    pulsing: boolean;
    onClick: () => void;
}

function GridCell({ cell, hasTower, cov, pulsing, onClick }: GridCellProps) {
    const { kind, req } = cell;

    const satisfied = kind === "constraint" && cov === req;
    const over = kind === "constraint" && typeof req === "number" && cov > req;
    const partial = kind === "constraint" && cov > 0 && !satisfied && !over;
    const uncovered = kind === "constraint" && cov === 0;
    const beamed = kind === "empty" && !hasTower && cov > 0;

    /* ── Visual state ──────────────────────────────────────────────────────── */

    let bg = "rgba(15,23,42,0.55)";
    let border = "rgba(51,65,85,0.28)";
    let shadow = "none";

    if (kind === "blocked") {
        bg = "rgba(28,39,57,0.9)";
        border = "rgba(51,65,85,0.22)";
    } else if (hasTower) {
        bg = "rgba(8,145,178,0.16)";
        border = "rgba(34,211,238,0.72)";
        shadow = "0 0 14px rgba(34,211,238,0.38), inset 0 0 8px rgba(34,211,238,0.1)";
    } else if (satisfied) {
        bg = "rgba(16,185,129,0.11)";
        border = "rgba(52,211,153,0.68)";
        shadow = "0 0 10px rgba(52,211,153,0.28)";
    } else if (over) {
        bg = "rgba(239,68,68,0.09)";
        border = "rgba(248,113,113,0.6)";
    } else if (partial) {
        bg = "rgba(251,191,36,0.06)";
        border = "rgba(251,191,36,0.48)";
    } else if (beamed) {
        const a = Math.min(cov * 0.065, 0.19);
        bg = `rgba(6,182,212,${a})`;
        border = `rgba(6,182,212,${Math.min(a * 1.9, 0.3)})`;
    }

    const style: CSSProperties = {
        aspectRatio: "1",
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 7,
        border: `1.5px solid ${border}`,
        background: bg,
        boxShadow: shadow,
        cursor: kind === "empty" ? "pointer" : "default",
        transition: "background 0.18s, border-color 0.18s, box-shadow 0.22s",
        position: "relative",
        userSelect: "none",
        overflow: "hidden",
    };

    /* ── Number color ────────────────────────────────────────────────────── */
    const numColor = satisfied ? "rgb(74,222,128)"
        : over ? "rgb(248,113,113)"
            : partial ? "rgb(251,191,36)"
                : uncovered ? "rgb(100,116,139)"
                    : "rgb(100,116,139)";

    return (
        <div className="sig-grid-cell" style={style} onClick={onClick}>

            {/* Blocked × */}
            {kind === "blocked" && (
                <span style={{ fontSize: 15, color: "rgba(100,116,139,0.45)", lineHeight: 1 }}>
                    ×
                </span>
            )}

            {/* Tower dot */}
            {hasTower && (
                <div
                    className={pulsing ? "sig-tower-bounce" : ""}
                    style={{
                        width: "40%",
                        aspectRatio: "1",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, rgb(103,232,249) 0%, rgb(34,211,238) 100%)",
                        boxShadow: "0 0 10px rgba(34,211,238,1), 0 0 28px rgba(34,211,238,0.52)",
                    }}
                />
            )}

            {/* Constraint number */}
            {kind === "constraint" && !hasTower && (
                <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1, gap: 1,
                }}>
                    <span style={{
                        fontSize: 20, fontWeight: 800, color: numColor,
                        transition: "color 0.22s",
                        letterSpacing: "-0.02em",
                    }}>
                        {req}
                    </span>
                    {/* Show actual coverage below when wrong and non-zero */}
                    {(partial || over) && (
                        <span style={{ fontSize: 9, color: numColor, opacity: 0.65, lineHeight: 1 }}>
                            {cov}
                        </span>
                    )}
                </div>
            )}

            {/* Tiny beam-coverage count on empty covered cells */}
            {beamed && (
                <span style={{
                    position: "absolute", bottom: 2, right: 3,
                    fontSize: 8,
                    color: "rgba(34,211,238,0.32)",
                    fontFamily: "monospace",
                    lineHeight: 1,
                    pointerEvents: "none",
                }}>
                    {cov}
                </span>
            )}
        </div>
    );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Game registration
───────────────────────────────────────────────────────────────────────────── */

const SignalMeta: Game = {
    slug: "signal",
    title: "Signal",
    description: "Place towers to route exact signal counts through every numbered cell.",
    icon: Radio,
    color: "sky",
    category: "originals",
    Component: SignalGame,
};

export default SignalMeta;