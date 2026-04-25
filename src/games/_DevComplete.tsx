/**
 * Developer-only "Complete" button that instantly wins the current game.
 *
 * Drop into any game like:
 *   <DevComplete onComplete={() => setWon(true)} />
 *
 * To remove from a game in production, just comment out the single line.
 */
export function DevComplete({ onComplete }: { onComplete: () => void }) {
  return (
    <button
      onClick={onComplete}
      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200
        text-rose-600 font-semibold text-xs transition-colors"
      title="Developer shortcut — instantly complete this puzzle"
    >
      🛠 Complete
    </button>
  );
}
