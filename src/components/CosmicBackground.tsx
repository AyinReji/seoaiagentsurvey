/**
 * CosmicBackground — Animated Starfield Background
 * ===================================================
 * Creates an immersive cosmic/space-themed background with:
 *   - Ambient gradient blobs that slowly drift (oklch colored)
 *   - 80 randomly placed twinkling star particles
 *   - 3 shooting star animations that traverse the viewport
 *   - Edge vignette overlay for depth
 *
 * PERFORMANCE:
 * - Stars and shooters are memoized with `useMemo` — only computed once
 * - All animations use CSS keyframes (not JS) for GPU-accelerated rendering
 * - `aria-hidden` and `pointer-events-none` ensure no accessibility overhead
 * - Fixed position with -z-10 places it behind all content
 *
 * CSS ANIMATIONS (defined in styles.css):
 *   @keyframes pulse   → star twinkling
 *   @keyframes shoot   → shooting star trajectory
 *   @keyframes drift   → ambient blob movement
 */

import { useEffect, useState } from "react";

export function CosmicBackground() {
  const [stars, setStars] = useState<Array<{ id: number, top: number, left: number, size: number, opacity: number, delay: number }>>([]);
  const [shooters, setShooters] = useState<Array<{ id: number, top: number, left: number, delay: number, duration: number }>>([]);

  // Generate random stars and shooters only on the client after mount
  // This prevents hydration mismatches between SSR and client
  useEffect(() => {
    setStars(
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 1.6 + 0.4,
        opacity: Math.random() * 0.6 + 0.2,
        delay: Math.random() * 6,
      }))
    );

    setShooters(
      Array.from({ length: 3 }, (_, i) => ({
        id: i,
        top: Math.random() * 60,
        left: -10,
        delay: i * 7 + Math.random() * 5,
        duration: 6 + Math.random() * 4,
      }))
    );
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      {/* Ambient gradient blobs — large, blurred, slowly drifting circles */}
      <div
        className="absolute -top-40 -left-40 h-[60vh] w-[60vh] rounded-full opacity-40 blur-3xl animate-drift"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.22 265 / 0.5), transparent 60%)" }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[55vh] w-[55vh] rounded-full opacity-30 blur-3xl animate-drift"
        style={{ background: "radial-gradient(circle, oklch(0.6 0.22 295 / 0.5), transparent 60%)", animationDelay: "-6s" }}
      />
      <div
        className="absolute bottom-0 left-1/4 h-[50vh] w-[50vh] rounded-full opacity-25 blur-3xl animate-drift"
        style={{ background: "radial-gradient(circle, oklch(0.7 0.16 210 / 0.5), transparent 60%)", animationDelay: "-12s" }}
      />

      {/* Twinkling star particles */}
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animation: `pulse 4s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      {/* Shooting stars — horizontal lines that traverse the viewport */}
      {shooters.map((s) => (
        <span
          key={s.id}
          className="absolute h-px w-24"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            background: "linear-gradient(90deg, transparent, white, transparent)",
            animation: `shoot ${s.duration}s linear ${s.delay}s infinite`,
            ["--ang" as string]: "-18deg",
          }}
        />
      ))}

      {/* Edge vignette — subtle darkening around viewport edges for depth */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 40%, oklch(0.03 0.01 270 / 0.6))" }} />
    </div>
  );
}
