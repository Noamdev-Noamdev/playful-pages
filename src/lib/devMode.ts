// Dev mode toggle.
//
// Enabled by running `npm run dev:unlock` (sets VITE_DEV_MODE=true at build
// time), or at runtime by setting `localStorage.playpile:devMode = "1"` in the
// browser console.
//
// When enabled:
//  - Every authored level — including future-dated ones — is playable from the archive.
//  - The "one play per day" lock is bypassed so you can replay today's daily.

export function isDevMode(): boolean {
  if (import.meta.env.VITE_DEV_MODE === "true") return true;
  if (typeof window !== "undefined") {
    try {
      return localStorage.getItem("playpile:devMode") === "1";
    } catch {
      /* ignore */
    }
  }
  return false;
}
