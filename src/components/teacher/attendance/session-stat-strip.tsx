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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 mb-6">
      {/* 1. Total Siswa */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('students')}</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-950 tabular-nums">
            {totalSiswa}
          </span>
          <span className="text-xs text-slate-600">{t('studentsCount', { count: totalSiswa })}</span>
        </div>
      </div>

      {/* 2. Progres Presensi Terisi */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('filled')}</span>
          <span
            className={`rounded px-2 py-0.5 text-xs font-semibold tabular-nums ${
              isComplete
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
          >
            {persenTerisi}%
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold text-slate-950 tabular-nums">
            {terisi}
          </span>
          <span className="text-xs text-slate-600">
            / {totalSiswa}
          </span>
        </div>
      </div>

      {/* 3. Perlu Perhatian (Izin, Sakit, Alpa) */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('needsAttention')}</span>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-extrabold tabular-nums ${perluPerhatian > 0 ? 'text-amber-600' : 'text-slate-950'}`}>
            {perluPerhatian}
          </span>
          <span className="text-xs text-slate-600">{t('attentionCount', { count: perluPerhatian })}</span>
        </div>
      </div>

      {/* 4. Aturan 7 Hari / Status Kunci */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('sevenDayRule')}</span>
            {terkunciN > 0 ? (
              <span className="rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">
                {terkunciN} {t('locked')}
              </span>
            ) : (
              <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                {t('editable')}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-700 line-clamp-1">
            {terkunciN > 0
              ? t('sessionLockedCount', { count: terkunciN })
              : t('noSessionLocked')}
          </p>
        </div>
        {terkunciN > 0 && (
          <Link
            href="/teacher/corrections"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>{t('viewCorrectionFlow')}</span>
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
