'use client';

import { useActionState, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { DatePicker } from '@/components/ui/date-picker';
import { CardSelect } from '@/components/ui/card-select';
import { updateChild } from '@/app/actions/child-info';
import { JENJANG_STYLES } from '@/components/parent/children/types';
import {
  KELAS_OPTIONS,
  inferJenjangDanKelasFromBirthDate,
} from '@/components/ChildInfoForm';
import {
  BookOpen,
  Camera,
  Phone,
  Mail,
  Lock,
  User,
} from 'lucide-react';

export interface ChildEditData {
  id: number;
  nama: string;
  tanggalLahir: string;
  jenjangTerakhir: string;
  tingkat: string;
  emailNotifikasi: string;
  nomorTelepon: string;
  persetujuanFoto: boolean;
}

interface ChildEditFormProps {
  anak: ChildEditData;
  parentPhone: string;
  isLocked: boolean;
}

const JENJANG_LIST = [
  { value: 'TK', label: 'TK' },
  { value: 'SD', label: 'SD' },
  { value: 'SMP', label: 'SMP' },
  { value: 'SMA', label: 'SMA' },
] as const;

function hitungUmur(
  tanggalLahir: string,
  tr: (key: string, values?: Record<string, string | number>) => string
): string {
  try {
    const lahir = new Date(tanggalLahir);
    const now = new Date();
    let umur = now.getFullYear() - lahir.getFullYear();
    const m = now.getMonth() - lahir.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < lahir.getDate())) {
      umur--;
    }
    if (umur <= 0) return tr('ageBaby');
    return tr('ageYears', { age: umur });
  } catch {
    return '';
  }
}

export function ChildEditForm({
  anak,
  parentPhone,
  isLocked,
}: ChildEditFormProps) {
  const t = useTranslations('auth');
  const tr = useTranslations('parent');
  const locale = useLocale();

  const [state, formAction, pending] = useActionState(updateChild, {});

  const [nama, setNama] = useState(anak.nama);
  const [tanggalLahir, setTanggalLahir] = useState(anak.tanggalLahir);
  const [jenjang, setJenjang] = useState<'TK' | 'SD' | 'SMP' | 'SMA' | ''>(
    (anak.jenjangTerakhir as 'TK' | 'SD' | 'SMP' | 'SMA') || ''
  );
  const [tingkat, setTingkat] = useState(anak.tingkat);

  const [hpValue, setHpValue] = useState(anak.nomorTelepon);
  const [hpSama, setHpSama] = useState(
    Boolean(parentPhone && anak.nomorTelepon && anak.nomorTelepon === parentPhone)
  );
  const [emailValue, setEmailValue] = useState(anak.emailNotifikasi);
  const [persetujuanFoto, setPersetujuanFoto] = useState(anak.persetujuanFoto);

  const errors = state.fieldErrors || {};

  const jenjangKey = (anak.jenjangTerakhir?.toUpperCase() ?? 'DEFAULT') in JENJANG_STYLES
    ? (anak.jenjangTerakhir?.toUpperCase() as keyof typeof JENJANG_STYLES)
    : 'DEFAULT';
  const style = JENJANG_STYLES[jenjangKey] ?? JENJANG_STYLES.DEFAULT;
  const inisial = anak.nama.trim().slice(0, 2).toUpperCase();
  const umur = hitungUmur(anak.tanggalLahir, tr);

  const inputBase =
    'w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-slate-400 bg-white';

  const currentKelasOptions = jenjang ? KELAS_OPTIONS[jenjang] : [];

  return (
    <div className="w-full max-w-[460px] mx-auto bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
      {/* Header Form — rata kiri, konsisten dgn form tambah anak */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-1.5 sm:mb-2">
          {tr('editProfileTitle', { name: anak.nama })}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
          {isLocked ? tr('editDescLocked') : tr('editDesc')}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="anak_id" value={anak.id} />

        {isLocked ? (
          <>
            {/* MODE TERKUNCI (Ada Kelas Aktif): TILE RINGKASAN IDENTITAS STATIS */}
            <input type="hidden" name="nama" value={anak.nama} />
            <input type="hidden" name="tanggal_lahir" value={anak.tanggalLahir} />
            <input type="hidden" name="jenjang_terakhir" value={anak.jenjangTerakhir} />
            <input type="hidden" name="tingkat" value={anak.tingkat} />

            <div className={`rounded-2xl border border-slate-200/90 bg-gradient-to-b ${style.bgGradient} p-4.5 space-y-3`}>
              <div className="flex items-center gap-3.5">
                <div
                  className={`flex size-13 items-center justify-center rounded-2xl ${style.avatarBg} font-black text-lg shadow-2xs shrink-0`}
                >
                  {inisial}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                    {anak.nama}
                  </h3>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${style.badgeBg} ${style.badgeText} ${style.badgeBorder}`}
                    >
                      <BookOpen className="size-3" />
                      {anak.jenjangTerakhir}
                      {anak.tingkat ? ` • ${anak.tingkat}` : ''}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {umur}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 p-3 text-xs text-amber-800">
                <Lock className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {tr('editLockedNotice')}
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Field Nama Anak */}
            <div>
              <label
                htmlFor="nama"
                className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
              >
                {t('childFullName')}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <User className="size-4 sm:size-5 text-slate-400 shrink-0" />
                </span>
                <input
                  type="text"
                  id="nama"
                  name="nama"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder={t('childFullName')}
                  aria-invalid={errors.nama ? true : undefined}
                  className={inputBase}
                />
              </div>
              {errors.nama && (
                <p className="mt-1 text-xs text-rose-600">{errors.nama}</p>
              )}
            </div>

            {/* Field Tanggal Lahir */}
            <div>
              <label
                htmlFor="tanggal_lahir"
                className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
              >
                {t('childBirth')} <span className="text-rose-500">*</span>
              </label>
              <DatePicker
                id="tanggal_lahir"
                name="tanggal_lahir"
                required
                value={tanggalLahir}
                locale={locale}
                onChange={(iso) => {
                  setTanggalLahir(iso);
                  const suggested = inferJenjangDanKelasFromBirthDate(iso);
                  if (suggested) {
                    setJenjang(suggested.jenjang);
                    setTingkat(suggested.tingkat);
                  }
                }}
                ariaInvalid={errors.tanggal_lahir ? true : undefined}
              />
              {errors.tanggal_lahir && (
                <p className="mt-1 text-xs text-rose-600">{errors.tanggal_lahir}</p>
              )}
            </div>

            {/* Grid 2 Dropdown: Jenjang Pendidikan & Kelas — ala form tambah */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
              <div>
                <label
                  htmlFor="jenjang_terakhir"
                  className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
                >
                  {t('educationLevel')} <span className="text-rose-500">*</span>
                </label>
                <CardSelect
                  id="jenjang_terakhir"
                  name="jenjang_terakhir"
                  required
                  value={jenjang}
                  onChange={(val) => {
                    setJenjang(val as 'TK' | 'SD' | 'SMP' | 'SMA');
                    const opts = KELAS_OPTIONS[val as 'TK' | 'SD' | 'SMP' | 'SMA'];
                    if (opts && opts.length > 0 && !opts.some((o) => o.value === tingkat)) {
                      setTingkat(opts[0].value);
                    }
                  }}
                  options={JENJANG_LIST}
                  placeholder={t('selectEducationLevel')}
                  modalTitle={t('educationLevel')}
                  icon={<BookOpen className="size-4 sm:size-5 text-slate-400" />}
                  ariaInvalid={Boolean(errors.jenjang_terakhir)}
                />
                {errors.jenjang_terakhir && (
                  <p className="mt-1 text-xs text-rose-600">{errors.jenjang_terakhir}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="tingkat"
                  className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
                >
                  {t('classLevel')} <span className="text-rose-500">*</span>
                </label>
                <CardSelect
                  id="tingkat"
                  name="tingkat"
                  required
                  value={tingkat}
                  onChange={(val) => setTingkat(val)}
                  disabled={!jenjang}
                  options={currentKelasOptions}
                  placeholder={t('selectClassPrompt')}
                  modalTitle={t('classLevel')}
                  icon={<BookOpen className="size-4 sm:size-5 text-slate-400" />}
                  ariaInvalid={Boolean(errors.tingkat)}
                />
                {errors.tingkat && (
                  <p className="mt-1 text-xs text-rose-600">{errors.tingkat}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* KONTAK & KOMUNIKASI (Selalu Dapat Diubah Orang Tua) */}
        <div className="pt-2 border-t border-slate-100 space-y-4">
          {/* Field Nomor Telepon Anak */}
          <div>
            <label
              htmlFor="nomor_telepon"
              className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
            >
              {t('childPhoneLabel')} <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Phone className="size-4 sm:size-5 text-slate-400 shrink-0" />
              </span>
              <input
                type="tel"
                id="nomor_telepon"
                name="nomor_telepon"
                required
                value={hpValue}
                onChange={(e) => setHpValue(e.target.value)}
                placeholder={t('childPhonePlaceholder')}
                className={inputBase}
              />
            </div>

            {parentPhone && (
              <div className="mt-2 flex justify-end">
                <label
                  htmlFor="hp_sama"
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-colors cursor-pointer select-none text-xs font-medium text-slate-600"
                >
                  <span>{t('samePhone')}</span>
                  <input
                    id="hp_sama"
                    type="checkbox"
                    role="switch"
                    checked={hpSama}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setHpSama(checked);
                      if (checked) {
                        setHpValue(parentPhone);
                      } else {
                        setHpValue('');
                      }
                    }}
                    className="sr-only peer"
                  />
                  <span
                    aria-hidden="true"
                    className="w-7 h-4 rounded-full bg-slate-200 peer-checked:bg-brand relative transition-colors cursor-pointer shrink-0 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-3 after:h-3 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-3"
                  />
                </label>
              </div>
            )}
            {errors.nomor_telepon && (
              <p className="mt-1 text-xs text-rose-600">{errors.nomor_telepon}</p>
            )}
          </div>

          {/* Field Email Notifikasi (Opsional) */}
          <div>
            <label
              htmlFor="email_notifikasi"
              className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
            >
              {t('childEmail')}{' '}
              <span className="text-xs font-normal text-slate-400">
                {t('optionalParen')}
              </span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Mail className="size-4 sm:size-5 text-slate-400 shrink-0" />
              </span>
              <input
                type="email"
                id="email_notifikasi"
                name="email_notifikasi"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
                placeholder={t('childEmail')}
                className={inputBase}
              />
            </div>
            {errors.email_notifikasi && (
              <p className="mt-1 text-xs text-rose-600">{errors.email_notifikasi}</p>
            )}
          </div>

          {/* Persetujuan Publikasi Foto Dokumentasi Kegiatan */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Camera className="size-4 text-slate-500" />
                <span className="text-xs sm:text-sm font-bold text-slate-800">
                  {tr('consentPhotoTitle')}
                </span>
              </div>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    persetujuanFoto
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                      : 'bg-slate-200/80 text-slate-600'
                  }`}
                >
                  {persetujuanFoto ? tr('consentActive') : tr('consentRevoked')}
                </span>
                <input
                  type="checkbox"
                  name="persetujuan_foto"
                  checked={persetujuanFoto}
                  onChange={(e) => setPersetujuanFoto(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="w-7 h-4 rounded-full bg-slate-200 peer-checked:bg-emerald-500 relative transition-colors cursor-pointer shrink-0 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:size-3 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-3" />
              </label>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {tr('consentPhotoDesc')}
            </p>
          </div>
        </div>

        {/* Global Error Banner */}
        {state.error && (
          <div
            className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700"
            role="alert"
          >
            {state.error}
          </div>
        )}

        {/* Action Buttons — identik form tambah */}
        <div className="pt-2 space-y-2.5">
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-brand hover:bg-brand-strong disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm sm:text-base font-semibold py-3 sm:py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center active:scale-[0.99] cursor-pointer"
          >
            <span>{pending ? t('processing') : tr('saveChanges')}</span>
          </button>

          <Link
            href="/children"
            className="w-full flex items-center justify-center py-2.5 sm:py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-[0.99] cursor-pointer shadow-xs"
          >
            <span>{tr('cancelBackChildren')}</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
