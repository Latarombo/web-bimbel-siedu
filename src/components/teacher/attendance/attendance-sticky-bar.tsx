'use client';

import { useTranslations } from 'next-intl';
import { Save, Loader2 } from 'lucide-react';

interface AttendanceStickyBarProps {
  counts: {
    hadir: number;
    izin: number;
    sakit: number;
    alpa: number;
    belumDiisi: number;
  };
  pending: boolean;
}

export function AttendanceStickyBar({ counts, pending }: AttendanceStickyBarProps) {
  const t = useTranslations('teacher');

  return (
    <div className="sticky bottom-4 z-30 mt-6 transition-all">
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/90 bg-white/95 p-3.5 shadow-2xl backdrop-blur-md ring-1 ring-slate-900/5 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Counters Real-time */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-emerald-700">
              <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
              {t('summaryPresent')}: <span className="font-bold tabular-nums">{counts.hadir}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-amber-700">
              <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
              {t('summaryExcused')}: <span className="font-bold tabular-nums">{counts.izin}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1 text-blue-700">
              <span className="size-2 rounded-full bg-blue-500" aria-hidden="true" />
              {t('summarySick')}: <span className="font-bold tabular-nums">{counts.sakit}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1 text-rose-700">
              <span className="size-2 rounded-full bg-rose-500" aria-hidden="true" />
              {t('summaryAbsent')}: <span className="font-bold tabular-nums">{counts.alpa}</span>
            </span>
            {counts.belumDiisi > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-slate-600">
                <span className="size-2 rounded-full bg-slate-400" aria-hidden="true" />
                {t('summaryUnfilled')}: <span className="font-bold tabular-nums">{counts.belumDiisi}</span>
              </span>
            ) : null}
          </div>

          {/* Tombol Simpan Primary Blue */}
          <div className="flex items-center gap-3">
            {counts.belumDiisi > 0 && (
              <span className="hidden text-xs font-medium text-amber-600 lg:inline">
                {t('unfilledWarning', { count: counts.belumDiisi })}
              </span>
            )}
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white shadow-xs transition-all duration-200 hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  <span>{t('saving')}</span>
                </>
              ) : (
                <>
                  <Save className="size-4" aria-hidden="true" />
                  <span>{t('saveAttendance')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
