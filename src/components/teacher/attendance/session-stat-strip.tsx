'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Users, CheckCircle2, AlertCircle, Lock, ArrowRight } from 'lucide-react';

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
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-500">
          <Users className="size-4 text-slate-400" aria-hidden="true" />
          <span className="text-xs font-semibold">{t('students')}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-black text-slate-900 tabular-nums">
            {totalSiswa}
          </span>
          <span className="text-xs text-slate-500">{t('studentsCount', { count: totalSiswa })}</span>
        </div>
      </div>

      {/* 2. Progres Presensi Terisi */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500">
            <CheckCircle2
              className={`size-4 ${isComplete ? 'text-emerald-500' : 'text-slate-400'}`}
              aria-hidden="true"
            />
            <span className="text-xs font-semibold">{t('filled')}</span>
          </div>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
              isComplete
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-blue-50 text-blue-700'
            }`}
          >
            {persenTerisi}%
          </span>
        </div>
        <div className="mt-2 flex items-baseline gap-1.5">
          <span className="text-2xl font-black text-slate-900 tabular-nums">
            {terisi}
          </span>
          <span className="text-xs text-slate-500">
            / {totalSiswa}
          </span>
        </div>
      </div>

      {/* 3. Perlu Perhatian (Izin, Sakit, Alpa) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
        <div className="flex items-center gap-2 text-slate-500">
          <AlertCircle
            className={`size-4 ${perluPerhatian > 0 ? 'text-amber-500' : 'text-slate-400'}`}
            aria-hidden="true"
          />
          <span className="text-xs font-semibold">{t('needsAttention')}</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className={`text-2xl font-black tabular-nums ${perluPerhatian > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
            {perluPerhatian}
          </span>
          <span className="text-xs text-slate-500">{t('attentionCount', { count: perluPerhatian })}</span>
        </div>
      </div>

      {/* 4. Aturan 7 Hari / Status Kunci */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-500">
              <Lock className="size-4 text-slate-400" aria-hidden="true" />
              <span className="text-xs font-semibold">{t('sevenDayRule')}</span>
            </div>
            {terkunciN > 0 ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                {terkunciN} {t('locked')}
              </span>
            ) : (
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                {t('editable')}
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-600 line-clamp-1">
            {terkunciN > 0
              ? t('sessionLockedCount', { count: terkunciN })
              : t('noSessionLocked')}
          </p>
        </div>
        {terkunciN > 0 && (
          <Link
            href="/teacher/corrections"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700"
          >
            <span>{t('viewCorrectionFlow')}</span>
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        )}
      </div>
    </div>
  );
}
