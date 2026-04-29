import { useState, useCallback, useMemo } from "react";
import { pickRounds } from "./comparisons";
import type { Comparison, Phase, RoundResult } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUNDS_PER_GAME = 5;
const BASE_RADIUS     = 44;    // px — fixed radius of the smaller item (A)
const MAX_RADIUS      = 175;   // px — cap so circles always fit on screen
const VISUAL_POWER    = 0.38;  // sub-linear so extreme ratios stay visible
const REVEAL_PAUSE    = 680;   // ms of tension before animation
const ANIM_MS         = 900;   // ms for circle size transition

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Map slider [0..200] to ratio on a log scale [1..maxGuess] */
function sliderToRatio(val: number, maxGuess: number): number {
  const t = val / 200;
  return Math.pow(maxGuess, t);
}

/** Map ratio back to slider value */
function ratioToSlider(ratio: number, maxGuess: number): number {
  return Math.round((Math.log(ratio) / Math.log(maxGuess)) * 200);
}

/** Visual radius for a given ratio (B relative to A) */
function visualRadius(ratio: number): number {
  return Math.min(MAX_RADIUS, BASE_RADIUS * Math.pow(ratio, VISUAL_POWER));
}

/** Log-distance score: 100 at exact, 0 at 2 orders of magnitude off */
function calcScore(guess: number, actual: number): number {
  const logErr = Math.abs(Math.log10(guess / actual));
  return Math.max(0, Math.round(100 * (1 - logErr / 2)));
}

/** Format a ratio nicely */
function fmtRatio(r: number): string {
  if (r >= 10000) return `${(r / 1000).toFixed(0)}k×`;
  if (r >= 1000)  return `${(r / 1000).toFixed(1)}k×`;
  if (r >= 100)   return `${Math.round(r)}×`;
  if (r >= 10)    return `${r.toFixed(1)}×`;
  return `${r.toFixed(2)}×`;
}

/** Score colour */
function scoreColor(s: number): string {
  if (s >= 85) return "#16a34a"; // green
  if (s >= 55) return "#d97706"; // amber
  return "#dc2626";              // red
}

/** Score label */
function scoreLabel(s: number): string {
  if (s === 100) return "Perfect! 🎯";
  if (s >= 85)   return "Very close! 🔥";
  if (s >= 60)   return "Pretty good 👍";
  if (s >= 35)   return "Off a bit 🤔";
  return "Way off! 😬";
}

// ─── Diff badge ───────────────────────────────────────────────────────────────

const DIFF_STYLE: Record<string, string> = {
  easy:   "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100   text-amber-700",
  hard:   "bg-red-100     text-red-700",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ScaleGame() {
  const [rounds, setRounds] = useState<Comparison[]>(() => pickRounds(ROUNDS_PER_GAME));
  const [roundIdx,  setRoundIdx]  = useState(0);
  const [phase,     setPhase]     = useState<Phase>("playing");
  const [sliderVal, setSliderVal] = useState(100); // middle of 0–200
  const [bRadius,   setBRadius]   = useState(BASE_RADIUS); // animated by CSS
  const [results,   setResults]   = useState<RoundResult[]>([]);

  const comp = rounds[roundIdx];

  // ── Derived ────────────────────────────────────────────────────────────────

  const guessRatio = useMemo(
    () => sliderToRatio(sliderVal, comp.maxGuess),
    [sliderVal, comp.maxGuess]
  );

  // ── Slider change — update circle B live ──────────────────────────────────

  const onSlider = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (phase !== "playing") return;
      const v = Number(e.target.value);
      setSliderVal(v);
      setBRadius(visualRadius(sliderToRatio(v, comp.maxGuess)));
    },
    [phase, comp.maxGuess]
  );

  // ── Reveal ─────────────────────────────────────────────────────────────────

  const handleReveal = useCallback(() => {
    if (phase !== "playing") return;
    setPhase("revealing");

    setTimeout(() => {
      // Start animation toward actual size
      setBRadius(visualRadius(comp.ratio));

      setTimeout(() => {
        const score = calcScore(guessRatio, comp.ratio);
        setResults((prev) => [
          ...prev,
          { compId: comp.id, guess: guessRatio, actual: comp.ratio, score },
        ]);
        setPhase("revealed");
      }, ANIM_MS + 100);
    }, REVEAL_PAUSE);
  }, [phase, comp, guessRatio]);

  // ── Next round ─────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    const nextIdx = roundIdx + 1;
    if (nextIdx >= ROUNDS_PER_GAME) {
      setPhase("done");
      return;
    }
    setRoundIdx(nextIdx);
    setPhase("playing");
    setSliderVal(100);
    setBRadius(BASE_RADIUS); // reset instantly (no transition during reset)
  }, [roundIdx]);

  // ── Play again ─────────────────────────────────────────────────────────────

  const handleRestart = useCallback(() => {
    setRounds(pickRounds(ROUNDS_PER_GAME)); // fresh random set every game
    setRoundIdx(0);
    setPhase("playing");
    setSliderVal(100);
    setBRadius(BASE_RADIUS);
    setResults([]);
  }, []);

  // ── DONE SCREEN ────────────────────────────────────────────────────────────

  if (phase === "done") {
    const total = results.reduce((s, r) => s + r.score, 0);
    const pct   = Math.round((total / (ROUNDS_PER_GAME * 100)) * 100);

    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-3xl border-2 border-foreground bg-card p-7 text-center">
          <p className="text-5xl font-black text-foreground">{total} / {ROUNDS_PER_GAME * 100}</p>
          <p className="text-muted-foreground text-sm mt-1">
            {pct >= 90 ? "🎯 Extraordinary spatial intuition!" :
             pct >= 70 ? "🔥 Really impressive!" :
             pct >= 50 ? "👍 Solid effort!" :
             "🤔 The universe is stranger than it seems!"}
          </p>
        </div>

        {/* Per-round breakdown */}
        <div className="flex flex-col gap-2">
          {results.map((r, i) => {
            const c = rounds[i];
            return (
              <div key={r.compId}
                className="rounded-2xl border border-foreground bg-card px-4 py-3 flex items-center gap-3">
                <span className="text-2xl">{c.itemB.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {c.itemA.name} vs {c.itemB.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You: <strong>{fmtRatio(r.guess)}</strong>
                    {" · "}
                    Actual: <strong>{fmtRatio(r.actual)}</strong>
                  </p>
                </div>
                <span className="text-sm font-black shrink-0"
                  style={{ color: scoreColor(r.score) }}>
                  {r.score}
                </span>
              </div>
            );
          })}
        </div>

        <button onClick={handleRestart}
          className="w-full py-3 rounded-2xl bg-foreground text-background font-bold text-base
            hover:opacity-90 active:scale-95 transition-all shadow-md">
          Play Again →
        </button>
      </div>
    );
  }

  // ── MAIN GAME SCREEN ───────────────────────────────────────────────────────

  const currentResult = results[results.length - 1];
  const isRevealed    = phase === "revealed";
  const isRevealing   = phase === "revealing";

  return (
    <div className="flex flex-col gap-5">
      {/* CSS for circle transition */}
      <style>{`
        .scale-circle-b {
          transition: width ${ANIM_MS}ms cubic-bezier(0.34, 1.2, 0.64, 1),
                      height ${ANIM_MS}ms cubic-bezier(0.34, 1.2, 0.64, 1);
        }
      `}</style>

      {/* Round counter + difficulty */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: ROUNDS_PER_GAME }, (_, i) => (
            <div key={i}
              className={`h-2 w-8 rounded-full border border-foreground transition-colors
                ${i < roundIdx ? "bg-foreground" : i === roundIdx ? "bg-foreground/40" : "bg-card"}`}
            />
          ))}
        </div>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${DIFF_STYLE[comp.difficulty]}`}>
          {comp.difficulty}
        </span>
      </div>

      {/* Prompt */}
      <div className="rounded-3xl border-2 border-foreground bg-card px-6 py-5">
        <p className="text-lg font-extrabold text-foreground text-center leading-snug">
          {comp.prompt}
        </p>
        <p className="text-center text-xs text-muted-foreground mt-1">{comp.metric}</p>
      </div>

      {/* Visual arena */}
      <div className="rounded-3xl border-2 border-foreground bg-card px-6 py-8
        flex items-end justify-center gap-10 min-h-[220px] relative">

        {/* Label A */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="rounded-full border-2 border-foreground bg-card flex items-center justify-center"
            style={{
              width:  BASE_RADIUS * 2,
              height: BASE_RADIUS * 2,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: BASE_RADIUS * 0.85 }}>{comp.itemA.emoji}</span>
          </div>
          <p className="text-xs font-bold text-foreground text-center max-w-[90px] leading-tight">
            {comp.itemA.name}
          </p>
        </div>

        {/* B circle — animated */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="scale-circle-b rounded-full border-2 border-foreground bg-card flex items-center justify-center"
            style={{
              width:  bRadius * 2,
              height: bRadius * 2,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: Math.min(bRadius * 0.85, 48) }}>{comp.itemB.emoji}</span>
          </div>
          <p className="text-xs font-bold text-foreground text-center max-w-[90px] leading-tight">
            {comp.itemB.name}
          </p>
        </div>

        {/* Tension overlay */}
        {isRevealing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl">
            <p className="text-2xl font-black text-foreground animate-pulse">…</p>
          </div>
        )}
      </div>

      {/* Slider — hidden after reveal */}
      {!isRevealed && !isRevealing && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>Similar size</span>
            <span className="font-black text-foreground text-base">
              {fmtRatio(guessRatio)}
            </span>
            <span>{fmtRatio(comp.maxGuess)}</span>
          </div>
          <input
            type="range"
            min={1}
            max={200}
            value={sliderVal}
            onChange={onSlider}
            className="w-full accent-foreground cursor-pointer"
            style={{ height: 6 }}
          />
          <p className="text-xs text-center text-muted-foreground">
            Drag to set your estimate, then hit Reveal
          </p>
        </div>
      )}

      {/* Result panel — shown after reveal */}
      {isRevealed && currentResult && (
        <div className="rounded-2xl border-2 border-foreground bg-card px-5 py-4 flex flex-col gap-3">
          {/* Score */}
          <div className="flex items-center justify-between">
            <p className="font-black text-lg"
              style={{ color: scoreColor(currentResult.score) }}>
              {scoreLabel(currentResult.score)}
            </p>
            <p className="text-2xl font-black"
              style={{ color: scoreColor(currentResult.score) }}>
              +{currentResult.score}
            </p>
          </div>

          {/* Guess vs actual */}
          <div className="flex gap-4">
            <div className="flex-1 rounded-xl bg-muted px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Your guess</p>
              <p className="font-bold text-foreground">{fmtRatio(currentResult.guess)}</p>
            </div>
            <div className="flex-1 rounded-xl bg-muted px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">Actual ratio</p>
              <p className="font-bold text-foreground">{fmtRatio(currentResult.actual)}</p>
            </div>
          </div>

          {/* Log-scale accuracy bar */}
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Accuracy</span>
              <span>{currentResult.score}%</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden border border-foreground">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${currentResult.score}%`,
                  background: scoreColor(currentResult.score),
                }}
              />
            </div>
          </div>

          {/* Fact */}
          <p className="text-xs text-muted-foreground leading-relaxed italic">
            💡 {comp.fact}
          </p>
        </div>
      )}

      {/* Action buttons */}
      {!isRevealing && (
        <button
          onClick={isRevealed ? handleNext : handleReveal}
          className="w-full py-3 rounded-2xl bg-foreground text-background font-bold text-base
            hover:opacity-90 active:scale-95 transition-all shadow-md"
        >
          {isRevealed
            ? roundIdx + 1 >= ROUNDS_PER_GAME
              ? "See final score →"
              : `Next comparison →`
            : "Reveal ✨"}
        </button>
      )}
    </div>
  );
}