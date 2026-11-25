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
      allowNestedScroll: true,
      prevent: (node) => {
        if (!(node instanceof HTMLElement)) return false;

        // 1. Explicit marker attribute
        if (node.hasAttribute("data-lenis-prevent")) return true;

        // 2. Modals, dialogs, popovers, dropdowns, and menus (Radix & Native)
        if (
          Boolean(
            node.closest(
              '[data-lenis-prevent], [data-radix-popper-content-wrapper], [data-slot="dropdown-menu-content"], [data-slot="dropdown-menu-sub-content"], dialog, [role="dialog"], [role="menu"], [role="listbox"], [role="combobox"]'
            )
          )
        ) {
          return true;
        }

        // 3. Any element or ancestor with scrollable overflow
        const scrollable = node.closest(
          '.overflow-y-auto, .overflow-y-scroll, .overflow-x-auto, .overflow-x-scroll, .overflow-auto, .overflow-scroll'
        );
        if (scrollable instanceof HTMLElement) {
          const hasScrollableY =
            scrollable.scrollHeight > scrollable.clientHeight;
          const hasScrollableX =
            scrollable.scrollWidth > scrollable.clientWidth;
          if (hasScrollableY || hasScrollableX) {
            return true;
          }
        }

        return false;
      },
    });

    return () => lenis.destroy();
  }, []);

  return null;
}
