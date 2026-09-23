'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  X,
  Calendar,
  BookOpen,
  Camera,
  Phone,
  Mail,
  Lock,
  CheckCircle2,
  GraduationCap,
  Clock,
  ArrowRight,
  ExternalLink,
  UserCheck,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { ChildData, JENJANG_STYLES } from './types';
import { StudentAvatar } from '@/components/parent/student-avatar';
import { useScrollLock } from '@/lib/use-scroll-lock';

interface ChildQuickViewModalProps {
  child: ChildData | null;
  isOpen: boolean;
  onClose: () => void;
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

function formatTanggal(tanggalLahir: string, locale: string): string {
  try {
    const d = new Date(tanggalLahir);
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return tanggalLahir;
  }
}

export function ChildQuickViewModal({
  child,
  isOpen,
  onClose,
}: ChildQuickViewModalProps) {
  const t = useTranslations('parent');
  const locale = useLocale();
  const isEn = locale === 'en';
  const [activeTab, setActiveTab] = useState<'overview' | 'classes'>('overview');
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset tab saat child berganti atau modal dibuka
  const [prevTabSync, setPrevTabSync] = useState({ isOpen, childId: child?.id });
  if (isOpen !== prevTabSync.isOpen || child?.id !== prevTabSync.childId) {
    setPrevTabSync({ isOpen, childId: child?.id });
    if (isOpen) {
      setActiveTab('overview');
    }
  }

  // Listener tombol Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Kunci scroll body saat modal terbuka
  useScrollLock(isOpen);

  if (!isOpen || !child) return null;

  const jenjangKey = (child.jenjangTerakhir?.toUpperCase() ?? 'DEFAULT') in JENJANG_STYLES
    ? (child.jenjangTerakhir?.toUpperCase() as keyof typeof JENJANG_STYLES)
    : 'DEFAULT';
  const style = JENJANG_STYLES[jenjangKey] ?? JENJANG_STYLES.DEFAULT;
  const inisial = child.nama.trim().slice(0, 2).toUpperCase();
  const umur = hitungUmur(child.tanggalLahir, t);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-child-name"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className="relative w-full max-w-xl rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden z-10 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header dengan background aksen Jenjang */}
        <div className={`relative px-6 pt-6 pb-5 bg-gradient-to-b ${style.bgGradient} border-b border-slate-100 shrink-0`}>
          <button
            type="button"
            onClick={onClose}
            aria-label={isEn ? 'Close modal' : 'Tutup jendela'}
            className="absolute top-4 right-4 grid size-8 sm:size-9 place-items-center rounded-full bg-white/90 text-slate-500 hover:text-slate-800 hover:bg-white shadow-xs transition-all active:scale-95"
          >
            <X className="size-4.5" />
          </button>

          <div className="flex items-center gap-4 pr-10">
            <StudentAvatar
              nama={child.nama}
              jenjang={child.jenjangTerakhir}
              size="lg"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
                >
                  <BookOpen className="size-3" />
                  {child.jenjangTerakhir ?? t('text011')}
                  {child.tingkat ? ` • ${child.tingkat}` : ''}
                </span>

                {child.jumlahKelasAktif > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                    <GraduationCap className="size-3" />
                    {child.jumlahKelasAktif} {t('bentoActiveClasses', { count: child.jumlahKelasAktif })}
                  </span>
                ) : null}
              </div>

              <h2
                id="modal-child-name"
                className="mt-1 text-lg sm:text-xl font-black text-slate-900 tracking-tight truncate"
              >
                {child.nama}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {umur} · {formatTanggal(child.tanggalLahir, locale)}
              </p>
            </div>
          </div>

          {/* Segmented Tab Controls */}
          <div
            className="mt-5 flex rounded-xl bg-slate-100/90 p-1 border border-slate-200/60"
            role="tablist"
            aria-label={isEn ? "Child details tabs" : "Tab detail anak"}
          >
            <button
              type="button"
              role="tab"
              id="tab-overview"
              aria-selected={activeTab === 'overview'}
              aria-controls="panel-overview"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="size-3.5 sm:size-4" />
              {t('modalTabOverview')}
            </button>
            <button
              type="button"
              role="tab"
              id="tab-classes"
              aria-selected={activeTab === 'classes'}
              aria-controls="panel-classes"
              onClick={() => setActiveTab('classes')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-bold rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                activeTab === 'classes'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="size-3.5 sm:size-4" />
              {t('modalTabClasses')}
              {child.jumlahKelasAktif > 0 && (
                <span className="ml-0.5 size-2 rounded-full bg-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div data-lenis-prevent className="p-6 overflow-y-auto grow space-y-5 text-slate-700">
          {activeTab === 'overview' ? (
            <div
              id="panel-overview"
              role="tabpanel"
              aria-labelledby="tab-overview"
              className="space-y-4"
            >
              {/* Status Keterkuncian */}
              {child.isLocked ? (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-800">
                  <Lock className="size-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold">{t('bentoLockedNotice')}</p>
                    <p className="text-amber-700/90 leading-relaxed">
                      {t('modalLockInfo')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-3 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                  <span>{t('bentoEditableNotice')}</span>
                </div>
              )}

              {/* Grid Data Biodata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tanggal Lahir & Usia */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Calendar className="size-3.5 text-slate-400" />
                    <span>{t('modalDobAge')}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {formatTanggal(child.tanggalLahir, locale)}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {umur}
                  </p>
                </div>

                {/* Jenjang & Tingkat */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <BookOpen className="size-3.5 text-slate-400" />
                    <span>{t('modalLevel')}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    {child.jenjangTerakhir ?? t('text011')}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">
                    {child.tingkat ?? '-'}
                  </p>
                </div>

                {/* Nomor Telepon */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Phone className="size-3.5 text-slate-400" />
                    <span>{t('modalPhone')}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {child.nomorTelepon ?? (
                      <span className="text-slate-400 font-normal italic">
                        {t('modalNotSet')}
                      </span>
                    )}
                  </p>
                </div>

                {/* Email Notifikasi */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Mail className="size-3.5 text-slate-400" />
                    <span>{t('modalEmail')}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {child.emailNotifikasi ?? (
                      <span className="text-slate-400 font-normal italic">
                        {t('modalNotSet')}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Izin Dokumentasi Foto */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-white p-2 border border-slate-200/60 text-slate-500 shadow-2xs">
                  <Camera className="size-4 text-slate-600" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-500">
                      {t('modalPhotoConsent')}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        child.persetujuanFoto
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          child.persetujuanFoto ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      />
                      {child.persetujuanFoto ? t('consentActive') : t('consentRevoked')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {child.persetujuanFoto
                      ? t('modalPhotoConsentActive')
                      : t('modalPhotoConsentRevoked')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div
              id="panel-classes"
              role="tabpanel"
              aria-labelledby="tab-classes"
              className="space-y-4"
            >
              {/* Tab Kelas & Jadwal */}
              {child.jumlahKelasAktif > 0 && child.kelasAktif ? (
                <div className="space-y-4">
                  {/* Card Kelas Utama */}
                  <div className="rounded-2xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                          {child.jenjangTerakhir ?? 'Bimbel'}
                        </span>
                        <h4 className="text-base font-bold text-slate-900 mt-0.5">
                          {child.kelasAktif.mapel}
                        </h4>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="size-3 text-emerald-600" />
                        {t('bentoActiveClasses', { count: child.jumlahKelasAktif })}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="font-semibold text-slate-700">{t('modalTeacher')}:</span>
                      <span>{child.kelasAktif.guru}</span>
                    </div>
                  </div>

                  {/* Jadwal Belajar */}
                  {child.jadwal && child.jadwal.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                        <Clock className="size-3.5 text-slate-400" />
                        {t('modalClassSchedule')}
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {child.jadwal.map((j, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-3.5 py-2.5 text-xs"
                          >
                            <div className="font-bold text-slate-800">
                              {j.hari}
                            </div>
                            <div className="font-mono text-slate-600">
                              {j.mulai} - {j.selesai} WIB
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ringkasan Presensi */}
                  {child.presensi && child.presensi.total > 0 && (
                    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">
                          {t('modalAttendanceSummary')}
                        </span>
                        {child.persenHadir !== null && child.persenHadir !== undefined && (
                          <span className="text-xs font-extrabold text-blue-700">
                            {child.persenHadir}% {t('dashHeroKehadiran')}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-center text-xs">
                        <div className="rounded-lg bg-emerald-50 py-1.5 border border-emerald-100">
                          <span className="block font-bold text-emerald-700">{child.presensi.hadir}</span>
                          <span className="text-[10px] text-emerald-600">Hadir</span>
                        </div>
                        <div className="rounded-lg bg-blue-50 py-1.5 border border-blue-100">
                          <span className="block font-bold text-blue-700">{child.presensi.izin}</span>
                          <span className="text-[10px] text-blue-600">Izin</span>
                        </div>
                        <div className="rounded-lg bg-amber-50 py-1.5 border border-amber-100">
                          <span className="block font-bold text-amber-700">{child.presensi.sakit}</span>
                          <span className="text-[10px] text-amber-600">Sakit</span>
                        </div>
                        <div className="rounded-lg bg-rose-50 py-1.5 border border-rose-100">
                          <span className="block font-bold text-rose-700">{child.presensi.alpa}</span>
                          <span className="text-[10px] text-rose-600">Alpa</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center space-y-3">
                  <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-white text-slate-400 border border-slate-200 shadow-2xs">
                    <GraduationCap className="size-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-800">
                      {t('modalNoClassesYet')}
                    </p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      {t('modalNoClassesYetDesc')}
                    </p>
                  </div>
                  <div className="pt-2">
                    <Link
                      href="/classes"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-brand hover:text-brand-strong bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-xs hover:border-brand/40 transition-colors"
                    >
                      <Sparkles className="size-3.5 text-amber-500" />
                      {t('modalEnrollClass')}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer (Action CTAs) */}
        <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <Link
            href={`/children/${child.id}/edit`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-3.5 py-2.5 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            {child.isLocked ? (
              <Lock className="size-3.5 text-amber-500" />
            ) : (
              <Pencil className="size-3.5 text-brand" />
            )}
            {t('modalEditProfile')}
          </Link>

          <Link
            href={`/home?anak=${child.id}`}
            className="inline-flex items-center gap-2 text-xs font-bold text-white bg-brand hover:bg-brand-strong px-4 py-2.5 rounded-lg shadow-xs active:scale-[0.98] transition-all ml-auto"
          >
            <span>{t('modalGoToDashboard')}</span>
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
