"use client";

import { useEffect } from "react";

let lockCount = 0;
let originalOverflow = "";
let originalPaddingRight = "";

/**
 * Custom hook to lock body scrolling when a modal or dialog is open.
 * Supports reference counting for stacked/nested modals and prevents
 * layout shift caused by disappearing vertical scrollbars.
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked || typeof window === "undefined") return;

    if (lockCount === 0) {
      originalOverflow = document.body.style.overflow;
      originalPaddingRight = document.body.style.paddingRight;

      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
    }
    lockCount++;

    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      }
    };
  }, [isLocked]);
}

export default useScrollLock;
