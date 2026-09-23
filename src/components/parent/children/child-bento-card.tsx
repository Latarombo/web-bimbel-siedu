'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Lock } from 'lucide-react';
import { StudentAvatar } from '@/components/parent/student-avatar';
import { ChildData, JENJANG_STYLES } from './types';

interface ChildBentoCardProps {
  child: ChildData;
  onSelect: (child: ChildData) => void;
}

function hitungUmur(
  tanggalLahir: string,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  try {
    const lahir = new Date(tanggalLahir);
    const now = new Date();
    let umur = now.getFullYear() - lahir.getFullYear();
    const m = now.getMonth() - lahir.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < lahir.getDate())) {
      umur--;
    }
    if (umur <= 0) return t('ageBaby');
    return t('ageYears', { age: umur });
  } catch {
    return '';
  }
}

function formatTanggalPendek(tanggalLahir: string, locale: string): string {
  try {
    const d = new Date(tanggalLahir);
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return tanggalLahir;
  }
}

export function ChildBentoCard({ child, onSelect }: ChildBentoCardProps) {
  const t = useTranslations('parent');
  const locale = useLocale();

  const jenjangKey = (child.jenjangTerakhir?.toUpperCase() ?? 'DEFAULT') in JENJANG_STYLES
    ? (child.jenjangTerakhir?.toUpperCase() as keyof typeof JENJANG_STYLES)
    : 'DEFAULT';
  const style = JENJANG_STYLES[jenjangKey] ?? JENJANG_STYLES.DEFAULT;
  const inisial = child.nama.trim().slice(0, 2).toUpperCase();
  const umur = hitungUmur(child.tanggalLahir, t);

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-lg hover:shadow-blue-500/10 hover:border-blue-400 hover:-translate-y-1 transition-all duration-200">
      <div className="space-y-4">
        {/* Header: Avatar, Nama, Jenjang */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <StudentAvatar
              nama={child.nama}
              jenjang={child.jenjangTerakhir}
              size="md"
            />

            <div className="min-w-0">
              <h3 className="text-lg font-black text-slate-900 group-hover:text-brand tracking-tight truncate transition-colors">
                {child.nama}
              </h3>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {child.jenjangTerakhir ?? t('text011')}
                {child.tingkat ? ` · ${child.tingkat}` : ''}
              </p>
            </div>
          </div>

          {child.isLocked && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-md shrink-0">
              <Lock className="size-3 text-amber-600" />
              <span>{t('bentoLocked')}</span>
            </span>
          )}
        </div>

        {/* Status Kelas & Belajar (Berwarna tegas & kontras tinggi) */}
        {child.jumlahKelasAktif > 0 ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50/80 p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900 tracking-wide">
                {t('bentoTutoringClass')}
              </span>
              <span className="font-black text-blue-700 bg-white border border-blue-200 px-2.5 py-0.5 rounded-md text-[11px] shadow-2xs">
                {t('bentoActiveCount', { count: child.jumlahKelasAktif })}
              </span>
            </div>

            <div className="pt-2 border-t border-blue-200 space-y-1">
              <p className="text-base font-black text-blue-950 tracking-tight truncate">
                {child.kelasAktif?.mapel}
              </p>
              {child.kelasAktif?.guru && (
                <p className="text-xs font-semibold text-blue-700 truncate">
                  {t('bentoTeacher')}: {child.kelasAktif.guru}
                </p>
              )}
              {child.jadwal && child.jadwal.length > 0 && (
                <div className="mt-2 pt-0.5">
                  <span className="inline-block rounded-lg bg-white border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-950 shadow-2xs">
                    {child.jadwal[0].hari}, {child.jadwal[0].mulai}–{child.jadwal[0].selesai} WIB
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-950 tracking-wide">
                {t('bentoTutoringClass')}
              </span>
              <span className="font-bold text-amber-800 bg-white border border-amber-200 px-2.5 py-0.5 rounded-md text-[11px] shadow-2xs">
                {t('bentoNotEnrolled')}
              </span>
            </div>

            <div className="pt-2 border-t border-amber-200/80">
              <Link
                href={`/classes?jenjang=${child.jenjangTerakhir ?? ''}`}
                className="inline-block text-xs font-bold text-white bg-brand hover:bg-brand-strong px-3.5 py-1.5 rounded-lg shadow-xs hover:shadow transition-all"
              >
                {t('bentoBrowseClasses')}
              </Link>
            </div>
          </div>
        )}

        {/* Biodata Singkat (kontras jelas & tajam) */}
        <div className="flex items-center justify-between text-xs text-slate-600 font-semibold px-0.5">
          <span>{umur} · {formatTanggalPendek(child.tanggalLahir, locale)}</span>
          <span>
            {t('bentoPhoto')}:{' '}
            <span className={child.persetujuanFoto ? 'text-emerald-700 font-bold' : 'text-slate-500 font-semibold'}>
              {child.persetujuanFoto ? t('photoAllowed') : t('photoOff')}
            </span>
          </span>
        </div>
      </div>

      {/* Action Buttons: Tombol solid & berbayang tegas */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-2.5">
        <Link
          href={`/children/${child.id}/edit`}
          className="flex-1 py-2.5 px-3 text-center text-xs font-bold rounded-xl border border-slate-300 bg-white hover:border-brand hover:text-brand hover:bg-blue-50/40 text-slate-800 transition-all shadow-2xs active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
        >
          {t('modalEditProfile')}
        </Link>
        <button
          type="button"
          onClick={() => onSelect(child)}
          className="flex-1 py-2.5 px-3 text-center text-xs font-bold rounded-xl bg-brand hover:bg-brand-strong text-white transition-all shadow-xs hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand cursor-pointer"
        >
          {t('bentoQuickView')}
        </button>
      </div>
    </article>
  );
}
