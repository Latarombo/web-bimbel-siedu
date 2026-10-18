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

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      {email ? (
        <div className="rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
          <span className="text-slate-500">{t('email')}:</span>{' '}
          <strong className="font-semibold text-slate-900">{email}</strong>
        </div>
      ) : null}

      {state.error ? (
        <div
          className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      {/* Input Password Baru */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-semibold text-slate-700 mb-2"
        >
          {t('newPassword')}{' '}
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
            className={`w-full px-4 py-3 pr-12 text-base text-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400 ${
              state.fieldErrors?.password
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                : 'border-slate-200'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showPassword ? t('hidePassword') : t('showPassword')}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {state.fieldErrors?.password ? (
          <p className="mt-1.5 text-xs text-rose-600 font-medium">
            {state.fieldErrors.password}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-slate-500">
            {t('minimumEight')}
          </p>
        )}
      </div>

      {/* Input Konfirmasi Password */}
      <div>
        <label
          htmlFor="password_confirm"
          className="block text-sm font-semibold text-slate-700 mb-2"
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
            className={`w-full px-4 py-3 pr-12 text-base text-slate-800 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400 ${
              isMismatch || state.fieldErrors?.password_confirm
                ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/15'
                : 'border-slate-200'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showPasswordConfirm ? t('hidePassword') : t('showPassword')}
          >
            {showPasswordConfirm ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
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

      {/* Tombol Simpan */}
      <button
        type="submit"
        disabled={pending || isMismatch}
        className="w-full bg-brand hover:bg-brand-strong disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center cursor-pointer shadow-xs mt-6"
      >
        {pending ? t('resettingPassword') : t('resetPassword')}
      </button>

      {/* Link Kembali ke login */}
      <p className="mt-4 text-center">
        <Link
          href="/login"
          className="text-sm font-semibold text-brand hover:text-brand-strong hover:underline transition-colors"
        >
          {t('backLogin')}
        </Link>
      </p>
    </form>
  );
}
