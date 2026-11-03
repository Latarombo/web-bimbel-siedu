'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

interface SessionStatStripProps {
  totalSiswa: number;
  terisi: number;
  perluPerhatian: number;
  terkunciN: number;
}

export function SessionStatStrip({
  totalSiswa,
  terisi,
  perluPerhatian,
  terkunciN,
}: SessionStatStripProps) {
  const t = useTranslations('teacher');

  const persenTerisi = totalSiswa > 0 ? Math.round((terisi / totalSiswa) * 100) : 0;
  const isComplete = totalSiswa > 0 && terisi === totalSiswa;

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 mb-6">
      {/* 1. Total Siswa */}
      <div className="relative overflow-hidden rounded-lg border border-blue-200/70 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/80 via-blue-50/20 to-white dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-blue-600 dark:text-blue-400">
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('students')}
              </p>
              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-100/80 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                Rombel
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
              {totalSiswa}
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
            Total murid terdaftar rombel
          </p>
        </div>
        <svg
          className="pointer-events-none absolute -right-4 -top-4 w-32 sm:w-36 opacity-[0.16] dark:opacity-[0.22]"
          viewBox="0 0 400 280"
          fill="none"
          aria-hidden="true"
        >
          <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="currentColor" fillOpacity="0.4" />
          <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="currentColor" fillOpacity="0.6" />
          <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="currentColor" fillOpacity="0.8" />
        </svg>
      </div>

      {/* 2. Progres Presensi Terisi */}
      <div className="relative overflow-hidden rounded-lg border border-indigo-200/70 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/80 via-indigo-50/20 to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-indigo-600 dark:text-indigo-400">
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('filled')}
              </p>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border tabular-nums ${
                  isComplete
                    ? 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
                    : 'bg-indigo-100/90 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800'
                }`}
              >
                {persenTerisi}%
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums tracking-tight">
                {terisi}
              </span>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                / {totalSiswa}
              </span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
            {isComplete ? 'Presensi telah lengkap' : 'Pencatatan sedang berjalan'}
          </p>
        </div>
        <svg
          className="pointer-events-none absolute -right-4 -top-4 w-32 sm:w-36 opacity-[0.16] dark:opacity-[0.22]"
          viewBox="0 0 400 280"
          fill="none"
          aria-hidden="true"
        >
          <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="currentColor" fillOpacity="0.4" />
          <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="currentColor" fillOpacity="0.6" />
          <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="currentColor" fillOpacity="0.8" />
        </svg>
      </div>

      {/* 3. Perlu Perhatian (Izin, Sakit, Alpa) */}
      <div className="relative overflow-hidden rounded-lg border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 via-amber-50/20 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-amber-600 dark:text-amber-400">
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('needsAttention')}
              </p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                perluPerhatian > 0
                  ? 'bg-amber-100/90 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 border-amber-300/80 dark:border-amber-800'
                  : 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
              }`}>
                {perluPerhatian > 0 ? 'Izin/Sakit/Alpa' : 'Nihil'}
              </span>
            </div>
            <p className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
              perluPerhatian > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-950 dark:text-white'
            }`}>
              {perluPerhatian}
            </p>
          </div>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
            {perluPerhatian > 0 ? t('attentionCount', { count: perluPerhatian }) : 'Semua hadir'}
          </p>
        </div>
        <svg
          className="pointer-events-none absolute -right-4 -top-4 w-32 sm:w-36 opacity-[0.16] dark:opacity-[0.22]"
          viewBox="0 0 400 280"
          fill="none"
          aria-hidden="true"
        >
          <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="currentColor" fillOpacity="0.4" />
          <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="currentColor" fillOpacity="0.6" />
          <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="currentColor" fillOpacity="0.8" />
        </svg>
      </div>

      {/* 4. Aturan 7 Hari / Status Kunci */}
      <div className={`relative overflow-hidden rounded-lg border p-4 shadow-xs flex flex-col justify-between ${
        terkunciN > 0
          ? 'border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 via-amber-50/20 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 text-amber-600 dark:text-amber-400'
          : 'border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 via-emerald-50/20 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 text-emerald-600 dark:text-emerald-400'
      }`}>
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {t('sevenDayRule')}
              </p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                terkunciN > 0
                  ? 'bg-amber-100/90 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 border-amber-300/80 dark:border-amber-800'
                  : 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
              }`}>
                {terkunciN > 0 ? t('locked') : t('editable')}
              </span>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-950 dark:text-white">
              {terkunciN > 0 ? terkunciN : 'Aktif'}
            </p>
          </div>
          <div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              {terkunciN > 0
                ? t('sessionLockedCount', { count: terkunciN })
                : t('noSessionLocked')}
            </p>
            {terkunciN > 0 && (
              <Link
                href="/teacher/corrections"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>{t('viewCorrectionFlow')}</span>
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
        <svg
          className="pointer-events-none absolute -right-4 -top-4 w-32 sm:w-36 opacity-[0.16] dark:opacity-[0.22]"
          viewBox="0 0 400 280"
          fill="none"
          aria-hidden="true"
        >
          <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="currentColor" fillOpacity="0.4" />
          <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="currentColor" fillOpacity="0.6" />
          <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="currentColor" fillOpacity="0.8" />
        </svg>
      </div>
    </div>
  );
}
