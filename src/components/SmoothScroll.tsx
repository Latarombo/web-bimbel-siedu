"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Runs Lenis only in the browser so the surrounding layouts can remain
 * Server Components. Lenis keeps reduced-motion users on native-feeling
 * scrolling while preserving keyboard and touch input.
 */
export default function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      anchors: true,
      smoothWheel: true,
      respectReducedMotion: true,
    });

    return () => lenis.destroy();
  }, []);

  return null;
}
