import type { GameState } from "./types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number) { return a + (b - a) * Math.min(1, Math.max(0, t)); }
function p(n: number) { return Math.min(1, Math.max(0, n / 100)); }

// ─── Coast Scene ──────────────────────────────────────────────────────────────

function CoastScene({ progress }: { progress: number }) {
    const t = p(progress);
    // Sky darkens after storm (progress 68+)
    const stormT = p(Math.max(0, (progress - 60) * 3));
    const skyR = Math.round(lerp(135, 80, stormT));
    const skyG = Math.round(lerp(195, 100, stormT));
    const skyB = Math.round(lerp(235, 120, stormT));
    const skyColor = `rgb(${skyR},${skyG},${skyB})`;
    const waterR = Math.round(lerp(30, 50, stormT));
    const waterG = Math.round(lerp(120, 90, stormT));
    const waterB = Math.round(lerp(210, 140, stormT));
    const waterColor = `rgb(${waterR},${waterG},${waterB})`;

    // Buildings grow from progress 15 onward
    const b1H = lerp(0, 60, p((progress - 10) * 4));
    const b2H = lerp(0, 90, p((progress - 18) * 4));
    const b3H = lerp(0, 50, p((progress - 22) * 3));
    const b4H = lerp(0, 110, p((progress - 28) * 3));
    const b5H = lerp(0, 75, p((progress - 35) * 3));
    // Hurricane damage — shrink buildings after progress 68
    const dmg = p(Math.max(0, (progress - 68) * 4));
    const floodLevel = lerp(0, 28, p(Math.max(0, (progress - 80) * 5)));

    // Ship
    const shipX = lerp(-30, 360, t % 1);

    // Waves
    const waveOff = (progress * 4) % 60;

    // Rain during storm
    const rainOpacity = p(Math.max(0, (progress - 62) * 4)) * 0.85;

    const buildings = [
        { x: 180, w: 28, h: b1H, color: "#94a3b8" },
        { x: 216, w: 22, h: b2H, color: "#64748b" },
        { x: 244, w: 32, h: b3H, color: "#7c8c9e" },
        { x: 282, w: 24, h: b4H * (1 - dmg * 0.25), color: "#475569" },
        { x: 312, w: 30, h: b5H * (1 - dmg * 0.2), color: "#64748b" },
    ];

    return (
        <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: "block" }}>
            <defs>
                <linearGradient id="seaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={waterColor} />
                    <stop offset="100%" stopColor="#0f3460" />
                </linearGradient>
                <clipPath id="buildingClip">
                    <rect x="160" y="0" width="300" height="260" />
                </clipPath>
            </defs>

            {/* Sky */}
            <rect width="480" height="260" fill={skyColor} style={{ transition: "fill 1.5s" }} />

            {/* Clouds */}
            {[0, 1, 2].map(i => (
                <ellipse key={i}
                    cx={80 + i * 140 + (stormT > 0.3 ? -20 : 0)}
                    cy={30 + i * 12}
                    rx={lerp(30, 50, stormT) + i * 8}
                    ry={lerp(14, 22, stormT) + i * 3}
                    fill={`rgba(${stormT > 0.4 ? "60,60,70" : "255,255,255"},${lerp(0.7, 0.9, stormT)})`}
                    style={{ transition: "all 1.5s" }}
                />
            ))}

            {/* Sea */}
            <rect x="0" y="180" width="480" height="80" fill="url(#seaGrad)" />

            {/* Waves */}
            {[0, 1, 2, 3].map(i => (
                <path key={i}
                    d={`M${-60 + waveOff + i * 120} 185 q15 ${-6 - stormT * 6} 30 0 q15 ${6 + stormT * 6} 30 0`}
                    fill="none"
                    stroke={`rgba(255,255,255,${0.25 + stormT * 0.3})`}
                    strokeWidth={1.5 + stormT}
                />
            ))}

            {/* Ground / beach */}
            <ellipse cx="320" cy="195" rx="200" ry="22" fill="#d2b48c" />
            <rect x="140" y="188" width="340" height="40" fill="#c4a97a" />

            {/* Port dock */}
            {t > 0.05 && (
                <rect x="100" y="178" width="60" height="8" rx="2" fill="#8B6914"
                    opacity={Math.min(1, (progress - 5) / 10)} />
            )}

            {/* Ship */}
            {t > 0.08 && (
                <g transform={`translate(${60 + (progress * 3.2) % 280}, 170)`}
                    opacity={Math.min(1, (progress - 8) / 8)}>
                    <rect x="0" y="0" width="34" height="10" rx="2" fill="#e2e8f0" />
                    <rect x="12" y="-14" width="4" height="14" fill="#cbd5e1" />
                    <rect x="12" y="-12" width="12" height="6" fill="#94a3b8" />
                </g>
            )}

            {/* Road */}
            {t > 0.12 && (
                <rect x="250" y="188" width="14" height="50" fill="#6b7280"
                    opacity={Math.min(1, (progress - 12) / 10)} />
            )}

            {/* Buildings */}
            <g clipPath="url(#buildingClip)">
                {buildings.map((b, i) => (
                    <g key={i}>
                        <rect
                            x={b.x} y={200 - b.h} width={b.w} height={b.h}
                            fill={b.color} rx="2"
                            style={{ transition: "y 0.6s ease-out, height 0.6s ease-out" }}
                        />
                        {/* Windows */}
                        {b.h > 20 && Array.from({ length: Math.floor(b.h / 16) }, (_, r) =>
                            Array.from({ length: Math.floor(b.w / 10) }, (_, c) => (
                                <rect key={`${r}-${c}`}
                                    x={b.x + 4 + c * 10} y={204 - b.h + r * 14}
                                    width={5} height={7} rx="1"
                                    fill={progress > 65 ? "#334155" : "#fde68a"}
                                    opacity={0.8}
                                />
                            ))
                        )}
                    </g>
                ))}
            </g>

            {/* Flood water */}
            {floodLevel > 0 && (
                <rect x="0" y={200 - floodLevel} width="480" height={floodLevel + 60}
                    fill={`rgba(30,100,200,${Math.min(0.55, floodLevel / 40)})`}
                    style={{ transition: "all 1s" }}
                />
            )}

            {/* Rain */}
            {rainOpacity > 0 && (
                <g opacity={rainOpacity}>
                    {Array.from({ length: 40 }, (_, i) => (
                        <line key={i}
                            x1={10 + (i * 37 + (progress * 8)) % 470}
                            y1={(i * 53) % 200}
                            x2={5 + (i * 37 + (progress * 8)) % 470}
                            y2={20 + (i * 53) % 200}
                            stroke="#93c5fd" strokeWidth="1.2" opacity="0.7"
                        />
                    ))}
                </g>
            )}

            {/* Lightning */}
            {stormT > 0.5 && progress % 14 < 3 && (
                <polyline
                    points="240,20 228,70 238,70 222,120"
                    fill="none" stroke="#fbbf24" strokeWidth="2.5"
                    opacity={0.9}
                />
            )}
        </svg>
    );
}

// ─── Mountain Scene ───────────────────────────────────────────────────────────

function MountainScene({ progress }: { progress: number }) {
    const t = p(progress);
    const greenT = p(progress * 1.2);
    const skyR = Math.round(lerp(180, 100, t));
    const skyG = Math.round(lerp(210, 150, t));
    const skyB = Math.round(lerp(255, 200, t));

    const b1H = lerp(0, 50, p((progress - 28) * 3));
    const b2H = lerp(0, 70, p((progress - 35) * 3));
    const b3H = lerp(0, 40, p((progress - 40) * 3));
    const b4H = lerp(0, 60, p((progress - 50) * 3));

    // Hydro dam progress 45+
    const damH = lerp(0, 36, p((progress - 42) * 4));

    return (
        <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: "block" }}>
            {/* Sky */}
            <rect width="480" height="260" fill={`rgb(${skyR},${skyG},${skyB})`}
                style={{ transition: "fill 2s" }} />

            {/* Sun */}
            <circle cx="400" cy="45" r="22" fill="#fde68a" opacity="0.9" />

            {/* Clouds */}
            {[0, 1].map(i => (
                <ellipse key={i} cx={80 + i * 200} cy={35 + i * 8} rx={35 + i * 10} ry={15 + i * 4}
                    fill="rgba(255,255,255,0.85)" />
            ))}

            {/* Background mountains */}
            <polygon points="0,190 80,80 160,190" fill="#94a3b8" />
            <polygon points="60,190 160,60 260,190" fill="#7c8c9e" />
            <polygon points="180,190 290,50 400,190" fill="#64748b" />
            <polygon points="300,190 400,90 480,190" fill="#94a3b8" />

            {/* Snow caps */}
            <polygon points="160,60 148,90 172,90" fill="white" opacity="0.9" />
            <polygon points="290,50 275,85 305,85" fill="white" opacity="0.9" />

            {/* Valley floor */}
            <rect x="0" y="188" width="480" height="72" fill={`rgb(${Math.round(lerp(140, 100, greenT))},${Math.round(lerp(180, 140, greenT))},${Math.round(lerp(100, 80, greenT))})`}
                style={{ transition: "fill 2s" }} />

            {/* River */}
            <path d="M480,200 Q380,195 300,205 Q220,215 140,205 Q80,198 0,202"
                fill="none" stroke="#60a5fa" strokeWidth="8" opacity="0.8" />

            {/* Hydro dam */}
            {damH > 0 && (
                <>
                    <rect x="280" y={206 - damH} width="22" height={damH} fill="#94a3b8" rx="1" />
                    <rect x="284" y={210 - damH} width="14" height="8" fill="#60a5fa" opacity="0.6" />
                </>
            )}

            {/* Trees */}
            {[60, 100, 140, 350, 390, 420].map((x, i) => {
                const treeT = p(Math.max(0, (progress - 5 - i * 3) * 5));
                return (
                    <g key={i} opacity={treeT}>
                        <rect x={x - 2} y="182" width="4" height="14" fill="#78350f" />
                        <polygon points={`${x},${182 - lerp(0, 22, treeT)} ${x - 10},194 ${x + 10},194`}
                            fill={`rgb(${Math.round(lerp(100, 60, t * 0.5))},${Math.round(lerp(180, 130, t * 0.3))},${Math.round(lerp(80, 60, t * 0.3))})`} />
                    </g>
                );
            })}

            {/* Buildings in valley */}
            {[
                { x: 195, w: 24, h: b1H, c: "#94a3b8" },
                { x: 225, w: 18, h: b2H, c: "#64748b" },
                { x: 248, w: 28, h: b3H, c: "#7c8c9e" },
                { x: 282, w: 20, h: b4H, c: "#475569" },
            ].map((b, i) => (
                <g key={i}>
                    <rect x={b.x} y={200 - b.h} width={b.w} height={b.h} fill={b.c} rx="2" />
                    {b.h > 20 && Array.from({ length: Math.floor(b.h / 14) }, (_, r) =>
                        Array.from({ length: Math.floor(b.w / 9) }, (_, c) => (
                            <rect key={`${r}-${c}`} x={b.x + 3 + c * 9} y={204 - b.h + r * 12}
                                width={4} height={6} rx="1" fill="#fde68a" opacity={0.75} />
                        ))
                    )}
                </g>
            ))}

            {/* Tourism cable car */}
            {t > 0.65 && (
                <>
                    <line x1="160" y1="80" x2="340" y2="188" stroke="#cbd5e1" strokeWidth="1.2" />
                    <rect
                        x={160 + (progress - 65) * 1.6}
                        y={80 + (progress - 65) * 0.6}
                        width="12" height="8" rx="2" fill="#e2e8f0"
                        opacity={Math.min(1, (progress - 65) / 8)}
                    />
                </>
            )}
        </svg>
    );
}

// ─── Desert Scene ─────────────────────────────────────────────────────────────

function DesertScene({ progress }: { progress: number }) {
    const t = p(progress);
    const oilT = p(Math.max(0, (progress - 25) * 4));
    const crisisT = p(Math.max(0, (progress - 44) * 4));
    const solarT = p(Math.max(0, (progress - 80) * 5));

    const skyR = Math.round(lerp(255, 220, crisisT * 0.5));
    const skyG = Math.round(lerp(200, 160, crisisT * 0.5));
    const skyB = Math.round(lerp(100, 80, crisisT * 0.5));

    const b1H = lerp(0, 45, p((progress - 12) * 3));
    const b2H = lerp(0, 65, p((progress - 20) * 3));
    const b3H = lerp(0, 38, p((progress - 30) * 3));
    // Skyscraper from oil wealth
    const b4H = lerp(0, 120, p((progress - 28) * 2));

    return (
        <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: "block" }}>
            {/* Sky */}
            <rect width="480" height="260" fill={`rgb(${skyR},${skyG},${skyB})`}
                style={{ transition: "fill 1.5s" }} />

            {/* Sun — harsh */}
            <circle cx="60" cy="40" r="28" fill="#fbbf24" opacity="0.95" />
            <circle cx="60" cy="40" r="36" fill="#fde68a" opacity="0.3" />

            {/* Heat haze lines */}
            {crisisT > 0.3 && [0, 1, 2, 3].map(i => (
                <line key={i} x1={100 + i * 80} y1="190" x2={110 + i * 80} y2="160"
                    stroke="#fbbf24" strokeWidth="1" opacity={crisisT * 0.4}
                    strokeDasharray="3 4" />
            ))}

            {/* Sand dunes */}
            <ellipse cx="100" cy="220" rx="140" ry="40" fill="#d97706" />
            <ellipse cx="380" cy="215" rx="120" ry="35" fill="#b45309" />
            <rect x="0" y="200" width="480" height="60" fill="#c2853a" />

            {/* Ground */}
            <rect x="0" y="195" width="480" height="65" fill={`rgb(${Math.round(lerp(210, 180, t))},${Math.round(lerp(150, 110, t))},${Math.round(lerp(60, 40, t))})`}
                style={{ transition: "fill 2s" }} />

            {/* Road */}
            {t > 0.05 && (
                <rect x="230" y="195" width="16" height="65" fill="#4b5563"
                    opacity={Math.min(1, (progress - 5) / 10)} />
            )}

            {/* Buildings */}
            {[
                { x: 165, w: 26, h: b1H, c: "#d1c4a0" },
                { x: 196, w: 20, h: b2H, c: "#c4b08a" },
                { x: 220, w: 24, h: b3H, c: "#b8a07a" },
            ].map((b, i) => (
                <g key={i}>
                    <rect x={b.x} y={200 - b.h} width={b.w} height={b.h} fill={b.c} rx="1" />
                    {b.h > 18 && Array.from({ length: Math.floor(b.h / 14) }, (_, r) =>
                        Array.from({ length: 2 }, (_, c) => (
                            <rect key={`${r}-${c}`} x={b.x + 3 + c * 10} y={204 - b.h + r * 12}
                                width={5} height={6} rx="1" fill="#fef3c7" opacity={0.7} />
                        ))
                    )}
                </g>
            ))}

            {/* Oil skyscraper */}
            {b4H > 0 && (
                <g>
                    <rect x="258" y={200 - b4H} width="30" height={b4H} fill="#374151" rx="2" />
                    {Array.from({ length: Math.floor(b4H / 12) }, (_, r) =>
                        Array.from({ length: 2 }, (_, c) => (
                            <rect key={`${r}-${c}`} x={262 + c * 12} y={204 - b4H + r * 10}
                                width={6} height={7} rx="1" fill="#fbbf24" opacity={0.8} />
                        ))
                    )}
                    {/* Spire */}
                    <line x1="273" y1={200 - b4H} x2="273" y2={200 - b4H - 18}
                        stroke="#6b7280" strokeWidth="3" />
                </g>
            )}

            {/* Oil derricks */}
            {oilT > 0 && [300, 340, 370].map((x, i) => (
                <g key={i} opacity={Math.min(1, oilT * 2 - i * 0.3)}>
                    <polygon points={`${x},${185 - 30} ${x - 10},185 ${x + 10},185`}
                        fill="#1f2937" />
                    <line x1={x} y1="185" x2={x} y2={185 - 30} stroke="#374151" strokeWidth="3" />
                    {/* Pumping beam */}
                    <line
                        x1={x - 8} y1={185 - 25 + Math.sin(progress * 0.15 + i) * 5}
                        x2={x + 8} y2={185 - 18 - Math.sin(progress * 0.15 + i) * 5}
                        stroke="#6b7280" strokeWidth="3"
                    />
                </g>
            ))}

            {/* Water crisis — cracked ground */}
            {crisisT > 0.2 && (
                <g opacity={crisisT * 0.7}>
                    {[140, 200, 280, 360].map((x, i) => (
                        <path key={i} d={`M${x},200 l4,8 l-3,6 l5,5`}
                            fill="none" stroke="#92400e" strokeWidth="1.5" />
                    ))}
                </g>
            )}

            {/* Solar panels */}
            {solarT > 0 && [60, 100, 140, 340, 380, 420].map((x, i) => (
                <g key={i} opacity={Math.min(1, solarT * 3 - i * 0.3)}>
                    <rect x={x} y="192" width="20" height="10" rx="1"
                        fill="#1d4ed8" transform={`rotate(-12,${x + 10},197)`} />
                    <line x1={x + 10} y1="202" x2={x + 10} y2="208" stroke="#6b7280" strokeWidth="1.5" />
                </g>
            ))}
        </svg>
    );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function CityScene({ state }: { state: GameState }) {
    const { progress, choiceId } = state;
    if (choiceId === "coast") return <CoastScene progress={progress} />;
    if (choiceId === "mountains") return <MountainScene progress={progress} />;
    if (choiceId === "desert") return <DesertScene progress={progress} />;
    return null;
}