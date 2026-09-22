'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Calendar,
  BookOpen,
  Camera,
  GraduationCap,
  Lock,
  ArrowRight,
  Pencil,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ChildData, JENJANG_STYLES } from './types';

interface ChildBentoCardProps {
  child: ChildData;
  onSelect: (child: ChildData) => void;
}

function hitungUmur(tanggalLahir: string, isEn: boolean): string {
  try {
    const lahir = new Date(tanggalLahir);
    const now = new Date();
    let umur = now.getFullYear() - lahir.getFullYear();
    const m = now.getMonth() - lahir.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < lahir.getDate())) {
      umur--;
    }
    if (umur <= 0) return isEn ? '< 1 yr' : '< 1 thn';
    return isEn ? `${umur} yrs` : `${umur} thn`;
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
  const isEn = locale === 'en';

  const jenjangKey = (child.jenjangTerakhir?.toUpperCase() ?? 'DEFAULT') in JENJANG_STYLES
    ? (child.jenjangTerakhir?.toUpperCase() as keyof typeof JENJANG_STYLES)
    : 'DEFAULT';
  const style = JENJANG_STYLES[jenjangKey] ?? JENJANG_STYLES.DEFAULT;
  const inisial = child.nama.trim().slice(0, 2).toUpperCase();
  const umur = hitungUmur(child.tanggalLahir, isEn);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(child)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(child);
        }
      }}
      aria-label={`${child.nama}, ${t('bentoQuickView')}`}
      className={`group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.cardBorderHover} cursor-pointer focus-visible:outline-none ${style.ringColor} focus-visible:ring-2`}
    >
      {/* Background dekoratif aksen halus di sudut kartu */}
      <div
        className={`pointer-events-none absolute -top-10 -right-10 size-32 rounded-full ${style.lightGlow} blur-2xl transition-opacity group-hover:opacity-100 opacity-60`}
        aria-hidden="true"
      />

      {/* Bagian Atas: Avatar, Nama, Jenjang, & Tombol Aksi Cepat Edit */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar besar dengan warna khas Jenjang */}
            <div
              className={`flex size-12 sm:size-13 items-center justify-center rounded-2xl ${style.avatarBg} font-black text-base sm:text-lg shadow-2xs shrink-0 transition-transform group-hover:scale-105`}
            >
              {inisial}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate group-hover:text-brand transition-colors">
                {child.nama}
              </h3>
              {/* Badge Jenjang & Tingkat */}
              <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
                >
                  <BookOpen className="size-3" />
                  {child.jenjangTerakhir ?? t('text011')}
                  {child.tingkat ? ` • ${child.tingkat}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Tombol Edit di sudut kanan atas kartu (StopPropagation agar tidak membuka modal) */}
          <Link
            href={`/children/${child.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`${t('text014')} ${child.nama}`}
            title={child.isLocked ? t('bentoLockedNotice') : t('bentoEditableNotice')}
            className="grid size-8 sm:size-9 place-items-center rounded-xl bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/80 transition-all active:scale-95 shrink-0"
          >
            {child.isLocked ? (
              <Lock className="size-3.5 text-slate-400" />
            ) : (
              <Pencil className="size-3.5 text-slate-600" />
            )}
          </Link>
        </div>

        {/* Bento Grid 2 Kolom Mini di dalam kartu */}
        <div className="mt-4.5 grid grid-cols-2 gap-2.5">
          {/* Kolom Mini 1: Status Kelas Aktif */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex flex-col justify-between min-h-[82px] transition-colors group-hover:bg-slate-50">
            <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <GraduationCap className="size-3.5 text-slate-400" />
                <span className="truncate">Kelas</span>
              </span>
              {child.jumlahKelasAktif > 0 && (
                <span className="size-1.5 rounded-full bg-emerald-500" />
              )}
            </div>

            <div className="mt-1">
              {child.jumlahKelasAktif > 0 ? (
                <>
                  <p className="text-xs font-bold text-blue-700 truncate">
                    {child.jumlahKelasAktif} {t('text013')}
                  </p>
                  {child.kelasAktif?.mapel && (
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {child.kelasAktif.mapel}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[11px] text-slate-400 font-medium">
                  {t('bentoNoActiveClasses')}
                </p>
              )}
            </div>
          </div>

          {/* Kolom Mini 2: Umur, Tanggal Lahir, & Izin Foto */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 flex flex-col justify-between min-h-[82px] transition-colors group-hover:bg-slate-50">
            {/* Tanggal Lahir & Umur */}
            <div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Calendar className="size-3.5 text-slate-400" />
                <span className="truncate">{umur}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate mt-1">
                {formatTanggalPendek(child.tanggalLahir, locale)}
              </p>
            </div>

            {/* Micro badge Izin Dokumentasi Foto */}
            <div className="mt-1.5 pt-1 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <Camera className="size-3 text-slate-400" />
                <span>Foto</span>
              </span>
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  child.persetujuanFoto ? 'text-emerald-700' : 'text-slate-400'
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    child.persetujuanFoto ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                {child.persetujuanFoto ? 'Aktif' : 'Off'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bagian Bawah: Footer Bar Halus "Lihat Detail →" */}
      <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
          {child.isLocked ? (
            <>
              <Lock className="size-3 text-amber-500/80 shrink-0" />
              <span className="truncate text-amber-700/80">{t('bentoLockedNotice')}</span>
            </>
          ) : (
            <span className="truncate text-slate-400">{t('bentoClickToView')}</span>
          )}
        </div>

        <div className="inline-flex items-center gap-1 font-bold text-brand group-hover:text-brand-strong transition-colors shrink-0">
          <span>{t('bentoQuickView')}</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  );
}
