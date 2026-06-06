import { useState, useCallback, useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Antenna,
  ArrowRight,
  CalendarDays,
  Check,
  CircleHelp,
  Clipboard,
  Flame,
  Hash,
  Meh,
  Ruler,
  Target,
  ThumbsUp,
  Wind,
  X,
} from "lucide-react";
import { CLAIMS } from "./claims";
import { SizeViz, BarViz, QuantityViz, TimeViz } from "./Visualizations";
import { getDailyLevel, getLevelByDate, formatDate } from "@/levels";
import { DailyBadge } from "@/components/DailyBadge";
import { markDailyComplete } from "@/lib/dailyLock";

const DAILY_SLUG = "reality-check";

interface DailyLevelData {
  id: string;
  claims: Claim[];
}

/** FNV-1a hash → non-negative int. */
function hashKey(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Deterministic seeded pick of N claims from the built-in pool. */
function seededPick(seed: string, n: number): Claim[] {
  const arr = [...CLAIMS];
  let h = hashKey(seed);
  // Fisher–Yates with LCG seeded by hash
  for (let i = arr.length - 1; i > 0; i--) {
    h = (Math.imul(h, 1664525) + 1013904223) >>> 0;
    const j = h % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}
import type { Claim, Phase, RoundResult } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUNDS = 5;
const REVEAL_PAUSE = 650; // ms of tension before viz appears

const DIFF_STYLE: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100   text-amber-700",
  hard: "bg-red-100     text-red-700",
};

const CAT_ICON: Record<string, LucideIcon> = {
  Size: Ruler,
  Speed: Wind,
  Distance: Antenna,
  Quantity: Hash,
  History: CalendarDays,
};

// ─── Share text ───────────────────────────────────────────────────────────────

function buildShare(results: RoundResult[]): string {
  const emojis = results.map((r) => (r.correct ? "🟩" : "🟥")).join("");
  const score = results.filter((r) => r.correct).length;
  return `Reality Check\n${emojis}\nScore: ${score}/${ROUNDS}`;
}

// ─── Visualization dispatcher ─────────────────────────────────────────────────

function ClaimViz({ claim, animated }: { claim: Claim; animated: boolean }) {
  const { viz } = claim;
  if (viz.type === "size") return <SizeViz data={viz} animated={animated} />;
  if (viz.type === "bar") return <BarViz data={viz} animated={animated} />;
  if (viz.type === "quantity") return <QuantityViz data={viz} animated={animated} />;
  if (viz.type === "time") return <TimeViz data={viz} animated={animated} />;
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RealityCheck() {
  // Read ?date= for archive playback; else today's daily.
  const dateParam = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("date");
  }, []);

  const dailyLevel = useMemo(() => {
    return dateParam
      ? getLevelByDate<DailyLevelData>(DAILY_SLUG, dateParam)
      : getDailyLevel<DailyLevelData>(DAILY_SLUG);
  }, [dateParam]);

  const isTodaysDaily = !dateParam;
  const todayKey = formatDate(new Date());

  const [claims] = useState<Claim[]>(() => {
    if (dailyLevel?.data?.claims?.length) return dailyLevel.data.claims;
    return seededPick(dateParam ?? todayKey, ROUNDS);
  });

  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("playing");
  const [choice, setChoice] = useState<boolean | null>(null);
  const [animated, setAnimated] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [copied, setCopied] = useState(false);

  const claim = claims[round];
  const isCorrect = choice === claim?.answer;

  // Lock today's daily once finished.
  useEffect(() => {
    if (phase === "done" && isTodaysDaily) {
      markDailyComplete(DAILY_SLUG);
    }
  }, [phase, isTodaysDaily]);

  // ── Handle TRUE / FALSE tap ───────────────────────────────────────────────

  const handleChoice = useCallback(
    (val: boolean) => {
      if (phase !== "playing" || !claim) return;
      setChoice(val);
      setPhase("revealing");

      setTimeout(() => {
        setPhase("revealed");
        // Double rAF ensures CSS transition fires after element mounts
        requestAnimationFrame(() => requestAnimationFrame(() => setAnimated(true)));
      }, REVEAL_PAUSE);
    },
    [phase, claim],
  );

  // ── Next round ────────────────────────────────────────────────────────────

  const handleNext = useCallback(() => {
    if (!claim || choice === null) return;
    const newResult: RoundResult = {
      claimId: claim.id,
      choice,
      correct: choice === claim.answer,
    };
    const newResults = [...results, newResult];
    setResults(newResults);

    if (round + 1 >= ROUNDS) {
      setPhase("done");
      return;
    }
    setRound((r) => r + 1);
    setPhase("playing");
    setChoice(null);
    setAnimated(false);
  }, [claim, choice, results, round]);

  // ── Play again ────────────────────────────────────────────────────────────

  const handleRestart = useCallback(() => {
    // Force page reload to get fresh claims
    window.location.reload();
  }, []);

  // ── Share ─────────────────────────────────────────────────────────────────

  const handleShare = useCallback(() => {
    const text = buildShare(results);
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [results]);

  // ── DONE SCREEN ───────────────────────────────────────────────────────────

  if (phase === "done") {
    const score = results.filter((r) => r.correct).length;
    const pct = Math.round((score / ROUNDS) * 100);
    const reaction =
      pct === 100
        ? { Icon: Target, text: "Perfectly calibrated mind!" }
        : pct >= 80
          ? { Icon: Flame, text: "Your instincts are sharp!" }
          : pct >= 60
            ? { Icon: ThumbsUp, text: "Solid! The world is surprising." }
            : pct >= 40
              ? { Icon: CircleHelp, text: "Reality is stranger than it seems." }
              : { Icon: Meh, text: "The universe has a lot to teach you!" };

    return (
      <div className="flex flex-col gap-4">
        {dailyLevel && (
          <div className="flex justify-center">
            <DailyBadge dayNumber={dailyLevel.dayNumber} date={dailyLevel.date} />
          </div>
        )}
        {/* Score */}
        <div className="rounded-3xl border-2 border-foreground bg-card p-7 text-center">
          <p className="text-5xl font-black text-foreground">
            {score} / {ROUNDS}
          </p>
          <p className="text-muted-foreground text-sm mt-1 inline-flex items-center justify-center gap-2">
            <reaction.Icon className="h-4 w-4" aria-hidden="true" />
            {reaction.text}
          </p>
          <div className="mt-3 flex justify-center gap-1.5" aria-label="Results">
            {results.map((r, i) => (
              <span
                key={i}
                className={[
                  "h-4 w-4 rounded-sm border border-foreground",
                  r.correct ? "bg-emerald-500" : "bg-red-500",
                ].join(" ")}
              />
            ))}
          </div>
        </div>

        {/* Per-round breakdown */}
        <div className="flex flex-col gap-2">
          {results.map((r, i) => {
            const c = claims[i];
            return (
              <div
                key={r.claimId}
                className="rounded-2xl border border-foreground bg-card px-4 py-3 flex items-start gap-3"
              >
                <span
                  className={`shrink-0 mt-0.5 ${r.correct ? "text-emerald-600" : "text-red-500"}`}
                >
                  {r.correct ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <X className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-foreground leading-snug">{c.statement}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Answer: <strong>{c.answer ? "TRUE" : "FALSE"}</strong>
                    {" · "}
                    You said: <strong>{r.choice ? "TRUE" : "FALSE"}</strong>
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex-1 py-3 rounded-2xl border-2 border-foreground font-bold text-sm
              hover:bg-foreground hover:text-background transition-colors inline-flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Clipboard className="h-4 w-4" aria-hidden="true" />
                Share
              </>
            )}
          </button>
          {!isTodaysDaily && (
            <button
              onClick={handleRestart}
              className="flex-1 py-3 rounded-2xl bg-foreground text-background font-bold text-sm
                hover:opacity-90 active:scale-95 transition-all shadow-md inline-flex items-center justify-center gap-2"
            >
              Play again
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── MAIN GAME SCREEN ──────────────────────────────────────────────────────

  const isRevealed = phase === "revealed";
  const isRevealing = phase === "revealing";
  const CategoryIcon = CAT_ICON[claim.category] ?? CircleHelp;

  return (
    <div className="flex flex-col gap-4">
      {dailyLevel && (
        <div className="flex justify-center">
          <DailyBadge dayNumber={dailyLevel.dayNumber} date={dailyLevel.date} />
        </div>
      )}
      {/* Progress dots */}
      <div className="flex items-center gap-2 justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: ROUNDS }, (_, i) => (
            <div
              key={i}
              className={`h-2 w-8 rounded-full border border-foreground transition-colors
                ${i < round ? "bg-foreground" : i === round ? "bg-foreground/40" : "bg-card"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <CategoryIcon className="h-4 w-4" aria-hidden="true" />
            {claim.category}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${DIFF_STYLE[claim.difficulty]}`}
          >
            {claim.difficulty}
          </span>
        </div>
      </div>

      {/* Statement card */}
      <div className="rounded-3xl border-2 border-foreground bg-card px-6 py-7 text-center">
        <p className="text-lg font-extrabold text-foreground leading-snug">{claim.statement}</p>
      </div>

      {/* TRUE / FALSE buttons — only during playing phase */}
      {phase === "playing" && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleChoice(true)}
            className="py-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50
              text-emerald-700 font-black text-xl hover:bg-emerald-100
              active:scale-95 transition-all shadow-sm"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Check className="h-5 w-5" aria-hidden="true" />
              TRUE
            </span>
          </button>
          <button
            onClick={() => handleChoice(false)}
            className="py-5 rounded-2xl border-2 border-red-400 bg-red-50
              text-red-600 font-black text-xl hover:bg-red-100
              active:scale-95 transition-all shadow-sm"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <X className="h-5 w-5" aria-hidden="true" />
              FALSE
            </span>
          </button>
        </div>
      )}

      {/* Tension pause */}
      {isRevealing && (
        <div className="flex items-center justify-center py-8">
          <CircleHelp
            className="h-10 w-10 animate-pulse text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Revealed state */}
      {isRevealed && (
        <>
          {/* Result banner */}
          <div
            className={`rounded-2xl border-2 px-5 py-4 flex items-center gap-3
            ${isCorrect ? "border-emerald-500 bg-emerald-50" : "border-red-400   bg-red-50"}`}
          >
            <span className={isCorrect ? "text-emerald-600" : "text-red-500"}>
              {isCorrect ? (
                <Check className="h-8 w-8" aria-hidden="true" />
              ) : (
                <X className="h-8 w-8" aria-hidden="true" />
              )}
            </span>
            <div className="flex-1">
              <p
                className={`font-black text-base ${isCorrect ? "text-emerald-700" : "text-red-600"}`}
              >
                {isCorrect ? "Correct!" : "Wrong!"}{" "}
                <span className="font-semibold text-sm">
                  The answer is <strong>{claim.answer ? "TRUE" : "FALSE"}</strong>
                </span>
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {claim.explanation}
              </p>
            </div>
          </div>

          {/* Visualization */}
          <div className="rounded-3xl border-2 border-foreground bg-card px-4 overflow-hidden">
            <ClaimViz claim={claim} animated={animated} />
          </div>

          {/* Your choice indicator */}
          <div className="flex gap-3">
            <div
              className={[
                "flex-1 rounded-2xl border-2 px-3 py-2.5 text-center",
                choice === true
                  ? isCorrect
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-red-400 bg-red-50"
                  : "border-foreground/20 bg-card opacity-50",
              ].join(" ")}
            >
              <p className="text-xs text-muted-foreground">You said</p>
              <p className="font-black text-sm text-foreground inline-flex items-center justify-center gap-1.5">
                <Check className="h-4 w-4" aria-hidden="true" />
                TRUE
              </p>
            </div>
            <div
              className={[
                "flex-1 rounded-2xl border-2 px-3 py-2.5 text-center",
                choice === false
                  ? isCorrect
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-red-400 bg-red-50"
                  : "border-foreground/20 bg-card opacity-50",
              ].join(" ")}
            >
              <p className="text-xs text-muted-foreground">You said</p>
              <p className="font-black text-sm text-foreground inline-flex items-center justify-center gap-1.5">
                <X className="h-4 w-4" aria-hidden="true" />
                FALSE
              </p>
            </div>
          </div>

          {/* Next */}
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-2xl bg-foreground text-background font-bold text-base
              hover:opacity-90 active:scale-95 transition-all shadow-md inline-flex items-center justify-center gap-2"
          >
            {round + 1 >= ROUNDS ? "See final score" : "Next claim"}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </>
      )}
    </div>
  );
}
