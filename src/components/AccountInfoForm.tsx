'use client';
import { useTranslations } from 'next-intl';

import { useActionState, useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { saveAccountInfo, validateStep1, type AccountInfoState } from '@/app/actions/account-info';
import { CardSelect } from '@/components/ui/card-select';
import { useFormDraft } from '@/lib/use-form-draft';

const initial: AccountInfoState = {};

// Backfill migrasi BR#32 untuk akun lama:
// nomor placeholder tidak boleh di-prefill apa adanya ke form.
const PHONE_PLACEHOLDER = /^\+62-000-0000-0000$/;

export const WILAYAH_OPTIONS = [
  { value: 'Kecamatan Klojen, Kota Malang', label: 'Klojen (Kota Malang)' },
  { value: 'Kecamatan Lowokwaru, Kota Malang', label: 'Lowokwaru (Kota Malang)' },
  { value: 'Kecamatan Blimbing, Kota Malang', label: 'Blimbing (Kota Malang)' },
  { value: 'Kecamatan Sukun, Kota Malang', label: 'Sukun (Kota Malang)' },
  { value: 'Kecamatan Kedungkandang, Kota Malang', label: 'Kedungkandang (Kota Malang)' },
  { value: 'Kabupaten Malang', label: 'Kabupaten Malang' },
  { value: 'Luar Kota / Lainnya', label: 'Luar Kota / Lainnya' },
] as const;

export default function AccountInfoForm({
  needsConsent = false,
  isGoogle = false,
  currentName = '',
  telepon = '',
  dikembalikan = false,
}: {
  needsConsent?: boolean;
  isGoogle?: boolean;
  currentName?: string;
  telepon?: string;
  /** User mencoba membuka dashboard sebelum menuntaskan step ini. */
  dikembalikan?: boolean;
}) {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState(saveAccountInfo, initial);
  const errors = state.fieldErrors ?? {};
  const teleponAwal = PHONE_PLACEHOLDER.test(telepon.trim()) ? '' : telepon.trim();

  const [step, setStep] = useState<1 | 2>(1);
  const [isValidatingStep1, setIsValidatingStep1] = useState(false);
  const [clientErrors, setClientErrors] = useState<{ name?: string; nomor_telepon?: string }>({});

  const { draft, setDraftField } = useFormDraft('siedu_draft_account_info', {
    name: currentName,
    nomor_telepon: teleponAwal,
    wilayah: '',
    detail_alamat: '',
  });

  useEffect(() => {
    if (currentName && !draft.name) {
      setDraftField('name', currentName);
    }
  }, [currentName, draft.name, setDraftField]);

  useEffect(() => {
    if (teleponAwal && !draft.nomor_telepon) {
      setDraftField('nomor_telepon', teleponAwal);
    }
  }, [teleponAwal, draft.nomor_telepon, setDraftField]);

  useEffect(() => {
    if (state.name && !draft.name) setDraftField('name', state.name);
    if (state.nomor_telepon && !draft.nomor_telepon) setDraftField('nomor_telepon', state.nomor_telepon);
    if (state.wilayah && !draft.wilayah) setDraftField('wilayah', state.wilayah);
    if (state.detail_alamat && !draft.detail_alamat) setDraftField('detail_alamat', state.detail_alamat);
  }, [state.name, state.nomor_telepon, state.wilayah, state.detail_alamat, draft, setDraftField]);

  // Jika server mengembalikan error pada field nama atau nomor HP, otomatis arahkan kembali ke Langkah 1
  useEffect(() => {
    if (errors.name || errors.nomor_telepon) {
      setStep(1);
    }
  }, [errors.name, errors.nomor_telepon]);

  const handleNextStep = async () => {
    const errs: { name?: string; nomor_telepon?: string } = {};
    if (!draft.name.trim()) {
      errs.name = t('nameMin');
    }
    if (!draft.nomor_telepon.trim()) {
      errs.nomor_telepon = t('phoneMinDigits');
    }
    if (Object.keys(errs).length > 0) {
      setClientErrors(errs);
      return;
    }

    setIsValidatingStep1(true);
    setClientErrors({});

    try {
      const res = await validateStep1(draft.name, draft.nomor_telepon);
      if (!res.valid && res.fieldErrors) {
        setClientErrors(res.fieldErrors);
      } else {
        setStep(2);
      }
    } catch {
      setClientErrors({ nomor_telepon: 'Gagal memverifikasi nomor telepon. Silakan coba lagi.' });
    } finally {
      setIsValidatingStep1(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-md transition-all">
      <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-2 tracking-tight">
        {step === 1 ? 'Lengkapi Data Diri' : 'Alamat Domisili'}
      </h2>
      <p className="text-xs text-slate-500 mb-5 leading-relaxed">
        {step === 1
          ? 'Masukkan nama lengkap dan nomor telepon aktif Anda untuk keperluan konfirmasi pendaftaran.'
          : 'Pilih wilayah kecamatan dan alamat domisili untuk pencocokan kelas & lokasi bimbingan belajar.'}
      </p>

      {/* Dikembalikan gerbang dashboard karena mencoba lanjut sebelum selesai (hanya di langkah 1) */}
      {dikembalikan && step === 1 ? (
        <div
          className="mb-4 rounded-xl bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800 border border-amber-200"
          role="alert"
        >
          {t('accountIncomplete')}
        </div>
      ) : null}

      {/* Akun via Google: pengingat consent */}
      {needsConsent && isGoogle && step === 1 ? (
        <div className="mb-4 rounded-xl bg-blue-50 px-3.5 py-2.5 text-xs text-slate-600 border border-blue-100">
          {t('googleConsent')}
        </div>
      ) : null}

      <form action={formAction} className="space-y-4">
        {/* ================= LANGKAH 1: KONTAK & IDENTITAS ================= */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Nama Lengkap */}
            <div>
              <label
                htmlFor="name"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {t('fullName')} <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder={t('identityName')}
                value={draft.name}
                onChange={(e) => {
                  setDraftField('name', e.target.value);
                  setClientErrors((prev) => ({ ...prev, name: undefined }));
                }}
                aria-invalid={errors.name || clientErrors.name ? true : undefined}
                className="w-full px-3.5 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400"
              />
              {errors.name || clientErrors.name ? (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.name ?? clientErrors.name}
                </p>
              ) : null}
            </div>

            {/* Nomor HP WhatsApp */}
            <div>
              <label
                htmlFor="nomor_telepon"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {t('phone')} <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <input
                id="nomor_telepon"
                name="nomor_telepon"
                type="tel"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="08xxxxxxxxxx"
                value={draft.nomor_telepon}
                onChange={(e) => {
                  setDraftField('nomor_telepon', e.target.value);
                  setClientErrors((prev) => ({ ...prev, nomor_telepon: undefined }));
                }}
                aria-invalid={errors.nomor_telepon || clientErrors.nomor_telepon ? true : undefined}
                className="w-full px-3.5 py-2.5 text-sm text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400"
              />
              {errors.nomor_telepon || clientErrors.nomor_telepon ? (
                <p className="mt-1 text-xs text-rose-600">
                  {errors.nomor_telepon ?? clientErrors.nomor_telepon}
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-400">
                  {t('phoneHint')}
                </p>
              )}
            </div>

            {/* Tombol Lanjut ke Langkah 2 */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleNextStep}
                disabled={isValidatingStep1}
                className="w-full bg-brand hover:bg-brand-strong disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center cursor-pointer"
              >
                <span>{isValidatingStep1 ? t('processing') : t('continue')}</span>
              </button>
            </div>
          </div>
        )}

        {/* ================= LANGKAH 2: ALAMAT DOMISILI & PERSETUJUAN ================= */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Hidden inputs untuk nilai Langkah 1 agar terkirim ke Server Action */}
            <input type="hidden" name="name" value={draft.name} />
            <input type="hidden" name="nomor_telepon" value={draft.nomor_telepon} />

            {/* Kecamatan / Wilayah */}
            <div>
              <label
                htmlFor="wilayah"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {t('districtRegion')} <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <CardSelect
                id="wilayah"
                name="wilayah"
                required
                size="sm"
                value={draft.wilayah}
                onChange={(val) => setDraftField('wilayah', val)}
                options={WILAYAH_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label }))}
                placeholder={t('selectDistrict')}
                modalTitle={t('districtRegion')}
                ariaInvalid={Boolean(errors.wilayah)}
                ariaDescribedby={errors.wilayah ? 'wilayah-error' : undefined}
              />
              {errors.wilayah ? (
                <p id="wilayah-error" className="mt-1 text-xs text-rose-600">
                  {errors.wilayah}
                </p>
              ) : null}
            </div>

            {/* Detail Alamat Rumah */}
            <div>
              <label
                htmlFor="detail_alamat"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                {t('streetAddress')} <span className="text-danger" aria-hidden="true">*</span>
              </label>
              <textarea
                id="detail_alamat"
                name="detail_alamat"
                rows={2}
                required
                placeholder={t('streetAddressPlaceholder')}
                value={draft.detail_alamat}
                onChange={(e) => setDraftField('detail_alamat', e.target.value)}
                aria-invalid={errors.detail_alamat ? true : undefined}
                className="w-full px-3.5 py-2 text-sm text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400 resize-none"
              />
              {errors.detail_alamat ? (
                <p id="detail-alamat-error" className="mt-1 text-xs text-rose-600">
                  {errors.detail_alamat}
                </p>
              ) : null}
            </div>

            {/* Consent (PRD F1) bila belum pernah disetujui */}
            {needsConsent ? (
              <fieldset className="space-y-2 pt-1">
                <legend className="sr-only">{t('consent')}</legend>
                <div className="flex items-start gap-2.5">
                  <input
                    id="consent_privasi"
                    name="consent_privasi"
                    type="checkbox"
                    required
                    aria-invalid={errors.consent_privasi ? true : undefined}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand cursor-pointer"
                  />
                  <label
                    htmlFor="consent_privasi"
                    className="text-xs text-slate-600 leading-snug cursor-pointer"
                  >
                    {t('consentRead')}{' '}
                    <Link
                      href="/privacy-policy"
                      target="_blank"
                      className="text-brand hover:underline font-medium"
                    >
                      {t('privacy')}
                    </Link>{' '}
                    {t('and')}{' '}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-brand hover:underline font-medium"
                    >
                      {t('terms')}
                    </Link>
                    {t('consentSuffix')}
                  </label>
                </div>
                <div className="flex items-start gap-2.5">
                  <input
                    id="consent_wali"
                    name="consent_wali"
                    type="checkbox"
                    required
                    aria-invalid={errors.consent_wali ? true : undefined}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-brand cursor-pointer"
                  />
                  <label
                    htmlFor="consent_wali"
                    className="text-xs text-slate-600 leading-snug cursor-pointer"
                  >
                    {t('guardianConsent')}
                  </label>
                </div>
                {errors.consent_privasi || errors.consent_wali ? (
                  <p className="text-xs text-rose-600">
                    {errors.consent_privasi ?? errors.consent_wali}
                  </p>
                ) : null}
              </fieldset>
            ) : null}

            {state.error ? (
              <p
                className="rounded-xl bg-rose-50 px-3.5 py-2 text-xs text-rose-700 border border-rose-200"
                role="alert"
              >
                {state.error}
              </p>
            ) : null}

            {/* Tombol Aksi: Kembali & Simpan */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center justify-center px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shrink-0"
              >
                <span>Kembali</span>
              </button>
              <button
                type="submit"
                disabled={pending}
                className="flex-1 bg-brand hover:bg-brand-strong disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold py-3 rounded-xl transition-all shadow-md active:scale-[0.99] flex items-center justify-center cursor-pointer"
              >
                <span>{pending ? t('processing') : t('continue')}</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
