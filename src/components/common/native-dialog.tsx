'use client';

import React, { useEffect, useRef, useCallback } from 'react';

export interface NativeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabelledBy?: string;
  ariaLabel?: string;
  className?: string;
  preventClose?: boolean;
}

export interface NativeDialogContextValue {
  inNativeDialog: boolean;
  dialogRef?: React.RefObject<HTMLDialogElement | null>;
}

export const NativeDialogContext = React.createContext<NativeDialogContextValue>({
  inNativeDialog: false,
});

export function useNativeDialog() {
  return React.useContext(NativeDialogContext);
}

/**
 * Modern Native Dialog Component following modern-web-guidance
 * Uses native <dialog> with showModal(), closedby="any", overscroll containment,
 * automatic focus handling, and progressive fallback for light-dismiss on all browsers.
 */
export function NativeDialog({
  isOpen,
  onClose,
  children,
  ariaLabelledBy,
  ariaLabel,
  className = '',
  preventClose = false,
}: NativeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleCancel = useCallback(
    (e: React.SyntheticEvent<HTMLDialogElement, Event>) => {
      if (preventClose) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      onClose();
    },
    [preventClose, onClose]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (preventClose) return;
      const dialog = dialogRef.current;
      if (!dialog || e.target !== dialog) return;

      const rect = dialog.getBoundingClientRect();
      const isInDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;

      if (!isInDialog) {
        onClose();
      }
    },
    [preventClose, onClose]
  );

  return (
    <NativeDialogContext.Provider value={{ inNativeDialog: true, dialogRef }}>
      <dialog
        ref={dialogRef}
        data-lenis-prevent
        onCancel={handleCancel}
        onClick={handleClick}
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        {...({ closedby: 'any' } as Record<string, string>)}
        className={`fixed m-auto p-0 bg-transparent border-none max-h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] outline-none overflow-visible backdrop:bg-slate-950/60 backdrop:backdrop-blur-xs ${className}`}
      >
        {isOpen ? children : null}
      </dialog>
    </NativeDialogContext.Provider>
  );
}

export default NativeDialog;
