import { useState, useEffect, useRef, useCallback } from "react";
import { SCENARIOS } from "./scenarios";
import { CityScene } from "./CityScene";
import { EnergyScene } from "./EnergyScene";
import type { Scenario, Choice, Phase, GameState, SimStats } from "./types";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, Coins, Leaf, Pin, Users } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TICK_MS = 220; // ms per tick
const TICKS_TOTAL = 90; // total ticks for full simulation (≈ 20s)
const TOAST_MS = 2800; // how long event toast stays visible

// ─── Stat bar colour ──────────────────────────────────────────────────────────

function statColor(v: number): string {
  if (v >= 65) return "#16a34a";
  if (v >= 40) return "#d97706";
  return "#dc2626";
}

const STAT_META: Record<
  string,
  {
    Icon: LucideIcon;
    label: string;
  }
> = {
  population: { Icon: Users, label: "Population" },
  economy: { Icon: Coins, label: "Economy" },
  environment: { Icon: Leaf, label: "Environment" },
};

// ─── Scene dispatcher — add new scenarios here ───────────────────────────────
// To add a new scenario: create a new XxxScene.tsx, import it below,
// and add a case to this function. That's the only wiring needed.

function SceneFor({ state }: { state: GameState }) {
  if (state.scenarioId === "city") return <CityScene state={state} />;
  if (state.scenarioId === "energy") return <EnergyScene state={state} />;
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DecisionGame() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("choosing");
  const [choice, setChoice] = useState<Choice | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [toast, setToast] = useState<{ title: string; desc: string } | null>(null);

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<GameState | null>(null);
  stateRef.current = gameState;

  const scenario: Scenario = SCENARIOS[scenarioIdx];

  // ── Show toast ───────────────────────────────────────────────────────────

  const showToast = useCallback((title: string, desc: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ title, desc });
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  // ── Start simulation ─────────────────────────────────────────────────────

  const startSim = useCallback(
    (ch: Choice) => {
      setChoice(ch);
      setPhase("simulating");

      const initial: GameState = {
        scenarioId: scenario.id,
        choiceId: ch.id,
        progress: 0,
        stats: { population: 40, economy: 40, environment: 60 },
        firedEventIds: new Set(),
        latestEvent: null,
      };
      setGameState(initial);

      let tick = 0;

      tickRef.current = setInterval(() => {
        tick++;
        const newProgress = Math.min(100, (tick / TICKS_TOTAL) * 100);

        setGameState((prev) => {
          if (!prev) return prev;
          const newFired = new Set(prev.firedEventIds);
          const newStats: SimStats = { ...prev.stats };
          let latestEvent = prev.latestEvent;

          // Fire events whose progress threshold we just crossed
          for (const ev of ch.events) {
            if (!newFired.has(ev.id) && newProgress >= ev.progress) {
              newFired.add(ev.id);
              latestEvent = ev;

              // Apply changes with small random jitter (±20% of each change)
              const jitter = () => 1 + (Math.random() - 0.5) * 0.4;
              if (ev.changes.population !== undefined)
                newStats.population = Math.min(
                  100,
                  Math.max(0, newStats.population + ev.changes.population * jitter()),
                );
              if (ev.changes.economy !== undefined)
                newStats.economy = Math.min(
                  100,
                  Math.max(0, newStats.economy + ev.changes.economy * jitter()),
                );
              if (ev.changes.environment !== undefined)
                newStats.environment = Math.min(
                  100,
                  Math.max(0, newStats.environment + ev.changes.environment * jitter()),
                );

              showToast(ev.title, ev.description);
            }
          }

          return {
            ...prev,
            progress: newProgress,
            stats: newStats,
            firedEventIds: newFired,
            latestEvent,
          };
        });

        if (tick >= TICKS_TOTAL) {
          if (tickRef.current) clearInterval(tickRef.current);
          // Snap to declared end stats for the final screen
          setGameState((prev) =>
            prev
              ? {
                  ...prev,
                  progress: 100,
                  stats: {
                    population: ch.endStats.population,
                    economy: ch.endStats.economy,
                    environment: ch.endStats.environment,
                  },
                }
              : prev,
          );
          setTimeout(() => setPhase("done"), 600);
        }
      }, TICK_MS);
    },
    [scenario, showToast],
  );

  // ── Skip to end ──────────────────────────────────────────────────────────

  const skipToEnd = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (!choice || !gameState) return;
    setGameState((prev) =>
      prev
        ? {
            ...prev,
            progress: 100,
            stats: {
              population: choice.endStats.population,
              economy: choice.endStats.economy,
              environment: choice.endStats.environment,
            },
          }
        : prev,
    );
    setToast(null);
    setTimeout(() => setPhase("done"), 400);
  }, [choice, gameState]);

  // ── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // ── Reset ────────────────────────────────────────────────────────────────

  const reset = useCallback((newScenarioIdx?: number) => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setPhase("choosing");
    setChoice(null);
    setGameState(null);
    setToast(null);
    if (newScenarioIdx !== undefined) setScenarioIdx(newScenarioIdx);
  }, []);

  // ── Stat display labels ───────────────────────────────────────────────────

  const statVal = (v: number) => {
    if (v >= 80) return "Thriving";
    if (v >= 60) return "Good";
    if (v >= 40) return "Fair";
    if (v >= 20) return "Poor";
    return "Critical";
  };

  // ─────────────────────────────────────────────────────────────────────────
  // ── CHOOSING SCREEN ───────────────────────────────────────────────────────

  if (phase === "choosing") {
    return (
      <div className="flex flex-col gap-6">
        {/* Scenario tabs */}
        {SCENARIOS.length > 1 && (
          <div className="flex gap-2">
            {SCENARIOS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setScenarioIdx(i)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors
                  ${
                    i === scenarioIdx
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card text-muted-foreground border-foreground/30 hover:border-foreground"
                  }`}
              >
                {s.question.split(" ").slice(0, 3).join(" ")}…
              </button>
            ))}
          </div>
        )}

        {/* Question */}
        <div className="rounded-3xl border-2 border-foreground bg-card px-6 py-8 text-center">
          <p className="text-2xl font-black text-foreground leading-tight">{scenario.question}</p>
          <p className="text-sm text-muted-foreground mt-2">{scenario.subtitle}</p>
        </div>

        {/* Choice buttons */}
        <div className="flex flex-col gap-3">
          {scenario.choices.map((ch) => (
            <button
              key={ch.id}
              onClick={() => startSim(ch)}
              className="rounded-2xl border-2 border-foreground bg-card px-6 py-5
                hover:bg-foreground hover:text-background transition-colors
                active:scale-98 text-left group"
            >
              <p className="font-black text-lg text-foreground group-hover:text-background transition-colors">
                {ch.label}
              </p>
              <p className="text-sm text-muted-foreground group-hover:text-background/70 transition-colors mt-0.5">
                {ch.tagline}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── SIMULATION + DONE SCREENS (share layout) ──────────────────────────────

  if (!gameState || !choice) return null;
  const isDone = phase === "done";

  return (
    <div className="flex flex-col gap-4">
      {/* SVG Scene */}
      <div
        className="rounded-3xl border-2 border-foreground overflow-hidden"
        style={{ height: 220, position: "relative" }}
      >
        <SceneFor state={gameState} />

        {/* Progress bar overlay */}
        {!isDone && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 3,
              background: "rgba(0,0,0,0.15)",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "rgba(255,255,255,0.7)",
                width: `${gameState.progress}%`,
                transition: `width ${TICK_MS}ms linear`,
              }}
            />
          </div>
        )}
      </div>

      {/* Event toast */}
      {toast && (
        <div
          className="rounded-2xl border-2 border-foreground bg-card px-4 py-3
          flex items-start gap-3 shadow-lg animate-pulse"
          style={{ animation: "none" }}
        >
          <Pin className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" aria-hidden />
          <div>
            <p className="text-xs font-black text-foreground">{toast.title}</p>
            <p className="text-[11px] text-muted-foreground leading-snug">{toast.desc}</p>
          </div>
        </div>
      )}

      {/* Stat bars */}
      <div className="rounded-2xl border-2 border-foreground bg-card px-4 py-4 flex flex-col gap-3">
        {(["population", "economy", "environment"] as const).map((key) => {
          const v = Math.round(gameState.stats[key]);
          const meta = STAT_META[key];
          const StatIcon = meta?.Icon;
          return (
            <div key={key}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-foreground inline-flex items-center gap-1.5">
                  {StatIcon && <StatIcon className="h-4 w-4" aria-hidden />}
                  {meta?.label ?? key}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">{statVal(v)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden border border-foreground/20">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${v}%`, background: statColor(v) }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Simulation controls */}
      {!isDone && (
        <div className="flex gap-3">
          <button
            onClick={skipToEnd}
            className="flex-1 py-2.5 rounded-xl border-2 border-foreground bg-card
              text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
          >
            <span className="inline-flex items-center justify-center gap-2">
              Skip to result
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </button>
        </div>
      )}

      {/* Done screen */}
      {isDone && (
        <div className="rounded-2xl border-2 border-foreground bg-card px-5 py-5 flex flex-col gap-4">
          <div>
            <p className="font-black text-base text-foreground">{choice.label}</p>
            <p className="text-sm text-muted-foreground leading-snug mt-1">{choice.finalOutcome}</p>
          </div>

          {/* Final scores */}
          <div className="grid grid-cols-3 gap-2">
            {(["population", "economy", "environment"] as const).map((key) => {
              const v = Math.round(gameState.stats[key]);
              const meta = STAT_META[key];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-foreground/30 bg-muted px-2 py-2 text-center"
                >
                  <p className="text-[10px] text-muted-foreground font-semibold mb-0.5">
                    {meta?.label ?? key}
                  </p>
                  <p className="text-sm font-black" style={{ color: statColor(v) }}>
                    {statVal(v)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Replay buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => reset(scenarioIdx)}
              className="flex-1 py-2.5 rounded-xl border-2 border-foreground bg-card
                text-sm font-semibold text-foreground hover:bg-foreground hover:text-background transition-colors"
            >
              Try another choice
            </button>
            <button
              onClick={() => reset(scenarioIdx === SCENARIOS.length - 1 ? 0 : scenarioIdx + 1)}
              className="flex-1 py-2.5 rounded-xl bg-foreground text-background
                text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <span className="inline-flex items-center justify-center gap-2">
                Next scenario
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Choice reminder */}
      <p className="text-xs text-muted-foreground text-center">
        {isDone ? "See what happens with a different choice" : `You chose: ${choice.label}`}
      </p>
    </div>
  );
}
