import { useState, useCallback, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Check,
  CircleHelp,
  Flame,
  Hand,
  Target,
  ThumbsUp,
  X,
} from "lucide-react";
import { TIMELINES, sortedEvents } from "./timelines";
import type { Timeline, TimelineEvent, Phase, SlotResult } from "./types";
import { getDailyLevel, getLevelByDate, formatDate } from "@/levels";
import { DailyBadge } from "@/components/DailyBadge";
import { markDailyComplete } from "@/lib/dailyLock";

const DAILY_SLUG = "timeline-builder";

/** Cheap deterministic hash → non-negative int (FNV-1a). */
function hashKey(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_COUNT = 7;
const CORRECT_SCORE = 10;
const ONE_OFF_SCORE = 7;
const TWO_OFF_SCORE = 4;
const THREE_OFF_SCORE = 1;
const REVEAL_DELAY = 350;
const CORRECT_DELAY = 600;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function posScore(diff: number): number {
  const d = Math.abs(diff);
  if (d === 0) return CORRECT_SCORE;
  if (d === 1) return ONE_OFF_SCORE;
  if (d === 2) return TWO_OFF_SCORE;
  if (d === 3) return THREE_OFF_SCORE;
  return 0;
}

function diffLabel(diff: number): string {
  if (diff === 0) return "";
  const n = Math.abs(diff);
  return diff > 0 ? `${n} too early` : `${n} too late`;
}

const DIFF_STYLES: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100   text-amber-700",
  hard: "bg-red-100     text-red-700",
};

// ─── Combined drag state (slots + holding as one atom) ────────────────────────

interface DragState {
  slots: (string | null)[]; // length = SLOT_COUNT
  holding: string[]; // event ids not yet placed
}

function initialDragState(t: Timeline): DragState {
  return {
    slots: Array(SLOT_COUNT).fill(null),
    holding: t.events.map((e) => e.id),
  };
}

// ─── EventCard ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: TimelineEvent;
  isDragging?: boolean;
  result?: SlotResult | null;
  showDate?: boolean;
  removable?: boolean;
  onRemove?: () => void;
  compact?: boolean;
}

function EventCard({
  event,
  isDragging,
  result,
  showDate,
  removable,
  onRemove,
  compact,
}: EventCardProps) {
  let border = "border-foreground";
  let bg = "bg-card";
  if (result) {
    if (result.positionDiff === 0) {
      border = "border-emerald-500";
      bg = "bg-emerald-50";
    } else {
      border = "border-red-400";
      bg = "bg-red-50";
    }
  }

  return (
    <div
      className={`
      relative border-2 rounded-2xl px-3 py-2 flex flex-col items-center gap-0.5
      text-center select-none transition-colors
      ${border} ${bg}
      ${isDragging ? "opacity-40" : ""}
      ${compact ? "min-w-[80px] max-w-[90px]" : "min-w-[100px] max-w-[120px]"}
    `}
    >
      <span className="text-2xl leading-tight">{event.emoji}</span>
      <p className="text-[11px] font-bold text-foreground leading-tight">{event.title}</p>
      {showDate && (
        <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{event.year}</p>
      )}
      {result && result.positionDiff !== 0 && (
        <p className="text-[9px] font-bold text-red-500 mt-0.5">{diffLabel(result.positionDiff)}</p>
      )}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-foreground
            text-background text-[9px] font-black flex items-center justify-center
            hover:opacity-80 transition-opacity z-10"
          aria-label="Remove"
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// ─── DraggableCard ────────────────────────────────────────────────────────────

function DraggableCard(props: EventCardProps & { phase: Phase }) {
  const { event, phase, ...rest } = props;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: event.id,
    disabled: phase !== "playing",
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{ touchAction: "none", cursor: phase === "playing" ? "grab" : "default" }}
    >
      <EventCard event={event} isDragging={isDragging} {...rest} />
    </div>
  );
}

// ─── TimelineSlot ─────────────────────────────────────────────────────────────

interface SlotProps {
  slotIdx: number;
  placedEvent: TimelineEvent | null;
  phase: Phase;
  result?: SlotResult | null;
  showDate?: boolean;
  onRemove?: () => void;
  compact?: boolean;
}

function TimelineSlot({
  slotIdx,
  placedEvent,
  phase,
  result,
  showDate,
  onRemove,
  compact,
}: SlotProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${slotIdx}` });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col items-center gap-1 transition-all ${compact ? "min-w-[88px]" : "min-w-[110px]"}`}
    >
      <div
        className={[
          "rounded-2xl border-2 flex items-center justify-center transition-colors",
          compact ? "w-[84px] min-h-[76px]" : "w-[108px] min-h-[88px]",
          placedEvent
            ? "border-transparent"
            : isOver
              ? "border-foreground bg-foreground/10"
              : "border-dashed border-foreground/30 bg-card/60",
        ].join(" ")}
      >
        {placedEvent ? (
          <DraggableCard
            event={placedEvent}
            phase={phase}
            result={result}
            showDate={showDate}
            removable={phase === "playing"}
            onRemove={onRemove}
            compact={compact}
          />
        ) : (
          <span className="text-foreground/20 text-xs font-bold">{slotIdx + 1}</span>
        )}
      </div>
      {/* Timeline dot */}
      <div className="w-2.5 h-2.5 rounded-full border-2 border-foreground bg-card shrink-0" />
    </div>
  );
}

// ─── HoldingArea ──────────────────────────────────────────────────────────────

function HoldingArea({
  events,
  phase,
  compact,
}: {
  events: TimelineEvent[];
  phase: Phase;
  compact: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "holding" });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[80px] rounded-3xl border-2 p-3 flex flex-wrap gap-2 justify-center transition-colors
        ${isOver ? "border-foreground bg-foreground/5" : "border-foreground bg-card"}
      `}
    >
      {events.length === 0 ? (
        <p className="text-xs text-muted-foreground self-center">
          All events placed — drag back here to reorder
        </p>
      ) : (
        events.map((ev) => <DraggableCard key={ev.id} event={ev} phase={phase} compact={compact} />)
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TimelineGame() {
  // Read ?date=YYYY-MM-DD for archive playback; otherwise today's daily.
  const dateParam = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("date");
  }, []);

  const dailyLevel = useMemo(() => {
    return dateParam
      ? getLevelByDate<Timeline>(DAILY_SLUG, dateParam)
      : getDailyLevel<Timeline>(DAILY_SLUG);
  }, [dateParam]);

  const todayKey = formatDate(new Date());
  const isTodaysDaily = !dateParam;

  // Pick today's timeline: authored JSON wins; otherwise deterministic
  // date-seeded pick from the built-in pool so it's still a fixed daily.
  const [timeline] = useState<Timeline>(() => {
    if (dailyLevel?.data) return dailyLevel.data;
    const seedKey = (dateParam ?? todayKey).replaceAll("-", "");
    const idx = hashKey(seedKey) % TIMELINES.length;
    return TIMELINES[idx];
  });

  // ── KEY FIX: slots + holding in ONE atomic state object ──────────────────
  const [drag, setDrag] = useState<DragState>(() => initialDragState(timeline));
  const [phase, setPhase] = useState<Phase>("playing");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [results, setResults] = useState<SlotResult[]>([]);
  const [totalScore, setTotal] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [compact, setCompact] = useState(false);

  const { slots, holding } = drag;

  // Lock today's daily once revealed
  useEffect(() => {
    if (phase === "revealed" && isTodaysDaily) {
      markDailyComplete(DAILY_SLUG);
    }
  }, [phase, isTodaysDaily]);

  useEffect(() => {
    const check = () => setCompact(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const eventsById = Object.fromEntries(timeline.events.map((e) => [e.id, e]));

  // ── Sensors ────────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
  );

  // ── Drag handlers ──────────────────────────────────────────────────────────

  const onDragStart = useCallback((e: DragStartEvent) => {
    setActiveId(String(e.active.id));
  }, []);

  const onDragEnd = useCallback((e: DragEndEvent) => {
    setActiveId(null);
    const dragId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;

    // ── Single atomic update — no nested setState ─────────────────────────
    setDrag((prev) => {
      const newSlots = [...prev.slots];
      const newHolding = [...prev.holding];

      const fromHolding = newHolding.includes(dragId);
      const fromSlotIdx = fromHolding ? -1 : newSlots.indexOf(dragId);

      // ── Dropped back into holding area ──────────────────────────────────
      if (overId === "holding") {
        if (fromHolding) return prev; // already there, no change
        // Remove from slot
        newSlots[fromSlotIdx] = null;
        // Add to holding if not already present
        if (!newHolding.includes(dragId)) newHolding.push(dragId);
        return { slots: newSlots, holding: newHolding };
      }

      // ── Dropped into a timeline slot ─────────────────────────────────────
      if (overId.startsWith("slot-")) {
        const toSlotIdx = parseInt(overId.replace("slot-", ""), 10);
        const occupant = newSlots[toSlotIdx]; // whatever was already in target slot

        if (fromHolding) {
          // holding → slot
          const hi = newHolding.indexOf(dragId);
          if (hi !== -1) newHolding.splice(hi, 1); // remove from holding
          if (occupant && !newHolding.includes(occupant)) {
            newHolding.push(occupant); // bump occupant back to holding
          }
          newSlots[toSlotIdx] = dragId;
        } else {
          // slot → slot (swap)
          newSlots[fromSlotIdx] = occupant ?? null;
          newSlots[toSlotIdx] = dragId;
        }

        return { slots: newSlots, holding: newHolding };
      }

      return prev; // dropped on unknown target
    });
  }, []);

  // ── Remove from slot (✕ button — touch fallback) ──────────────────────────

  const removeFromSlot = useCallback((slotIdx: number) => {
    setDrag((prev) => {
      const newSlots = [...prev.slots];
      const newHolding = [...prev.holding];
      const id = newSlots[slotIdx];
      if (!id) return prev;
      newSlots[slotIdx] = null;
      if (!newHolding.includes(id)) newHolding.push(id);
      return { slots: newSlots, holding: newHolding };
    });
  }, []);

  // ── Check ──────────────────────────────────────────────────────────────────

  const allPlaced = holding.length === 0 && slots.every((s) => s !== null);

  const handleCheck = useCallback(() => {
    if (!allPlaced || phase !== "playing") return;
    setPhase("checking");

    const correct = sortedEvents(timeline);
    const res: SlotResult[] = slots.map((eventId, placedIdx) => {
      const correctIdx = correct.findIndex((e) => e.id === eventId);
      const positionDiff = correctIdx - placedIdx;
      return {
        eventId: eventId!,
        placedIdx,
        correctIdx,
        positionDiff,
        score: posScore(positionDiff),
      };
    });

    setResults(res);
    setTotal(res.reduce((s, r) => s + r.score, 0));

    // Fade out → reorder → fade back in → revealed
    setFadeOut(true);
    setTimeout(() => {
      const correctIds = correct.map((e) => e.id);
      // Reorder slots to correct order; holding becomes empty (all were placed)
      setDrag({ slots: correctIds, holding: [] });
      setFadeOut(false);
      setTimeout(() => setPhase("revealed"), CORRECT_DELAY);
    }, REVEAL_DELAY);
  }, [allPlaced, phase, slots, timeline]);

  // Daily mode: no restart — one play per day, replays via archive.

  // ── Derived ────────────────────────────────────────────────────────────────

  const activeEvent = activeId ? eventsById[activeId] : null;
  const isRevealed = phase === "revealed";
  const maxScore = SLOT_COUNT * CORRECT_SCORE;
  const pct = Math.round((totalScore / maxScore) * 100);

  const resultForSlot = (slotIdx: number): SlotResult | null => {
    const id = slots[slotIdx];
    if (!id) return null;
    return results.find((r) => r.eventId === id) ?? null;
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex flex-col gap-4">
        {dailyLevel && (
          <div className="flex justify-center">
            <DailyBadge dayNumber={dailyLevel.dayNumber} date={dailyLevel.date} />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PromptIcon emoji={timeline.themeEmoji} size={26} strokeWidth={2.25} />
            <div>
              <p className="font-black text-foreground text-base leading-tight">{timeline.theme}</p>
              <p className="text-xs text-muted-foreground">{timeline.prompt}</p>
            </div>
          </div>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${DIFF_STYLES[timeline.difficulty]}`}
          >
            {timeline.difficulty}
          </span>
        </div>

        {/* Holding area */}
        {phase === "playing" && (
          <HoldingArea
            events={holding.map((id) => eventsById[id]).filter(Boolean)}
            phase={phase}
            compact={compact}
          />
        )}

        {/* Timeline */}
        <div className="rounded-3xl border-2 border-foreground bg-card p-4 overflow-x-auto">
          <p className="text-xs text-muted-foreground text-center mb-3">
            {isRevealed ? (
              <span className="inline-flex items-center justify-center gap-1.5">
                Correct order
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </span>
            ) : (
              <span className="inline-flex items-center justify-center gap-2">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>earliest · latest</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </span>
            )}
          </p>

          <div
            className={`transition-opacity duration-300 ${fadeOut ? "opacity-0" : "opacity-100"}`}
          >
            {compact ? (
              // Mobile: vertical stack
              <div className="flex flex-col items-center gap-0 relative">
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-foreground/30 -translate-x-1/2 z-0" />
                {Array.from({ length: SLOT_COUNT }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 z-10 w-full justify-center py-1">
                    <TimelineSlot
                      slotIdx={i}
                      placedEvent={slots[i] ? eventsById[slots[i]!] : null}
                      phase={phase}
                      result={isRevealed ? resultForSlot(i) : null}
                      showDate={isRevealed}
                      onRemove={() => removeFromSlot(i)}
                      compact={compact}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // Desktop: horizontal row
              <div className="flex items-start gap-0 relative">
                <div className="absolute bottom-[5px] left-0 right-0 h-0.5 bg-foreground/30 z-0" />
                {Array.from({ length: SLOT_COUNT }, (_, i) => (
                  <div key={i} className="flex-1 flex justify-center z-10">
                    <TimelineSlot
                      slotIdx={i}
                      placedEvent={slots[i] ? eventsById[slots[i]!] : null}
                      phase={phase}
                      result={isRevealed ? resultForSlot(i) : null}
                      showDate={isRevealed}
                      onRemove={() => removeFromSlot(i)}
                      compact={compact}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Hint */}
        {phase === "playing" && (
          <p className="text-xs text-muted-foreground text-center">
            <span className="inline-flex items-center justify-center gap-1.5">
              Drag events into slots ·
              <X className="h-4 w-4" aria-hidden="true" /> to return a card · fill all {SLOT_COUNT}{" "}
              slots then Check
            </span>
          </p>
        )}

        {/* Score card */}
        {isRevealed && (
          <div className="rounded-2xl border-2 border-foreground bg-card px-5 py-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="font-black text-xl text-foreground">
                {totalScore} / {maxScore}
              </p>
              <p className="text-sm font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-2">
                  {pct >= 90 ? (
                    <Target className="h-4 w-4" aria-hidden="true" />
                  ) : pct >= 70 ? (
                    <Flame className="h-4 w-4" aria-hidden="true" />
                  ) : pct >= 50 ? (
                    <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <CircleHelp className="h-4 w-4" aria-hidden="true" />
                  )}
                  {pct >= 90
                    ? "Incredible!"
                    : pct >= 70
                      ? "Sharp memory!"
                      : pct >= 50
                        ? "Decent!"
                        : "History is trickier than it looks!"}
                </span>
              </p>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden border border-foreground">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex flex-col gap-1.5 mt-1">
              {sortedEvents(timeline).map((ev) => {
                const r = results.find((r) => r.eventId === ev.id);
                return (
                  <div key={ev.id} className="flex items-start gap-2">
                    <span className="text-base shrink-0 mt-0.5">{ev.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">
                        {ev.title} — {ev.year}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-snug">{ev.fact}</p>
                    </div>
                    <span
                      className={`text-xs font-black shrink-0 ${r?.positionDiff === 0 ? "text-emerald-600" : "text-red-500"}`}
                    >
                      {r?.score ?? 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action button */}
        {phase === "playing" && (
          <button
            onClick={handleCheck}
            disabled={!allPlaced}
            className={[
              "w-full py-3 rounded-2xl font-bold text-base transition-all shadow-md",
              allPlaced
                ? "bg-foreground text-background hover:opacity-90 active:scale-95"
                : "bg-foreground/20 text-foreground/40 cursor-not-allowed",
            ].join(" ")}
          >
            {allPlaced ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Check className="h-5 w-5" aria-hidden="true" />
                Check Timeline
              </span>
            ) : (
              `Place all ${holding.length} remaining event${holding.length !== 1 ? "s" : ""} first`
            )}
          </button>
        )}

        {isRevealed &&
          (isTodaysDaily ? (
            <div className="rounded-2xl border-2 border-foreground bg-card-yellow px-6 py-5 text-center">
              <p className="font-display text-xl font-black inline-flex items-center justify-center gap-2">
                <Hand className="h-5 w-5" aria-hidden="true" />
                See you tomorrow!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                A new puzzle drops at midnight. Want more? Try the archive.
              </p>
            </div>
          ) : (
            <Link
              to="/archive/$slug"
              params={{ slug: DAILY_SLUG }}
              className="block w-full py-3 rounded-2xl bg-foreground text-background font-bold text-base text-center
                hover:opacity-90 active:scale-95 transition-all shadow-md"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <ArrowLeft className="h-5 w-5" aria-hidden="true" />
                Back to archive
              </span>
            </Link>
          ))}
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeEvent && (
          <div style={{ transform: "rotate(3deg)", opacity: 0.95 }}>
            <EventCard event={activeEvent} compact={compact} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
