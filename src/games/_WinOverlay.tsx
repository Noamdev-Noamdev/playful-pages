import { useEffect, useState } from "react";

// ─── Confetti ─────────────────────────────────────────────────────────────────

const COLORS = [
  "#38bdf8",
  "#34d399",
  "#fb923c",
  "#a78bfa",
  "#f472b6",
  "#facc15",
  "#f87171",
  "#60a5fa",
  "#4ade80",
  "#c084fc",
  "#fdba74",
  "#67e8f9",
];

interface Piece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  w: number;
  h: number;
  circle: boolean;
  rx: number;
}

function makePieces(n = 90): Piece[] {
  return Array.from({ length: n }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2.5 + Math.random() * 2.5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    w: 6 + Math.random() * 7,
    h: 9 + Math.random() * 7,
    circle: Math.random() < 0.28,
    rx: (Math.random() - 0.5) * 130,
  }));
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WinOverlayProps {
  /** Whether the overlay is visible */
  show: boolean;
  /** Called when the player clicks "Play Again" or the backdrop */
  onPlayAgain: () => void;
  /** Main heading — defaults to "Puzzle Solved!" */
  message?: string;
  /** Optional sub-message */
  sub?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WinOverlay({
  show,
  onPlayAgain,
  message = "Puzzle Solved!",
  sub = "You cracked it — well done!",
}: WinOverlayProps) {
  const [pieces] = useState(makePieces);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) {
      setVisible(false);
      return;
    }
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, [show]);

  if (!show) return null;

  return (
    <div
      onClick={onPlayAgain}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(2,6,23,0.55)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.4s ease",
        pointerEvents: visible ? "all" : "none",
      }}
    >
      {/* ── Keyframes ── */}
      <style>{`
        @keyframes _wc_fall {
          0%   { transform: translateY(-60px) translateX(0) rotate(0deg); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(105vh) translateX(var(--rx)) rotate(560deg); opacity: 0; }
        }
        @keyframes _wc_pop {
          0%   { transform: scale(0.5) translateY(28px); opacity: 0; }
          62%  { transform: scale(1.06) translateY(-5px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes _wc_bob {
          0%,100% { transform: translateY(0) rotate(-6deg); }
          50%      { transform: translateY(-14px) rotate(6deg); }
        }
        ._wc_btn { transition: opacity 0.18s, transform 0.18s; }
        ._wc_btn:hover { opacity: 0.86; transform: translateY(-2px) scale(1.04); }
      `}</style>

      {/* ── Confetti pieces ── */}
      {pieces.map((p) => (
        <div
          key={p.id}
          style={
            {
              position: "fixed",
              left: `${p.left}%`,
              top: -30,
              width: p.circle ? p.w : p.w,
              height: p.circle ? p.w : p.h,
              borderRadius: p.circle ? "50%" : 2,
              background: p.color,
              "--rx": `${p.rx}px`,
              animation: `_wc_fall ${p.duration}s ${p.delay}s ease-in infinite`,
              willChange: "transform, opacity",
              pointerEvents: "none",
            } as React.CSSProperties
          }
        />
      ))}

      {/* ── Card ── */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          zIndex: 1,
          background: "white",
          borderRadius: "1.75rem",
          padding: "2.75rem 3rem",
          textAlign: "center",
          boxShadow: "0 32px 80px rgba(0,0,0,0.42)",
          maxWidth: 360,
          width: "90vw",
          animation: "_wc_pop 0.55s 0.1s both",
        }}
      >
        {/* Emoji */}
        <div
          style={{
            fontSize: "3.25rem",
            lineHeight: 1,
            marginBottom: "0.85rem",
            display: "inline-block",
            animation: "_wc_bob 1.9s ease-in-out infinite",
          }}
        >
          🎉
        </div>

        {/* Heading */}
        <h2
          style={{
            fontSize: "1.65rem",
            fontWeight: 800,
            color: "#0f172a",
            marginBottom: "0.4rem",
            letterSpacing: "-0.025em",
          }}
        >
          {message}
        </h2>

        {/* Sub */}
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginBottom: "1.85rem" }}>{sub}</p>

        {/* Button */}
        <button
          className="_wc_btn"
          onClick={onPlayAgain}
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)",
            color: "white",
            border: "none",
            borderRadius: "0.9rem",
            padding: "0.82rem 2.5rem",
            fontSize: "1rem",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 6px 24px rgba(99,102,241,0.38)",
            letterSpacing: "-0.01em",
          }}
        >
          Play Again ✨
        </button>

        <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "1rem" }}>
          or click anywhere to dismiss
        </p>
      </div>
    </div>
  );
}
