'use client';

import { useState, useEffect, useRef, useCallback, useTransition } from 'react';
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
  Eye,
  Plus,
  MoreVertical,
  Download,
  Loader2,
} from 'lucide-react';
import {
  catatStatusDilihat,
  getStatusViewers,
  type StatusViewerItem,
} from '@/app/actions/teacher';
import { formatWhatsAppTime } from '@/lib/whatsapp-time';

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
  viewCount?: number;
}

interface WhatsAppStoryViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  slides: StorySlide[];
  initialSlideIdx?: number;
  onDeleteStatus?: (statusId: number) => void;
  onSlideViewed?: (statusId: number) => void;
  isViewerParent?: boolean;
}

const DEFAULT_BG = 'bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-900';
const SLIDE_DURATION_MS = 5000;

/**
 * WhatsApp Web Fullscreen Story Player
 * Rujukan visual presisi: Screenshot 2026-11-24 203846.png
 */
export function WhatsAppStoryViewerModal({
  isOpen,
  onClose,
  slides,
  initialSlideIdx = 0,
  onDeleteStatus,
  onSlideViewed,
  isViewerParent = false,
}: WhatsAppStoryViewerModalProps) {
  const [currentIdx, setCurrentIdx] = useState(initialSlideIdx);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Viewers state
  const [isViewersOpen, setIsViewersOpen] = useState(false);
  const [viewersList, setViewersList] = useState<StatusViewerItem[]>([]);
  const [isLoadingViewers, setIsLoadingViewers] = useState(false);
  const [liveViewCount, setLiveViewCount] = useState<number>(0);

  const currentSlide = slides[currentIdx] || slides[0];

  // Sync initial slide index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = Math.min(Math.max(0, initialSlideIdx), Math.max(0, slides.length - 1));
      setCurrentIdx(idx);
      setIsPaused(false);
      setIsViewersOpen(false);
      setShowMenu(false);
      setLiveViewCount(slides[idx]?.viewCount ?? 0);
    }
  }, [isOpen, initialSlideIdx, slides]);

  // Update live view count when current slide changes
  useEffect(() => {
    if (currentSlide) {
      setLiveViewCount(currentSlide.viewCount ?? 0);
      setIsViewersOpen(false);
      setShowMenu(false);
    }
  }, [currentSlide]);

  // Automatic view tracking & onSlideViewed trigger
  useEffect(() => {
    if (isOpen && currentSlide?.statusId) {
      onSlideViewed?.(currentSlide.statusId);
      if (isViewerParent) {
        catatStatusDilihat(currentSlide.statusId).catch((err) => {
          console.error('Gagal mencatat status dilihat:', err);
        });
      }
    }
  }, [isOpen, currentSlide?.statusId, isViewerParent, onSlideViewed]);

  const goToNextSlide = useCallback(() => {
    if (currentIdx < slides.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setIsViewersOpen(false);
    } else {
      onClose();
    }
  }, [currentIdx, slides.length, onClose]);

  const goToPrevSlide = useCallback(() => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
      setIsViewersOpen(false);
    }
  }, [currentIdx]);

  // Keyboard navigation (Escape, Left, Right, Space, M)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isViewersOpen) {
          setIsViewersOpen(false);
        } else {
          onClose();
        }
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
  }, [isOpen, goToNextSlide, goToPrevSlide, onClose, isViewersOpen]);

  // Handler load viewers list
  const handleOpenViewers = async () => {
    if (!currentSlide?.statusId) return;
    setIsPaused(true);
    setIsViewersOpen(true);
    setIsLoadingViewers(true);
    try {
      const res = await getStatusViewers(currentSlide.statusId);
      if (res.viewers) {
        setViewersList(res.viewers);
        setLiveViewCount(res.viewers.length);
      }
    } catch (err) {
      console.error('Gagal memuat penonton status:', err);
    } finally {
      setIsLoadingViewers(false);
    }
  };

  // Handler unduh foto aktif
  const handleDownloadActivePhoto = () => {
    if (!currentSlide?.imageUrl) return;
    const a = document.createElement('a');
    a.href = currentSlide.imageUrl;
    a.download = `siedu-status-${currentSlide.statusId}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen || slides.length === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 select-none overflow-hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      {/* ======================================================================= */}
      {/* 1. AMBIENT BLURRED BACKDROP BLEED (Direct match to Screenshot 2026-11-24 203846.png) */}
      {/* ======================================================================= */}
      {currentSlide.imageUrl ? (
        <div
          className="absolute inset-0 size-full pointer-events-none overflow-hidden select-none"
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentSlide.imageUrl}
            alt=""
            className="size-full object-cover scale-125 blur-3xl opacity-35"
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ) : currentSlide.isTextOnly ? (
        <div
          className="absolute inset-0 size-full pointer-events-none overflow-hidden select-none"
          aria-hidden="true"
        >
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[85vw] max-w-4xl h-[85vh] max-h-[850px] rounded-full blur-[110px] opacity-45 transition-all duration-700 ease-out"
            style={{
              background: currentSlide.bgGradient || DEFAULT_BG,
            }}
          />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      ) : null}

      {/* ======================================================================= */}
      {/* 2. OUTSIDE CONTROLS: TOP-LEFT BACK ARROW (←) & TOP-RIGHT CLOSE (✕)      */}
      {/* ======================================================================= */}
      {/* Pojok Kiri Atas Viewport Luar Card: Tombol Panah Kembali (←) */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-3 left-4 sm:top-4 sm:left-6 z-50 grid size-10 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        title="Kembali"
        aria-label="Kembali"
      >
        <ArrowLeft className="size-6" />
      </button>

      {/* Pojok Kanan Atas Viewport Luar Card: Tombol Silang Tutup (✕) */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-3 right-4 sm:top-4 sm:right-6 z-50 grid size-10 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        title="Tutup (Esc)"
        aria-label="Tutup penampil status"
      >
        <X className="size-6" />
      </button>

      {/* ======================================================================= */}
      {/* 3. DESKTOP FLOATING NAVIGATION ARROWS (Left < and Right >)              */}
      {/* ======================================================================= */}
      {currentIdx > 0 ? (
        <button
          type="button"
          onClick={goToPrevSlide}
          className="hidden md:grid absolute left-6 z-40 size-11 place-items-center rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          title="Status sebelumnya"
          aria-label="Status sebelumnya"
        >
          <ChevronLeft className="size-6" />
        </button>
      ) : null}

      {currentIdx < slides.length - 1 ? (
        <button
          type="button"
          onClick={goToNextSlide}
          className="hidden md:grid absolute right-6 z-40 size-11 place-items-center rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          title="Status berikutnya"
          aria-label="Status berikutnya"
        >
          <ChevronRight className="size-6" />
        </button>
      ) : null}

      {/* ======================================================================= */}
      {/* 4. CENTRAL STORY CARD CONTAINER                                         */}
      {/* ======================================================================= */}
      <div
        className={`relative flex flex-col justify-between w-full h-full max-w-2xl mx-auto z-10 ${
          currentSlide.isTextOnly && !currentSlide.bgGradient?.includes('(') && !currentSlide.bgGradient?.startsWith('#')
            ? currentSlide.bgGradient || DEFAULT_BG
            : currentSlide.isTextOnly
            ? ''
            : 'bg-black/80'
        } transition-colors duration-300 shadow-2xl`}
        style={
          currentSlide.isTextOnly && currentSlide.bgGradient
            ? { background: currentSlide.bgGradient }
            : undefined
        }
      >
        {/* --------------------------------------------------------------------- */}
        {/* TOP BAR: SEGMENTED TIMERS, CONTACT INFO DI KIRI, ACTIONS DI KANAN     */}
        {/* --------------------------------------------------------------------- */}
        <header className="z-30 pt-3 px-4 sm:px-6 bg-gradient-to-b from-black/85 via-black/45 to-transparent shrink-0">
          {/* Keyframe Animation Style untuk pergerakan halus bar progress putih */}
          <style>{`
            @keyframes storyProgressBarAnimation {
              0% {
                width: 0%;
              }
              100% {
                width: 100%;
              }
            }
          `}</style>

          {/* Segmented Progress Bar (Direct match to Screenshot) */}
          <div className="flex items-center gap-1.5 w-full mx-auto mb-3">
            {slides.map((_, idx) => {
              const isFilled = idx < currentIdx;
              const isCurrent = idx === currentIdx;
              return (
                <div
                  key={idx}
                  className="h-1 flex-1 rounded-full bg-white/30 overflow-hidden"
                >
                  <div
                    key={`story-bar-${currentIdx}-${idx}`}
                    className="h-full bg-white rounded-full"
                    style={{
                      width: isFilled ? '100%' : isCurrent ? '100%' : '0%',
                      animation: isCurrent
                        ? `storyProgressBarAnimation ${SLIDE_DURATION_MS}ms linear forwards`
                        : 'none',
                      animationPlayState: isPaused || isViewersOpen ? 'paused' : 'running',
                    }}
                    onAnimationEnd={() => {
                      if (isCurrent && !isPaused && !isViewersOpen) {
                        goToNextSlide();
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Top Controls Row: Info Profil di KIRI, Kontrol Player di KANAN */}
          <div className="flex items-center justify-between">
            {/* SISI KIRI: Profile Avatar, Nama, Waktu Publikasi */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar dengan WhatsApp Green + Badge */}
              <div className="relative shrink-0">
                <div className="size-10 rounded-full overflow-hidden bg-slate-800 border border-white/20 flex items-center justify-center text-white font-bold text-xs shadow-sm">
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
                {!isViewerParent ? (
                  <span className="absolute -bottom-0.5 -right-0.5 grid size-3.5 place-items-center rounded-full bg-[#00a884] text-white border-2 border-[#111b21] shadow-xs">
                    <Plus className="size-2.5 stroke-[3]" />
                  </span>
                ) : null}
              </div>

              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-white truncate">
                    {!isViewerParent ? 'Anda' : currentSlide.authorName}
                  </span>
                  {currentSlide.authorRoleOrClass ? (
                    <span className="hidden sm:inline text-xs text-white/75 truncate">
                      · {currentSlide.authorRoleOrClass}
                    </span>
                  ) : null}
                </div>
                <p className="text-[11px] sm:text-xs text-white/80">
                  {currentSlide.timestampFormatted}
                </p>
              </div>
            </div>

            {/* SISI KANAN: Pause/Play, Mute/Unmute, Three Dots Menu */}
            <div className="flex items-center gap-1 sm:gap-2 relative shrink-0">
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className="grid size-9 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isPaused ? 'Lanjutkan (Spasi)' : 'Jeda (Spasi)'}
                aria-label={isPaused ? 'Lanjutkan status' : 'Jeda status'}
              >
                {isPaused ? <Play className="size-4.5" /> : <Pause className="size-4.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsMuted((prev) => !prev)}
                className="grid size-9 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title={isMuted ? 'Nyalakan suara' : 'Bisukan suara'}
                aria-label="Bisukan suara"
              >
                {isMuted ? <VolumeX className="size-4.5" /> : <Volume2 className="size-4.5" />}
              </button>

              {/* Three Dots More Menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowMenu((prev) => !prev)}
                  className="grid size-9 place-items-center rounded-full text-white/90 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Menu lainnya"
                  aria-label="Menu lainnya"
                >
                  <MoreVertical className="size-4.5" />
                </button>

                {showMenu ? (
                  <div className="absolute right-0 top-full mt-1.5 w-48 rounded-xl bg-[#111b21] border border-[#2a3942] p-1 shadow-2xl z-50 text-xs">
                    {currentSlide.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          handleDownloadActivePhoto();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-200 hover:bg-[#202c33] transition-colors cursor-pointer"
                      >
                        <Download className="size-4 text-[#8696a0]" />
                        <span>Unduh Foto</span>
                      </button>
                    ) : null}

                    {onDeleteStatus && !isViewerParent ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          setIsPaused(true);
                          onDeleteStatus(currentSlide.statusId);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="size-4 text-rose-400" />
                        <span>Hapus Status</span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </header>

        {/* --------------------------------------------------------------------- */}
        {/* CENTER CONTENT: PHOTO OR TEXT WITH TAP NAVIGATION                     */}
        {/* --------------------------------------------------------------------- */}
        <main className="relative flex-1 flex items-center justify-center px-4 my-auto select-none overflow-hidden">
          {/* Click Left zone (Previous slide) */}
          <div
            onClick={goToPrevSlide}
            className="absolute left-0 inset-y-0 w-1/3 z-20 cursor-pointer"
            aria-label="Slide sebelumnya"
          />

          {/* Click Right zone (Next slide) */}
          <div
            onClick={goToNextSlide}
            className="absolute right-0 inset-y-0 w-2/3 z-20 cursor-pointer"
            aria-label="Slide berikutnya"
          />

          {/* Slide Body: Text Status vs Photo Status */}
          {currentSlide.isTextOnly ? (
            <div className="max-w-xl text-center px-6 py-8 z-10 pointer-events-none">
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
                  className="max-h-[75vh] w-auto max-w-full object-contain rounded-sm shadow-2xl"
                />
              ) : null}
            </div>
          )}
        </main>

        {/* --------------------------------------------------------------------- */}
        {/* BOTTOM BAR: CAPTION & EYE VIEW COUNT (Direct match to Screenshot)     */}
        {/* --------------------------------------------------------------------- */}
        <footer className="z-30 pb-6 px-4 bg-gradient-to-t from-black/95 via-black/55 to-transparent shrink-0">
          {/* Caption Text: Clean typography murni langsung di atas foto tanpa pill/card */}
          {!currentSlide.isTextOnly && currentSlide.text ? (
            <div className="max-w-xl mx-auto mb-3 text-center pointer-events-none px-4">
              <p className="text-sm sm:text-base font-normal text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] leading-relaxed">
                {currentSlide.text}
              </p>
            </div>
          ) : null}

          {/* Bottom Control Row */}
          <div className="max-w-xl mx-auto flex items-center justify-center">
            {isViewerParent ? (
              // WhatsApp Reply Bar for Parents
              <div className="w-full flex items-center gap-3">
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
              // WhatsApp Eye View Indicator for Teacher (Direct match: 👁 0)
              <button
                type="button"
                onClick={handleOpenViewers}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/55 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold border border-white/15 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
                title="Klik untuk melihat siapa saja yang telah membuka status ini"
              >
                <Eye className="size-4 text-white/90" />
                <span className="tabular-nums font-bold">{liveViewCount}</span>
              </button>
            )}
          </div>
        </footer>

        {/* --------------------------------------------------------------------- */}
        {/* VIEWERS SHEET / MODAL (Muncul saat tombol mata 👁 diklik oleh Guru)   */}
        {/* --------------------------------------------------------------------- */}
        {isViewersOpen ? (
          <div className="absolute inset-x-0 bottom-0 z-50 rounded-t-2xl bg-[#111b21] border-t border-[#2a3942] p-4 text-white shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[50vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a3942] shrink-0">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2 text-white">
                  <Eye className="size-4 text-[#00a884]" />
                  <span>Dilihat oleh {viewersList.length}</span>
                </h3>
                <p className="text-[11px] text-[#8696a0] mt-0.5">
                  Wali murid yang telah membuka status kegiatan ini
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsViewersOpen(false)}
                className="grid size-8 place-items-center rounded-full hover:bg-white/10 text-[#8696a0] hover:text-white transition-colors cursor-pointer"
                title="Tutup daftar penonton"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#202c33] py-2">
              {isLoadingViewers ? (
                <div className="py-8 flex flex-col items-center justify-center text-[#8696a0]">
                  <Loader2 className="size-6 animate-spin text-[#00a884] mb-2" />
                  <span className="text-xs">Memuat penonton status...</span>
                </div>
              ) : viewersList.length === 0 ? (
                <div className="py-8 text-center text-[#8696a0] text-xs">
                  <p>Belum ada yang melihat status ini.</p>
                </div>
              ) : (
                viewersList.map((viewer) => (
                  <div
                    key={viewer.userId}
                    className="flex items-center justify-between py-2.5 px-1"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-8 rounded-full bg-[#202c33] border border-[#2a3942] flex items-center justify-center text-xs font-bold text-[#00a884] shrink-0">
                        {viewer.userName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {viewer.userName}
                        </p>
                        <p className="text-[10px] text-[#8696a0]">
                          {viewer.role === 'orang_tua' ? 'Wali Siswa' : viewer.role}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] text-[#8696a0] shrink-0 tabular-nums">
                      {formatWhatsAppTime(viewer.viewedAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default WhatsAppStoryViewerModal;
