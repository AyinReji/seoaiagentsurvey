/**
 * useIsMobile — Responsive Breakpoint Hook
 * ==========================================
 * Returns `true` when the viewport width is below 768px (mobile).
 * Uses the native `matchMedia` API for efficient breakpoint detection.
 *
 * NOTE: Returns `false` during SSR and on initial render (before useEffect).
 * If you need SSR-safe mobile detection, consider user-agent parsing instead.
 *
 * Usage:
 *   const isMobile = useIsMobile();
 *   return isMobile ? <MobileLayout /> : <DesktopLayout />;
 */

import * as React from "react";

/** Breakpoint threshold in pixels — matches Tailwind's `md` breakpoint */
const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
