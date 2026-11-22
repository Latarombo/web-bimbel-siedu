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
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('students')}
          </p>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
            {totalSiswa}
          </p>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 truncate">
          Total murid terdaftar rombel
        </p>
      </div>

      {/* 2. Progres Presensi Terisi */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('filled')}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums tracking-tight">
              {terisi}
            </span>
            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">
              / {totalSiswa}
            </span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 truncate">
          {isComplete ? 'Presensi telah lengkap' : 'Pencatatan sedang berjalan'}
        </p>
      </div>

      {/* 3. Perlu Perhatian (Izin, Sakit, Alpa) */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('needsAttention')}
          </p>
          <p className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
            perluPerhatian > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-950 dark:text-white'
          }`}>
            {perluPerhatian}
          </p>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 truncate">
          {perluPerhatian > 0 ? t('attentionCount', { count: perluPerhatian }) : 'Semua hadir'}
        </p>
      </div>

      {/* 4. Aturan 7 Hari / Status Kunci */}
      <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('sevenDayRule')}
          </p>
          <p className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
            terkunciN > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-950 dark:text-white'
          }`}>
            {terkunciN > 0 ? terkunciN : 'Aktif'}
          </p>
        </div>
        <div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 truncate">
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
    </div>
  );
}
