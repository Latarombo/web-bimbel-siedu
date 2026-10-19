"use client";

import { useTranslations } from 'next-intl';
import { useActionState, useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { requestPasswordReset, type ForgotPasswordState } from '@/app/actions/password-reset';

const initial: ForgotPasswordState = {};

export default function ForgotForm() {
  const t = useTranslations('auth');
  const [state, formAction, pending] = useActionState(requestPasswordReset, initial);
  const [email, setEmail] = useState('');
  const [dismissSuccess, setDismissSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (state.cooldownRemaining && state.cooldownRemaining > 0) {
      setCooldown(state.cooldownRemaining);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [state.cooldownRemaining, state.success, state.error]);

  // ==========================================
  // STATE SUKSES: LINK RESET TERKIRIM
  // ==========================================
  if (state.success && !dismissSuccess) {
    return (
      <div className="text-center py-2">
        {/* Success icon */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 shadow-xs">
          <svg
            className="h-7 w-7 text-emerald-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 mb-2">
          {t('resetSentTitle')}
        </h2>
        <p className="text-sm text-slate-600 mb-4 leading-relaxed max-w-sm mx-auto">
          {t('resetSentDesc', { email: state.email || email })}
        </p>

        {/* Resend button / Cooldown indicator */}
        <div className="mb-6">
          {cooldown > 0 ? (
            <p className="text-xs text-slate-500 font-medium">
              {t('resendCooldown', { seconds: cooldown })}
            </p>
          ) : (
            <form
              action={(formData) => {
                setDismissSuccess(false);
                formAction(formData);
              }}
            >
              <input type="hidden" name="email" value={state.email || email} />
              <button
                type="submit"
                disabled={pending}
                className="text-xs font-semibold text-brand hover:text-brand-strong hover:underline transition-colors cursor-pointer"
              >
                {pending ? t('processing') : t('resendLink')}
              </button>
            </form>
          )}
        </div>

        {/* Action Buttons: Tombol Utama (Back to Sign In) + Tombol Kedua (Tautan Coba Alamat Email Lain tanpa outline) */}
        <div className="mt-6">
          <Link
            href="/login"
            className="w-full bg-brand hover:bg-brand-strong text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center cursor-pointer shadow-xs"
          >
            {t('backLogin')}
          </Link>

          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setDismissSuccess(true)}
              className="inline-block text-sm font-semibold text-brand hover:text-brand-strong transition-colors cursor-pointer"
            >
              {t('tryAnotherEmail')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STATE FORMULIR LUPA PASSWORD (OPSI 1: CENTERED & PROPORSIONAL)
  // ==========================================
  return (
    <div>
      {/* Header Kartu: Badge Ikon Gembok Biru Siedu (Proporsional h-14 w-14) */}
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
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
          {t('forgotTitle')}
        </h2>
        <p className="text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
          {t('forgotSubtitle')}
        </p>
      </div>

      {state.error ? (
        <div
          className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 mb-5"
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

      <form
        action={(formData) => {
          setDismissSuccess(false);
          formAction(formData);
        }}
        className="space-y-5"
      >
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-slate-700 mb-1.5"
          >
            {t('email')}{' '}
            <span className="text-danger" aria-hidden="true">*</span>
          </label>
          <input
            id="email"
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('forgotEmailPlaceholder')}
            disabled={pending}
            className="w-full h-11 px-3.5 text-base sm:text-sm text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400"
          />
        </div>

        {/* Tombol Konfirmasi — Seragam rounded-lg (10px) & py-3 text-sm (DESIGN.md) */}
        <button
          type="submit"
          disabled={pending || cooldown > 0}
          className="w-full bg-brand hover:bg-brand-strong disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center cursor-pointer shadow-xs mt-6"
        >
          {pending
            ? t('processing')
            : cooldown > 0
            ? t('resendCooldown', { seconds: cooldown })
            : t('confirmAction')}
        </button>
      </form>

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
