import type { SizeVizData, BarVizData, QuantityVizData, TimeVizData } from "./types";

// ─── Shared helpers ───────────────────────────────────────────────────────────

function fmt(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${n.toLocaleString()}`;
    return String(n);
}

// ─── SizeViz — two emoji circles scaled by value ratio ────────────────────────

export function SizeViz({ data, animated }: { data: SizeVizData; animated: boolean }) {
    const larger = Math.max(data.valueA, data.valueB);
    const smaller = Math.min(data.valueA, data.valueB);
    const ratio = larger / smaller;

    // Sub-linear so extreme ratios stay visible on screen
    const MAX_R = 110;
    const MIN_R = 24;
    const largerR = MAX_R;
    const smallerR = Math.max(MIN_R, MAX_R / Math.pow(ratio, 0.55));

    const aIsLarger = data.valueA >= data.valueB;
    const rA = aIsLarger ? largerR : smallerR;
    const rB = aIsLarger ? smallerR : largerR;

    const Circle = ({ r, emoji, label, value }: { r: number; emoji: string; label: string; value: number }) => (
        <div className="flex flex-col items-center gap-2">
            <div
                className="rounded-full border-2 border-foreground bg-card flex items-center justify-center transition-all duration-700 ease-out"
                style={{
                    width: animated ? r * 2 : 0,
                    height: animated ? r * 2 : 0,
                    opacity: animated ? 1 : 0,
                }}
            >
                <span style={{ fontSize: Math.max(16, r * 0.75) }}>{emoji}</span>
            </div>
            <div className="text-center">
                <p className="text-xs font-bold text-foreground">{label}</p>
                <p className="text-[11px] text-muted-foreground">{fmt(value)} {data.unit}</p>
            </div>
        </div>
    );

    return (
        <div className="flex items-end justify-center gap-8 py-4 min-h-[180px]">
            <Circle r={rA} emoji={data.emojiA} label={data.labelA} value={data.valueA} />
            <Circle r={rB} emoji={data.emojiB} label={data.labelB} value={data.valueB} />
        </div>
    );
}

// ─── BarViz — two horizontal bars scaled by value ─────────────────────────────

export function BarViz({ data, animated }: { data: BarVizData; animated: boolean }) {
    const larger = Math.max(data.valueA, data.valueB);
    const smaller = Math.min(data.valueA, data.valueB);
    const ratio = larger / smaller;

    // Log-scale display so extreme ratios remain readable
    const logRatio = Math.log10(ratio);
    const logScale = Math.min(1, logRatio / Math.log10(200)); // normalise against a max expected ratio

    const aIsLarger = data.valueA >= data.valueB;
    const widthA = aIsLarger ? 100 : Math.max(8, Math.round((1 - logScale * 0.75) * 100));
    const widthB = aIsLarger ? Math.max(8, Math.round((1 - logScale * 0.75) * 100)) : 100;

    const Bar = ({ emoji, label, value, targetWidth }: { emoji: string; label: string; value: number; targetWidth: number }) => (
        <div className="flex items-center gap-2 w-full">
            <span className="text-xl shrink-0 w-8 text-center">{emoji}</span>
            <div className="flex-1 flex flex-col gap-0.5">
                <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{label}</span>
                    <span>{fmt(value)} {data.unit}</span>
                </div>
                <div className="h-7 rounded-lg bg-muted overflow-hidden border border-foreground/20">
                    <div
                        className="h-full rounded-lg bg-foreground transition-all duration-700 ease-out flex items-center justify-end pr-2"
                        style={{ width: animated ? `${targetWidth}%` : "0%" }}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-3 py-4 w-full">
            <Bar emoji={data.emojiA} label={data.labelA} value={data.valueA} targetWidth={widthA} />
            <Bar emoji={data.emojiB} label={data.labelB} value={data.valueB} targetWidth={widthB} />
        </div>
    );
}

// ─── QuantityViz — emoji dot grids ────────────────────────────────────────────

const MAX_DOTS = 24;

export function QuantityViz({ data, animated }: { data: QuantityVizData; animated: boolean }) {
    const larger = Math.max(data.countA, data.countB);
    const dotsA = data.countA === larger ? MAX_DOTS : Math.max(1, Math.round((data.countA / larger) * MAX_DOTS));
    const dotsB = data.countB === larger ? MAX_DOTS : Math.max(1, Math.round((data.countB / larger) * MAX_DOTS));

    const DotGrid = ({ dots, emoji, label, real, delay }: {
        dots: number; emoji: string; label: string; real: string; delay: number;
    }) => (
        <div className="flex flex-col items-center gap-2 flex-1">
            <p className="text-xs font-bold text-foreground text-center leading-tight">{label}</p>
            <div className="flex flex-wrap gap-1 justify-center max-w-[160px] min-h-[60px]">
                {Array.from({ length: dots }, (_, i) => (
                    <span
                        key={i}
                        className="text-lg leading-none transition-all duration-300"
                        style={{
                            opacity: animated ? 1 : 0,
                            transform: animated ? "scale(1)" : "scale(0)",
                            transitionDelay: animated ? `${delay + i * 30}ms` : "0ms",
                        }}
                    >
                        {emoji}
                    </span>
                ))}
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold">{real}</p>
        </div>
    );

    return (
        <div className="flex gap-4 py-4 w-full justify-center">
            <DotGrid dots={dotsA} emoji={data.emojiA} label={data.labelA} real={data.realA} delay={0} />
            <div className="w-px bg-foreground/20 self-stretch" />
            <DotGrid dots={dotsB} emoji={data.emojiB} label={data.labelB} real={data.realB} delay={100} />
        </div>
    );
}

// ─── TimeViz — horizontal timeline with proportionally placed events ───────────

export function TimeViz({ data, animated }: { data: TimeVizData; animated: boolean }) {
    const sorted = [...data.events].sort((a, b) => a.year - b.year);
    const minY = sorted[0].year;
    const maxY = sorted[sorted.length - 1].year;
    const span = maxY - minY || 1;

    // Position as percentage along the timeline
    const pos = (year: number) => ((year - minY) / span) * 100;

    return (
        <div className="py-6 px-4 w-full">
            {/* Timeline line */}
            <div className="relative h-1 rounded-full bg-muted mx-4 mb-8 mt-12">
                {/* Animated fill */}
                <div
                    className="absolute inset-y-0 left-0 rounded-full bg-foreground transition-all duration-800 ease-out"
                    style={{ width: animated ? "100%" : "0%", transitionDuration: "800ms" }}
                />

                {/* Event markers */}
                {sorted.map((ev, i) => {
                    const pct = pos(ev.year);
                    return (
                        <div
                            key={i}
                            className="absolute flex flex-col items-center"
                            style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                        >
                            {/* Dot */}
                            <div
                                className="w-3 h-3 rounded-full border-2 border-foreground bg-card -mt-1 transition-all duration-500 ease-out"
                                style={{
                                    opacity: animated ? 1 : 0,
                                    transitionDelay: animated ? `${200 + i * 180}ms` : "0ms",
                                }}
                            />
                            {/* Label — alternating above/below */}
                            <div
                                className={`absolute flex flex-col items-center gap-0.5 transition-all duration-500
                  ${i % 2 === 0 ? "bottom-6" : "top-6"}`}
                                style={{
                                    opacity: animated ? 1 : 0,
                                    transitionDelay: animated ? `${300 + i * 180}ms` : "0ms",
                                }}
                            >
                                <span className="text-2xl leading-none">{ev.emoji}</span>
                                <p className="text-[10px] font-bold text-foreground whitespace-nowrap text-center">
                                    {ev.label}
                                </p>
                                <p className="text-[9px] text-muted-foreground whitespace-nowrap">
                                    {ev.display}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Gap labels below (for 3-event timelines, highlight the two gaps) */}
            {sorted.length >= 3 && (
                <div
                    className="flex justify-center gap-4 flex-wrap transition-all duration-500"
                    style={{ opacity: animated ? 1 : 0, transitionDelay: animated ? "900ms" : "0ms" }}
                >
                    {sorted.slice(1).map((ev, i) => {
                        const prev = sorted[i];
                        const gapYears = Math.abs(ev.year - prev.year);
                        const gapLabel = gapYears >= 1_000_000
                            ? `${(gapYears / 1_000_000).toFixed(0)}M yr gap`
                            : gapYears >= 1000
                                ? `${(gapYears / 1000).toFixed(0)}k yr gap`
                                : `${gapYears} yr gap`;
                        return (
                            <div key={i} className="text-[11px] text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                                {prev.emoji}→{ev.emoji} <strong>{gapLabel}</strong>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}