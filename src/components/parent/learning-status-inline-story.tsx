'use client';

import { useState, useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  X,
  Camera,
  FileText,
  Sparkles,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { laporkanFotoStatus } from '@/app/actions/teacher';

export interface LearningStatusItem {
  id: number;
  kelasId: number;
  kelasNama: string;
  guruNama?: string;
  kontenTeks: string;
  mediaUrls: string[];
  diterbitkanPada: string;
}

interface Props {
  statuses: LearningStatusItem[];
}

export function LearningStatusInlineStory({ statuses }: Props) {
  const t = useTranslations('parent');
  const locale = useLocale();
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [activeMediaIdx, setActiveMediaIdx] = useState(0);
  const [reportingStatusId, setReportingStatusId] = useState<number | null>(null);
  const [alasan, setAlasan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [reportSuccess, setReportSuccess] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // If there are no statuses (Subtle & Compact Light Card - Seesaw / ClassDojo style)
  if (statuses.length === 0) {
    return (
      <div className="flex items-start gap-3.5 sm:gap-4 rounded-2xl border border-blue-100/80 bg-blue-50/70 p-4 sm:p-5 shadow-2xs transition-colors">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-blue-100 text-brand shadow-2xs">
          <Camera className="h-5 w-5 text-brand" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-slate-900">
              {t("noStoriesTitle")}
            </h4>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-100 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t("autoUpdateBadge")}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">
            {t("noStatusFeed")} {t("noStoriesDesc")}
          </p>
        </div>
      </div>
    );
  }

  const currentStatus = statuses[activeStoryIdx] || statuses[0];
  const mediaList = currentStatus.mediaUrls || [];
  const currentMediaUrl = mediaList[activeMediaIdx];

  const handlePrevMedia = () => {
    if (activeMediaIdx > 0) {
      setActiveMediaIdx(activeMediaIdx - 1);
    } else if (activeStoryIdx > 0) {
      const prevStoryIdx = activeStoryIdx - 1;
      setActiveStoryIdx(prevStoryIdx);
      const prevMediaCount = statuses[prevStoryIdx].mediaUrls?.length || 0;
      setActiveMediaIdx(Math.max(0, prevMediaCount - 1));
    }
  };

  const handleNextMedia = () => {
    if (activeMediaIdx < mediaList.length - 1) {
      setActiveMediaIdx(activeMediaIdx + 1);
    } else if (activeStoryIdx < statuses.length - 1) {
      setActiveStoryIdx(activeStoryIdx + 1);
      setActiveMediaIdx(0);
    }
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingStatusId || !alasan.trim()) return;

    startTransition(async () => {
      setReportError(null);
      const res = await laporkanFotoStatus({
        statusId: reportingStatusId,
        alasan: alasan.trim(),
        catatan: catatan.trim(),
      });

      if (res.error) {
        setReportError(res.error);
      } else {
        setReportSuccess(t('reportSuccess'));
        setTimeout(() => {
          setReportingStatusId(null);
          setAlasan('');
          setCatatan('');
          setReportSuccess(null);
        }, 2000);
      }
    });
  };

  const timeFormatted = new Date(currentStatus.diterbitkanPada).toLocaleDateString(
    locale === "en" ? "en-US" : "id-ID",
    {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  );

  return (
    <div className="space-y-3">
      {/* Horizontal Story Selector (WhatsApp / IG Avatar Rings) if > 1 status */}
      {statuses.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statuses.map((item, idx) => {
            const isSelected = idx === activeStoryIdx;
            const hasPhotos = item.mediaUrls && item.mediaUrls.length > 0;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveStoryIdx(idx);
                  setActiveMediaIdx(0);
                }}
                className={`group flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/80 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-white transition-transform ${
                    isSelected
                      ? 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 ring-2 ring-indigo-400 ring-offset-1'
                      : 'bg-slate-400 group-hover:bg-slate-500'
                  }`}
                >
                  {hasPhotos ? (
                    <Camera className="h-3.5 w-3.5" />
                  ) : (
                    <FileText className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="text-left">
                  <p
                    className={`text-xs font-semibold leading-none ${
                      isSelected ? 'text-indigo-950' : 'text-slate-700'
                    }`}
                  >
                    {item.kelasNama}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Inline Story Frame (WA/IG Status Container) */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm ring-1 ring-slate-900/10">
        {/* Top Story Progress Bars (Segmented lines like IG / WhatsApp) */}
        {mediaList.length > 1 && (
          <div className="absolute top-0 inset-x-0 z-20 flex gap-1 px-3 pt-2.5">
            {mediaList.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 overflow-hidden rounded-full bg-white/25 transition-all"
              >
                <div
                  className={`h-full bg-white transition-all duration-300 ${
                    i === activeMediaIdx
                      ? 'w-full'
                      : i < activeMediaIdx
                        ? 'w-full opacity-60'
                        : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>
        )}

        {/* Top Header: Teacher Avatar + Class + Timestamp + Report button */}
        <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent px-4 pb-6 pt-5">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Story Avatar Ring */}
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-400 via-teal-400 to-indigo-500 p-[2px]">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                {currentStatus.guruNama
                  ? currentStatus.guruNama.slice(0, 2).toUpperCase()
                  : 'GS'}
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-xs font-semibold text-white">
                  {currentStatus.kelasNama}
                </span>
                {currentStatus.guruNama && (
                  <span className="hidden sm:inline text-xs text-white/70">
                    · {currentStatus.guruNama}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/60 flex items-center gap-1">
                <Clock className="h-3 w-3 inline" />
                {timeFormatted}
              </p>
            </div>
          </div>

          {/* Report Button */}
          {mediaList.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setReportingStatusId(
                  reportingStatusId === currentStatus.id ? null : currentStatus.id,
                )
              }
              className="flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] text-white/75 backdrop-blur-xs transition-colors hover:bg-black/60 hover:text-white"
              title={t('reportPhoto')}
            >
              <Flag className="h-3 w-3" />
              <span className="hidden sm:inline">{t('reportPhoto')}</span>
            </button>
          )}
        </div>

        {/* Main Canvas: Image or WhatsApp Text Status */}
        <div className="relative flex aspect-[16/10] sm:aspect-[16/9] min-h-[380px] sm:min-h-[460px] max-h-[540px] w-full items-center justify-center overflow-hidden bg-slate-900">
          {currentMediaUrl ? (
            // Photo Status
            currentMediaUrl.startsWith('http') ||
            currentMediaUrl.startsWith('/') ||
            currentMediaUrl.startsWith('data:') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentMediaUrl}
                alt={currentStatus.kontenTeks || t("activityDocsAlt")}
                className="h-full w-full object-cover select-none"
              />
            ) : (
              // If placeholder string or token
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 text-white backdrop-blur-md ring-8 ring-white/5">
                  <Camera className="h-10 w-10 text-teal-300" />
                </div>
                <p className="mt-4 text-base font-semibold text-white/95">
                  {t("sessionPhotoDocs")}
                </p>
                <p className="mt-1 text-xs text-white/60">{currentMediaUrl}</p>
              </div>
            )
          ) : (
            // WhatsApp-style Text Story (Colorful Gradient)
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-700 via-purple-700 to-teal-700 p-8 text-center select-none">
              <p className="max-w-md text-base sm:text-lg font-medium leading-relaxed text-white drop-shadow-xs">
                &ldquo;{currentStatus.kontenTeks}&rdquo;
              </p>
            </div>
          )}

          {/* Inline Navigation Zones & Arrows */}
          {(mediaList.length > 1 || statuses.length > 1) && (
            <>
              {/* Left Zone & Button */}
              <button
                type="button"
                onClick={handlePrevMedia}
                disabled={activeStoryIdx === 0 && activeMediaIdx === 0}
                className="absolute left-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xs transition-opacity hover:bg-black/70 disabled:opacity-0"
                aria-label={t('prevStory')}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* Right Zone & Button */}
              <button
                type="button"
                onClick={handleNextMedia}
                disabled={
                  activeStoryIdx === statuses.length - 1 &&
                  activeMediaIdx === mediaList.length - 1
                }
                className="absolute right-2 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-xs transition-opacity hover:bg-black/70 disabled:opacity-0"
                aria-label={t('nextStory')}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Bottom Caption Overlay (WhatsApp/IG Status Style) */}
          {currentMediaUrl && currentStatus.kontenTeks && (
            <div className="absolute bottom-0 inset-x-0 z-20 bg-gradient-to-t from-black/95 via-black/65 to-transparent px-4 pb-4 pt-10 sm:px-5">
              <p className="text-xs sm:text-sm leading-relaxed text-white drop-shadow-xs line-clamp-3">
                {currentStatus.kontenTeks}
              </p>
            </div>
          )}
        </div>

        {/* Inline Report Form Drawer */}
        {reportingStatusId === currentStatus.id && (
          <div className="border-t border-slate-800 bg-slate-900/95 p-4 text-xs text-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t('reportPhotoTitle')}
              </span>
              <button
                type="button"
                onClick={() => setReportingStatusId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {reportError && (
              <p className="mt-2 text-xs text-rose-400">{reportError}</p>
            )}
            {reportSuccess && (
              <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {reportSuccess}
              </p>
            )}

            <form onSubmit={handleReportSubmit} className="mt-3 space-y-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  {t('reportReason')}
                </label>
                <input
                  type="text"
                  required
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                  placeholder={t('reportReasonPlaceholder')}
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-300">
                  {t('reportNotes')}
                </label>
                <input
                  type="text"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:border-indigo-400 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setReportingStatusId(null)}
                  className="rounded-lg border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isPending || !alasan.trim()}
                  className="rounded-lg bg-rose-600 px-3 py-1 text-xs font-medium text-white hover:bg-rose-500 disabled:opacity-50"
                >
                  {isPending ? t('submittingReport') : t('reportPhoto')}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
