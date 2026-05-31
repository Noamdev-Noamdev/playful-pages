import type { GameState } from "./types";

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}
function p(n: number) {
  return Math.min(1, Math.max(0, n / 100));
}

// ─── Fossil Fuels ─────────────────────────────────────────────────────────────

function FossilScene({ progress }: { progress: number }) {
  const t = p(progress);
  const smogT = p(Math.max(0, (progress - 40) * 2));
  const crisisT = p(Math.max(0, (progress - 65) * 3));

  const skyR = Math.round(lerp(140, 90, smogT));
  const skyG = Math.round(lerp(180, 100, smogT));
  const skyB = Math.round(lerp(220, 90, smogT));

  const b1H = lerp(0, 70, p((progress - 5) * 3));
  const b2H = lerp(0, 100, p((progress - 10) * 3));
  const b3H = lerp(0, 55, p((progress - 15) * 3));
  const b4H = lerp(0, 130, p((progress - 18) * 2.5));
  const b5H = lerp(0, 80, p((progress - 22) * 2.5));
  const b6H = lerp(0, 60, p((progress - 28) * 3));

  // Smoke puff offset cycles with progress
  const puff = (progress * 2.5) % 60;

  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id="smogGrad">
          <stop offset="0%" stopColor={`rgb(${skyR},${skyG},${skyB})`} />
          <stop
            offset="100%"
            stopColor={`rgb(${Math.round(lerp(80, 50, smogT))},${Math.round(lerp(80, 55, smogT))},${Math.round(lerp(80, 50, smogT))})`}
          />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect
        width="480"
        height="260"
        fill={`rgb(${skyR},${skyG},${skyB})`}
        style={{ transition: "fill 2s" }}
      />

      {/* Smog layer */}
      {smogT > 0 && (
        <rect
          x="0"
          y="0"
          width="480"
          height={lerp(0, 100, smogT)}
          fill={`rgba(120,100,80,${smogT * 0.5})`}
          style={{ transition: "all 2s" }}
        />
      )}

      {/* Ground */}
      <rect
        x="0"
        y="200"
        width="480"
        height="60"
        fill={`rgb(${Math.round(lerp(80, 55, smogT))},${Math.round(lerp(90, 65, smogT))},${Math.round(lerp(70, 50, smogT))})`}
        style={{ transition: "fill 2s" }}
      />

      {/* Roads */}
      {t > 0.1 && (
        <>
          <rect x="0" y="200" width="480" height="10" fill="#374151" />
          <rect x="220" y="190" width="14" height="70" fill="#374151" />
          {[60, 120, 180, 300, 360, 420].map((x) => (
            <line
              key={x}
              x1={x}
              y1="204"
              x2={x + 40}
              y2="204"
              stroke="#6b7280"
              strokeWidth="1"
              strokeDasharray="6 4"
            />
          ))}
        </>
      )}

      {/* Buildings */}
      {[
        { x: 30, w: 28, h: b1H, c: "#475569" },
        { x: 65, w: 24, h: b2H, c: "#374151" },
        { x: 96, w: 32, h: b3H, c: "#4b5563" },
        { x: 135, w: 22, h: b4H, c: "#1f2937" },
        { x: 165, w: 30, h: b5H, c: "#374151" },
        { x: 202, w: 26, h: b6H, c: "#4b5563" },
      ].map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={200 - b.h} width={b.w} height={b.h} fill={b.c} rx="1" />
          {b.h > 25 &&
            Array.from({ length: Math.floor(b.h / 14) }, (_, r) =>
              Array.from({ length: Math.floor(b.w / 9) }, (_, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={b.x + 3 + c * 9}
                  y={203 - b.h + r * 12}
                  width={4}
                  height={7}
                  rx="1"
                  fill={smogT > 0.5 ? "#78350f" : "#fde68a"}
                  opacity={smogT > 0.5 ? 0.6 : 0.85}
                />
              )),
            )}
        </g>
      ))}

      {/* Power plant + chimneys */}
      {t > 0.08 && (
        <g opacity={Math.min(1, (progress - 8) / 10)}>
          <rect x="310" y="160" width="80" height="40" fill="#374151" rx="2" />
          <rect x="325" y="140" width="14" height="60" fill="#4b5563" rx="2" />
          <rect x="360" y="135" width="14" height="65" fill="#4b5563" rx="2" />

          {/* Smoke from chimneys */}
          {[332, 367].map((cx, si) =>
            [0, 1, 2].map((pi) => {
              const rise = (puff + pi * 20) % 60;
              return (
                <circle
                  key={`${si}-${pi}`}
                  cx={cx + Math.sin(rise * 0.1 + si) * 6}
                  cy={134 - rise * 1.2}
                  r={8 + rise * 0.4}
                  fill={`rgb(${Math.round(lerp(120, 80, smogT))},${Math.round(lerp(120, 80, smogT))},${Math.round(lerp(120, 75, smogT))})`}
                  opacity={Math.max(0, (0.7 - rise / 60) * (0.5 + smogT * 0.5))}
                />
              );
            }),
          )}
        </g>
      )}

      {/* Crisis: dark rain */}
      {crisisT > 0 &&
        Array.from({ length: 25 }, (_, i) => (
          <line
            key={i}
            x1={10 + ((i * 43 + progress * 6) % 470)}
            y1={(i * 37) % 190}
            x2={5 + ((i * 43 + progress * 6) % 470)}
            y2={18 + ((i * 37) % 190)}
            stroke="#78350f"
            strokeWidth="1"
            opacity={crisisT * 0.6}
          />
        ))}

      {/* Factories right side */}
      {t > 0.25 &&
        [340, 390, 430].map((x, i) => (
          <g key={i} opacity={Math.min(1, (progress - 25 - i * 8) / 10)}>
            <rect x={x} y={195 - 30 - i * 5} width="32" height={30 + i * 5} fill="#374151" rx="1" />
            <rect x={x + 8} y={195 - 42 - i * 5} width="8" height="12" fill="#4b5563" />
          </g>
        ))}
    </svg>
  );
}

// ─── Nuclear ──────────────────────────────────────────────────────────────────

function NuclearScene({ progress }: { progress: number }) {
  const t = p(progress);
  const incidentT = p(Math.max(0, (progress - 67) * 5));
  const recoveryT = p(Math.max(0, (progress - 82) * 5));

  const skyR = Math.round(lerp(160, incidentT > 0.3 ? 140 : 120, t));
  const skyG = Math.round(lerp(200, incidentT > 0.3 ? 160 : 170, t));
  const skyB = Math.round(lerp(240, 200, t));

  const b1H = lerp(0, 60, p((progress - 30) * 4));
  const b2H = lerp(0, 80, p((progress - 35) * 4));
  const b3H = lerp(0, 55, p((progress - 38) * 4));
  const domeH = lerp(0, 1, p((progress - 5) * 3));

  // Cooling tower steam
  const steamPuff = (progress * 2) % 50;

  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: "block" }}>
      {/* Sky */}
      <rect
        width="480"
        height="260"
        fill={`rgb(${skyR},${skyG},${skyB})`}
        style={{ transition: "fill 2s" }}
      />

      {/* Incident warning glow */}
      {incidentT > 0 && recoveryT < 0.5 && (
        <circle
          cx="160"
          cy="120"
          r={lerp(0, 200, incidentT)}
          fill={`rgba(250,204,21,${incidentT * 0.15})`}
        />
      )}

      {/* Ground */}
      <rect
        x="0"
        y="198"
        width="480"
        height="62"
        fill={`rgb(${Math.round(lerp(100, 80, t))},${Math.round(lerp(140, 120, t))},${Math.round(lerp(80, 65, t))})`}
        style={{ transition: "fill 2s" }}
      />

      {/* River / cooling water */}
      <path
        d="M0,215 Q120,210 240,218 Q360,225 480,212"
        fill="none"
        stroke="#60a5fa"
        strokeWidth="10"
        opacity="0.6"
      />

      {/* Cooling towers */}
      {[80, 140].map((x, i) => (
        <g key={i} opacity={Math.min(1, (progress - 2) / 10)}>
          {/* Tower shape */}
          <path
            d={`M${x - 18},200 Q${x},${165 - i * 5} ${x + 18},200 Q${x + 8},${175 - i * 5} ${x},${163 - i * 5} Q${x - 8},${175 - i * 5} ${x - 18},200 Z`}
            fill="#94a3b8"
            stroke="#64748b"
            strokeWidth="1"
          />
          {/* Steam puffs */}
          {[0, 1, 2].map((pi) => {
            const rise = (steamPuff + pi * 17) % 50;
            return (
              <ellipse
                key={pi}
                cx={x + Math.sin(rise * 0.12 + i) * 5}
                cy={163 - i * 5 - rise * 1.3}
                rx={10 + rise * 0.5}
                ry={7 + rise * 0.3}
                fill="white"
                opacity={Math.max(0, 0.65 - rise / 50)}
              />
            );
          })}
        </g>
      ))}

      {/* Reactor dome */}
      {domeH > 0 && (
        <g opacity={Math.min(1, (progress - 5) / 8)}>
          <ellipse cx="160" cy="198" rx="42" ry="12" fill="#94a3b8" />
          <path
            d={`M118,198 Q118,${198 - 55 * domeH} 160,${198 - 60 * domeH} Q202,${198 - 55 * domeH} 202,198 Z`}
            fill="#94a3b8"
            stroke="#64748b"
            strokeWidth="2"
            style={{ transition: "d 1s" }}
          />
          {/* Warning symbol during incident */}
          {incidentT > 0.1 && recoveryT < 0.3 && (
            <text x="152" y={198 - 30 * domeH} fontSize="18" fill="#fbbf24" opacity={incidentT}>
              ⚠️
            </text>
          )}
        </g>
      )}

      {/* City buildings */}
      {[
        { x: 240, w: 26, h: b1H, c: "#64748b" },
        { x: 273, w: 22, h: b2H, c: "#475569" },
        { x: 300, w: 30, h: b3H, c: "#64748b" },
      ].map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={200 - b.h} width={b.w} height={b.h} fill={b.c} rx="2" />
          {b.h > 22 &&
            Array.from({ length: Math.floor(b.h / 13) }, (_, r) =>
              Array.from({ length: Math.floor(b.w / 9) }, (_, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={b.x + 3 + c * 9}
                  y={203 - b.h + r * 11}
                  width={4}
                  height={6}
                  rx="1"
                  fill={incidentT > 0.2 && recoveryT < 0.4 ? "#f97316" : "#bae6fd"}
                  opacity={0.8}
                />
              )),
            )}
        </g>
      ))}

      {/* Powerlines */}
      {t > 0.3 &&
        [200, 280, 360, 420].map((x, i) => (
          <g key={i} opacity={Math.min(1, (progress - 30) / 15)}>
            <line x1={x} y1="170" x2={x} y2="200" stroke="#6b7280" strokeWidth="2" />
            <line x1={x - 12} y1="170" x2={x + 12} y2="170" stroke="#6b7280" strokeWidth="1.5" />
            <line x1={x - 12} y1="170" x2={x - 4} y2="178" stroke="#94a3b8" strokeWidth="0.8" />
            <line x1={x + 12} y1="170" x2={x + 4} y2="178" stroke="#94a3b8" strokeWidth="0.8" />
          </g>
        ))}

      {/* Trees / greenery recovery */}
      {recoveryT > 0 &&
        [350, 380, 410, 440].map((x, i) => (
          <g key={i} opacity={Math.min(1, recoveryT * 3 - i * 0.5)}>
            <rect x={x} y="192" width="5" height="10" fill="#78350f" />
            <circle cx={x + 2.5} cy="188" r="9" fill="#166534" />
          </g>
        ))}
    </svg>
  );
}

// ─── Renewables ───────────────────────────────────────────────────────────────

function RenewablesScene({ progress }: { progress: number }) {
  const t = p(progress);
  const skyR = Math.round(lerp(160, 100, t * 0.4));
  const skyG = Math.round(lerp(210, 180, t * 0.2));
  const skyB = Math.round(lerp(250, 230, t * 0.1));

  const numTurbines = Math.floor(lerp(0, 5, p(progress * 2)));
  const numPanels = Math.floor(lerp(0, 8, p((progress - 20) * 2)));
  const surplusGlow = p(Math.max(0, (progress - 70) * 3));

  // Turbine blade rotation
  const bladeAngle = (progress * 6) % 360;

  const b1H = lerp(0, 55, p((progress - 45) * 4));
  const b2H = lerp(0, 70, p((progress - 50) * 4));
  const b3H = lerp(0, 45, p((progress - 55) * 4));

  return (
    <svg viewBox="0 0 480 260" width="100%" height="100%" style={{ display: "block" }}>
      {/* Sky — clear and increasingly vibrant */}
      <rect
        width="480"
        height="260"
        fill={`rgb(${skyR},${skyG},${skyB})`}
        style={{ transition: "fill 2s" }}
      />

      {/* Sun */}
      <circle cx="420" cy="40" r={lerp(20, 30, t)} fill="#fde68a" opacity="0.95" />
      {surplusGlow > 0 && (
        <circle
          cx="420"
          cy="40"
          r={30 + surplusGlow * 20}
          fill={`rgba(253,230,138,${surplusGlow * 0.3})`}
        />
      )}

      {/* Clouds — white and clean */}
      {[0, 1, 2].map((i) => (
        <ellipse
          key={i}
          cx={60 + i * 160}
          cy={30 + i * 8}
          rx={35 + i * 10}
          ry={15 + i * 3}
          fill="rgba(255,255,255,0.9)"
        />
      ))}

      {/* Rolling hills */}
      <path
        d="M0,200 Q80,160 160,190 Q240,220 320,185 Q400,150 480,190 L480,260 L0,260 Z"
        fill={`rgb(${Math.round(lerp(100, 60, t * 0.5))},${Math.round(lerp(160, 130, t * 0.3))},${Math.round(lerp(70, 50, t * 0.3))})`}
        style={{ transition: "fill 2s" }}
      />
      <path
        d="M0,210 Q80,180 160,205 Q240,230 320,200 Q400,170 480,205 L480,260 L0,260 Z"
        fill={`rgb(${Math.round(lerp(80, 55, t * 0.4))},${Math.round(lerp(140, 110, t * 0.3))},${Math.round(lerp(60, 45, t * 0.3))})`}
      />

      {/* Ground */}
      <rect
        x="0"
        y="210"
        width="480"
        height="50"
        fill={`rgb(${Math.round(lerp(90, 65, t * 0.4))},${Math.round(lerp(130, 100, t * 0.3))},${Math.round(lerp(55, 40, t * 0.3))})`}
      />

      {/* Wind turbines */}
      {Array.from({ length: numTurbines }, (_, i) => {
        const tx = 30 + i * 75;
        const ty = 185 - i * 8;
        const mast = lerp(40, 60, i / 5);
        return (
          <g key={i} opacity={Math.min(1, (progress - i * 8) / 10)}>
            {/* Mast */}
            <line x1={tx} y1={ty} x2={tx} y2={ty + mast} stroke="#94a3b8" strokeWidth="3" />
            {/* Nacelle */}
            <rect x={tx - 5} y={ty - 4} width="10" height="6" rx="2" fill="#cbd5e1" />
            {/* Blades */}
            <g transform={`rotate(${bladeAngle + i * 72},${tx},${ty})`}>
              {[0, 120, 240].map((deg) => (
                <line
                  key={deg}
                  x1={tx}
                  y1={ty}
                  x2={tx + Math.sin((deg * Math.PI) / 180) * 18}
                  y2={ty - Math.cos((deg * Math.PI) / 180) * 18}
                  stroke="#e2e8f0"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              ))}
            </g>
          </g>
        );
      })}

      {/* Solar panels */}
      {Array.from({ length: numPanels }, (_, i) => {
        const px = 310 + (i % 4) * 26;
        const py = 205 + Math.floor(i / 4) * 10;
        return (
          <g key={i} opacity={Math.min(1, (progress - 20 - i * 4) / 8)}>
            <rect
              x={px}
              y={py}
              width="22"
              height="12"
              rx="1"
              fill="#1e40af"
              stroke="#1d4ed8"
              strokeWidth="0.5"
              transform={`rotate(-8,${px + 11},${py + 6})`}
            />
            <line
              x1={px + 8}
              y1={py + 12}
              x2={px + 8}
              y2={py + 16}
              stroke="#6b7280"
              strokeWidth="1.5"
            />
            <line
              x1={px + 14}
              y1={py + 12}
              x2={px + 14}
              y2={py + 16}
              stroke="#6b7280"
              strokeWidth="1.5"
            />
            {/* Panel gleam */}
            <line
              x1={px + 4}
              y1={py + 3}
              x2={px + 8}
              y2={py + 1}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth="0.8"
              transform={`rotate(-8,${px + 11},${py + 6})`}
            />
          </g>
        );
      })}

      {/* City (appears later, powered cleanly) */}
      {[
        { x: 192, w: 24, h: b1H, c: "#64748b" },
        { x: 222, w: 20, h: b2H, c: "#475569" },
        { x: 248, w: 28, h: b3H, c: "#64748b" },
      ].map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={212 - b.h} width={b.w} height={b.h} fill={b.c} rx="2" />
          {b.h > 20 &&
            Array.from({ length: Math.floor(b.h / 13) }, (_, r) =>
              Array.from({ length: Math.floor(b.w / 9) }, (_, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={b.x + 3 + c * 9}
                  y={215 - b.h + r * 11}
                  width={4}
                  height={6}
                  rx="1"
                  fill="#bae6fd"
                  opacity={0.9}
                />
              )),
            )}
        </g>
      ))}

      {/* Surplus glow / energy export beams */}
      {surplusGlow > 0 && (
        <g opacity={surplusGlow * 0.7}>
          {[30, 130, 200, 340].map((x, i) => (
            <line
              key={i}
              x1={x}
              y1={185 - i * 6}
              x2={x + 20}
              y2="50"
              stroke="#fde68a"
              strokeWidth="1"
              strokeDasharray="4 6"
              opacity={0.5}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function EnergyScene({ state }: { state: GameState }) {
  const { progress, choiceId } = state;
  if (choiceId === "fossil") return <FossilScene progress={progress} />;
  if (choiceId === "nuclear") return <NuclearScene progress={progress} />;
  if (choiceId === "renewables") return <RenewablesScene progress={progress} />;
  return null;
}
