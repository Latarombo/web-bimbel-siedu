'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ArrowLeft,
  Pause,
  Play,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Users,
  Smile,
  Heart,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface StorySlide {
  statusId: number;
  authorName: string;
  authorRoleOrClass?: string;
  avatarText?: string;
  avatarUrl?: string;
  timestampFormatted: string;
  text?: string;
  imageUrl?: string;
  isTextOnly: boolean;
  bgGradient?: string;
  recipientCount?: number;
}

interface WhatsAppStoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: StorySlide[];
  initialSlideIdx?: number;
  onDeleteStatus?: (statusId: number) => void;
  isViewerParent?: boolean;
}

const DEFAULT_BG = 'bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-900';
const SLIDE_DURATION_MS = 5000;

/**
 * WhatsApp Web / Desktop Full-Screen Story Viewer
 * Rujukan visual presisi: Screenshot 2026-11-24 132646.png
 */
export function WhatsAppStoryViewerModal({
  isOpen,
  onClose,
  slides,
  initialSlideIdx = 0,
  onDeleteStatus,
  isViewerParent = false,
}: WhatsAppStoryViewerModalProps) {
  const [currentIdx, setCurrentIdx] = useState(initialSlideIdx);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0); // 0..100 for current slide

  const progressRef = useRef(0);
  const animFrameId = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  // Sync initial slide index when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIdx(Math.min(Math.max(0, initialSlideIdx), Math.max(0, slides.length - 1)));
      setProgress(0);
      progressRef.current = 0;
      setIsPaused(false);
      lastTimeRef.current = null;
    }
  }, [isOpen, initialSlideIdx, slides.length]);

  const goToNextSlide = useCallback(() => {
    if (currentIdx < slides.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setProgress(0);
      progressRef.current = 0;
      lastTimeRef.current = null;
    } else {
      onClose();
    }
  }, [currentIdx, slides.length, onClose]);

  const goToPrevSlide = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
      setProgress(0);
      progressRef.current = 0;
      lastTimeRef.current = null;
    } else {
      setProgress(0);
      progressRef.current = 0;
    }
  }, [currentIdx]);

  // Keyboard navigation (Escape, Left, Right, Space)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft') {
        goToPrevSlide();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNextSlide, goToPrevSlide, onClose]);

  // Smooth story timer ticker (requestAnimationFrame)
  useEffect(() => {
    if (!isOpen || isPaused || slides.length === 0) {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      lastTimeRef.current = null;
      return;
    }

    const step = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      const increment = (delta / SLIDE_DURATION_MS) * 100;
      progressRef.current += increment;

      if (progressRef.current >= 100) {
        progressRef.current = 0;
        goToNextSlide();
      } else {
        setProgress(progressRef.current);
        animFrameId.current = requestAnimationFrame(step);
      }
    };

    animFrameId.current = requestAnimationFrame(step);

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [isOpen, isPaused, currentIdx, slides.length, goToNextSlide]);

  if (!isOpen || slides.length === 0) return null;

  const currentSlide = slides[currentIdx] || slides[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none overflow-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* Background Canvas (Colored for text status, dark for photo status) */}
      <div
        className={`relative flex flex-col justify-between w-full h-full max-w-4xl mx-auto ${
          currentSlide.isTextOnly
            ? currentSlide.bgGradient || DEFAULT_BG
            : 'bg-black'
        } transition-colors duration-300`}
      >
        {/* ======================================================================= */}
        {/* TOP BAR: BACK ARROW, SEGMENTED TIMERS, CONTACT INFO, ACTIONS, CLOSE     */}
        {/* ======================================================================= */}
        <header className="z-30 pt-3 px-4 sm:px-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* 1. Segmented Progress Bar (Direct match to Screenshot) */}
          <div className="flex items-center gap-1.5 max-w-2xl mx-auto mb-3">
            {slides.map((_, idx) => {
              const isFilled = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div
                  key={idx}
                  className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
                >
                  <div
                    className="h-full bg-white transition-all ease-linear"
                    style={{
                      width: isFilled ? '100%' : isCurrent ? `${progress}%` : '0%',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* 2. Top Controls Row */}
          <div className="flex items-center justify-between">
            {/* Left: Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Kembali"
              aria-label="Kembali"
            >
              <ArrowLeft className="size-5" />
            </button>

            {/* Center: Author Avatar, Name, and Humanized Time */}
            <div className="flex items-center gap-3 min-w-0 mx-2">
              <div className="size-10 rounded-full overflow-hidden bg-slate-900 border border-white/20 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                {currentSlide.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentSlide.avatarUrl}
                    alt={currentSlide.authorName}
                    className="size-full object-cover"
                  />
                ) : (
                  <span>{currentSlide.avatarText || 'GU'}</span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-white truncate">
                    {currentSlide.authorName}
                  </span>
                  {currentSlide.authorRoleOrClass && (
                    <span className="hidden sm:inline text-xs text-white/75 truncate">
                      · {currentSlide.authorRoleOrClass}
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-white/80">
                  {currentSlide.timestampFormatted}
                </p>
              </div>
            </div>

            {/* Right: Pause/Play, Delete (for teacher), Close button */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className="grid size-9 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isPaused ? 'Lanjutkan (Spasi)' : 'Jeda (Spasi)'}
                aria-label={isPaused ? 'Lanjutkan status' : 'Jeda status'}
              >
                {isPaused ? <Play className="size-4.5" /> : <Pause className="size-4.5" />}
              </button>

              {onDeleteStatus && (
                <button
                  type="button"
                  onClick={() => {
                    setIsPaused(true);
                    onDeleteStatus(currentSlide.statusId);
                  }}
                  className="grid size-9 place-items-center rounded-full text-white/90 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Hapus status ini"
                  aria-label="Hapus status ini"
                >
                  <Trash2 className="size-4.5" />
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Tutup (Esc)"
                aria-label="Tutup penampil status"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>
        </header>

        {/* ======================================================================= */}
        {/* CENTER CONTENT: TEXT OR PHOTO WITH TAP NAVIGATION                       */}
        {/* ======================================================================= */}
        <main className="relative flex-1 flex items-center justify-center px-4 sm:px-12 my-auto select-none overflow-hidden">
          {/* Click Left zone (Previous) */}
          <div
            onClick={goToPrevSlide}
            className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-pointer"
            aria-label="Slide sebelumnya"
          />

          {/* Click Right zone (Next) */}
          <div
            onClick={goToNextSlide}
            className="absolute right-0 inset-y-0 w-2/3 z-20 cursor-pointer"
            aria-label="Slide berikutnya"
          />

          {/* Desktop Hover Arrows */}
          {currentIdx > 0 && (
            <button
              type="button"
              onClick={goToPrevSlide}
              className="hidden md:grid absolute left-6 z-30 size-11 place-items-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Sebelumnya"
            >
              <ChevronLeft className="size-6" />
            </button>
          )}

          {currentIdx < slides.length - 1 && (
            <button
              type="button"
              onClick={goToNextSlide}
              className="hidden md:grid absolute right-6 z-30 size-11 place-items-center rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-xs transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Berikutnya"
            >
              <ChevronRight className="size-6" />
            </button>
          )}

          {/* Slide Body: Text Status vs Photo Status */}
          {currentSlide.isTextOnly ? (
            <div className="max-w-2xl text-center px-4 py-8 z-10 pointer-events-none">
              <p className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white leading-tight sm:leading-snug tracking-tight drop-shadow-md">
                {currentSlide.text}
              </p>
            </div>
          ) : (
            <div className="relative size-full flex items-center justify-center z-10 pointer-events-none">
              {currentSlide.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentSlide.imageUrl}
                  alt={currentSlide.text || 'Dokumentasi pembelajaran'}
                  className="max-h-[70vh] sm:max-h-[75vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
                />
              ) : null}
            </div>
          )}
        </main>

        {/* ======================================================================= */}
        {/* BOTTOM BAR: CAPTION OVERLAY OR REPLY BAR (Matching Screenshot)          */}
        {/* ======================================================================= */}
        <footer className="z-30 pb-6 px-4 sm:px-8 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          {/* Caption Text (if photo slide has caption) */}
          {!currentSlide.isTextOnly && currentSlide.text && (
            <div className="max-w-2xl mx-auto mb-3 text-center">
              <p className="text-sm sm:text-base font-medium text-white/95 drop-shadow-md leading-relaxed px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl inline-block">
                {currentSlide.text}
              </p>
            </div>
          )}

          {/* Bottom Reply Bar for Parent / Audience info for Teacher */}
          <div className="max-w-2xl mx-auto">
            {isViewerParent ? (
              // WhatsApp Reply Bar (Direct match to Screenshot)
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-full text-white/70 hover:text-white transition-colors"
                  title="Emoji"
                >
                  <Smile className="size-6" />
                </button>
                <div className="flex-1 flex items-center h-11 px-4 rounded-full bg-white/20 text-white/70 text-xs sm:text-sm backdrop-blur-md border border-white/10">
                  <span>Ketik balasan...</span>
                </div>
                <button
                  type="button"
                  className="grid size-10 place-items-center rounded-full text-white/70 hover:text-rose-400 transition-colors"
                  title="Sukai"
                >
                  <Heart className="size-6" />
                </button>
              </div>
            ) : (
              // Teacher Footer Note (Audience count)
              <div className="flex items-center justify-between text-xs text-white/75 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
                <span className="flex items-center gap-2">
                  <Users className="size-4 text-emerald-400" />
                  <span>
                    {currentSlide.recipientCount
                      ? `Dikirim ke ${currentSlide.recipientCount} murid terdaftar`
                      : 'Status kegiatan kelas'}
                  </span>
                </span>
                <span className="text-[11px] font-medium text-white/60">
                  Slide {currentIdx + 1} dari {slides.length}
                </span>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default WhatsAppStoryViewerModal;
