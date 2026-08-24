/**
 * Lightweight, privacy-first analytics tracker for Playpile.
 *
 * - No cookies, no localStorage, no fingerprinting
 * - SPA-aware: patches pushState/replaceState and listens to popstate
 * - Tracks time-on-page via sendBeacon on visibilitychange/pagehide
 * - Respects Do Not Track (DNT)
 * - Excludes /admin/ pages from tracking
 * - ~1.5KB minified
 */

const COLLECT_ENDPOINT = "/api/analytics/collect";

let initialized = false;
let currentUrl = "";
let pageEntryTime = 0;

/** Check if tracking should be disabled */
function shouldSkip(): boolean {
  // Respect Do Not Track
  if (navigator.doNotTrack === "1") return true;

  // Skip admin pages
  if (location.pathname.startsWith("/admin/")) return true;

  // Skip during SSR
  if (typeof window === "undefined") return true;

  // Skip bots
  if (/bot|crawl|spider|slurp|lighthouse/i.test(navigator.userAgent)) return true;

  return false;
}

/** Send a pageview event to the collect endpoint */
function trackPageview(timeOnPage = 0): void {
  if (shouldSkip()) return;

  const payload = {
    url: location.href,
    referrer: document.referrer,
    screenWidth: window.screen.width,
    timeOnPage,
  };

  // Use sendBeacon for reliability (works during page unload)
  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  const sent = navigator.sendBeacon(COLLECT_ENDPOINT, blob);

  // Fallback to fetch with keepalive if sendBeacon fails
  if (!sent) {
    fetch(COLLECT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Silently fail — analytics should never break the app
    });
  }
}

/** Send time-on-page for the current page before navigating away */
function sendTimeOnPage(): void {
  if (shouldSkip() || !currentUrl || pageEntryTime === 0) return;

  const elapsed = Math.round((performance.now() - pageEntryTime) / 1000);
  // Cap at 1 hour to filter out idle tabs
  const timeOnPage = Math.min(elapsed, 3600);

  if (timeOnPage < 1) return;

  const payload = {
    url: currentUrl,
    referrer: "",
    screenWidth: window.screen.width,
    timeOnPage,
  };

  const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
  navigator.sendBeacon(COLLECT_ENDPOINT, blob);
}

/** Handle a new page navigation */
function onPageChange(): void {
  const newUrl = location.href;

  // Don't double-track the same URL
  if (newUrl === currentUrl) return;

  // Send time-on-page for the previous page
  if (currentUrl) {
    sendTimeOnPage();
  }

  // Track the new pageview
  currentUrl = newUrl;
  pageEntryTime = performance.now();
  trackPageview(0);
}

/** Patch history methods to detect SPA navigations */
function patchHistory(): void {
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    // Use setTimeout to let the router finish updating the URL
    setTimeout(onPageChange, 0);
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    setTimeout(onPageChange, 0);
  };
}

/**
 * Initialize the analytics tracker.
 * Call once from the root component's useEffect.
 */
export function initTracker(): void {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (shouldSkip()) return;

  initialized = true;

  // Patch history for SPA navigation detection
  patchHistory();

  // Listen for browser back/forward
  window.addEventListener("popstate", () => {
    setTimeout(onPageChange, 0);
  });

  // Send time-on-page when tab becomes hidden
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      sendTimeOnPage();
    }
  });

  // Send time-on-page on page unload (mobile Safari fallback)
  window.addEventListener("pagehide", () => {
    sendTimeOnPage();
  });

  // Track the initial pageview
  onPageChange();
}
