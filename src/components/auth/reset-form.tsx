"use client";

import { useTranslations } from 'next-intl';
import { useActionState, useState } from 'react';
import { executePasswordReset, type ResetPasswordState } from '@/app/actions/password-reset';
import { Link } from '@/i18n/navigation';

const initial: ResetPasswordState = {};

export default function ResetForm({
  token,
  email,
}: {
  token: string;
  email?: string;
}) {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState(executePasswordReset, initial);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const isMismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  // ==========================================
  // STATE SUKSES: KARTU SUKSES MANDIRI (OPSI A)
  // ==========================================
  if (state.success) {
    return (
      <div className="text-center py-2">
        {/* Badge Ikon Centang Hijau Emerald Siedu (Proporsional h-14 w-14) */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-xs">
          <svg
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Judul & Subtitle Sesuai Proporsi Halaman Lupa Password */}
        <h2 className="text-2xl sm:text-[22px] font-bold text-slate-900 tracking-tight mb-2">
          {t('resetSuccessTitle')}
        </h2>
        <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-sm mx-auto">
          {t('resetSuccessSubtitle')}
        </p>

        {/* Tombol Utama (Continue / Lanjutkan) — Seragam py-3 rounded-lg text-sm */}
        <Link
          href="/login"
          className="w-full bg-brand hover:bg-brand-strong text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center cursor-pointer shadow-xs"
        >
          {t('continueAction')}
        </Link>

        {/* Link Kembali ke Halaman Login — Konsisten Brand Blue */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-block text-sm font-semibold text-brand hover:text-brand-strong transition-colors"
          >
            {t('backLogin')}
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE FORMULIR ATUR KATA SANDI BARU
  // ==========================================
  return (
    <div>
      {/* Header Kartu: Badge Ikon Kunci Biru Siedu (Proporsional h-14 w-14) */}
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-brand shadow-xs">
          <svg
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
          {t('setNewPasswordTitle')}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
          {t('setNewPasswordSubtitle')}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />

        {state.error ? (
          <div
            className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 mb-4"
            role="alert"
          >
            <svg
              className="h-5 w-5 shrink-0 text-rose-600 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={1.75} />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4m0 4h.01" />
            </svg>
            <div className="flex-1 leading-relaxed">{state.error}</div>
          </div>
        ) : null}

        {/* Input Password Baru */}
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-slate-700 mb-1.5"
          >
            {t('password')}{' '}
            <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="new-password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('createPassword')}
              disabled={pending}
              className={`w-full h-11 px-3.5 pr-12 text-base sm:text-sm text-slate-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400 ${
                state.fieldErrors?.password
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                  : 'border-slate-200'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none cursor-pointer transition-colors"
              aria-label={showPassword ? t('hidePassword') : t('showPassword')}
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Checklist real-time menggantikan hint statis — identik RegisterForm */}
          <ul id="password-rules" className="mt-2 space-y-1">
            <li
              className={`flex items-center gap-1.5 text-xs ${
                password.length >= 8 ? 'text-emerald-600' : 'text-slate-600'
              }`}
            >
              {password.length >= 8 ? (
                <svg
                  className="w-3.5 h-3.5 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <span
                  className="w-3.5 h-3.5 shrink-0 rounded-full border border-slate-300"
                  aria-hidden="true"
                />
              )}
              <span>{t('minimumEight')}</span>
            </li>
          </ul>

          {state.fieldErrors?.password ? (
            <p className="mt-1 text-xs text-rose-600 font-medium">
              {state.fieldErrors.password}
            </p>
          ) : null}
        </div>

        {/* Input Konfirmasi Password */}
        <div>
          <label
            htmlFor="password_confirm"
            className="block text-sm font-semibold text-slate-700 mb-1.5"
          >
            {t('confirmPassword')}{' '}
            <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <input
              id="password_confirm"
              name="password_confirm"
              type={showPasswordConfirm ? 'text' : 'password'}
              required
              autoComplete="new-password"
              minLength={8}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder={t('confirmPassword')}
              disabled={pending}
              className={`w-full h-11 px-3.5 pr-12 text-base sm:text-sm text-slate-800 border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400 ${
                isMismatch || state.fieldErrors?.password_confirm
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                  : 'border-slate-200'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none cursor-pointer transition-colors"
              aria-label={showPasswordConfirm ? t('hidePassword') : t('showPassword')}
            >
              {showPasswordConfirm ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          {isMismatch ? (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">
              {t('passwordMismatch')}
            </p>
          ) : state.fieldErrors?.password_confirm ? (
            <p className="mt-1.5 text-xs text-rose-600 font-medium">
              {state.fieldErrors.password_confirm}
            </p>
          ) : null}
        </div>

        {/* Tombol Konfirmasi — Seragam py-3 rounded-lg text-sm */}
        <button
          type="submit"
          disabled={pending || isMismatch}
          className="w-full bg-brand hover:bg-brand-strong disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center cursor-pointer shadow-xs mt-6"
        >
          {pending ? t('resettingPassword') : t('confirmAction')}
        </button>

        {/* Link Kembali ke Halaman Login — Konsisten Brand Blue */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-block text-sm font-semibold text-brand hover:text-brand-strong transition-colors"
          >
            {t('backLogin')}
          </Link>
        </div>
      </form>
    </div>
  );
}
