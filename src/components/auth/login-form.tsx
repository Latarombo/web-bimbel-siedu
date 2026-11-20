'use client';
import { useTranslations } from 'next-intl';

import { useActionState, useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { login, type LoginState } from '@/app/actions/login';
import GoogleButton from '@/components/GoogleButton';
import { useFormDraft } from '@/lib/use-form-draft';

const initial: LoginState = {};

export default function LoginForm({
    next,
    googleEnabled = false,
    oauthError,
    resetSuccess = false,
}: {
    next?: string;
    googleEnabled?: boolean;
    oauthError?: string;
    resetSuccess?: boolean;
}) {
    const t = useTranslations('auth');
    const [state, formAction, pending] = useActionState(login, initial);
    const [showPassword, setShowPassword] = useState(false);

    const { draft, setDraftField } = useFormDraft('siedu_draft_login', {
        email: '',
    });

    useEffect(() => {
        if (state.email && !draft.email) {
            setDraftField('email', state.email);
        }
    }, [state.email, draft.email, setDraftField]);

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-6 sm:mb-8">
                {t('loginTitle')}
            </h2>

            {/* Banner Sukses Reset Password */}
            {resetSuccess ? (
                <div
                    className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800 mb-5 flex items-center gap-2.5"
                    role="status"
                >
                    <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('resetSuccessAlert')}</span>
                </div>
            ) : null}

            {/* Error OAuth — terima dari server page (?error=OAuthAccountNotLinked dll.) */}
            {oauthError ? (
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
                    <div className="flex-1 leading-relaxed">{oauthError}</div>
                </div>
            ) : null}

            {/* Error dari server — banner rose dengan ikon lingkaran seru sesuai referensi */}
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

            {/* Form */}
            <form action={formAction} className="space-y-5">
                {next ? <input type="hidden" name="next" value={next} /> : null}

                {/* Email Input */}
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
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        value={draft.email}
                        onChange={(e) => setDraftField('email', e.target.value)}
                        placeholder={t('emailPlaceholder')}
                        className="w-full h-11 px-3.5 text-base sm:text-sm text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400"
                    />
                </div>

                {/* Password Input */}
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label
                            htmlFor="password"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            {t('password')}{' '}
                            <span className="text-danger" aria-hidden="true">*</span>
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-xs text-blue-600 hover:text-brand-strong font-medium transition-colors"
                        >
                            {t('forgotLink')}
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            placeholder={t('passwordPlaceholder')}
                            className="w-full h-11 px-3.5 pr-12 text-base sm:text-sm text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none cursor-pointer transition-colors"
                            aria-label={
                                showPassword
                                    ? t('hidePassword')
                                    : t('showPassword')
                            }
                        >
                            {showPassword ? (
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                    />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>

                {/* Submit Button — lg 48px, title-sm (DESIGN.md Primary Button) */}
                <button
                    type="submit"
                    disabled={pending}
                    className="w-full bg-brand hover:bg-brand-strong disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center cursor-pointer shadow-xs"
                >
                    <span>{pending ? t('processing') : t('login')}</span>
                </button>
            </form>
            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-xs font-medium text-slate-600 tracking-wider">
                        {t('or')}
                    </span>
                </div>
            </div>

            {/* Google Login — aktif saat kredensial OAuth terpasang; user baru
                ditangkap pages.newUser (step 2), user lama lanjut ke dashboard */}
            <GoogleButton
                label={t('googleLogin')}
                enabled={googleEnabled}
                title={t('googleSoon')}
            />

            {/* Sign Up Link — body-sm */}
            <p className="text-center text-sm text-body mt-6">
                {t('noAccount')}{' '}
                <Link
                    href="/register"
                    className="text-brand hover:text-brand-strong font-semibold"
                >
                    {t('register')}
                </Link>
            </p>
        </div>
    );
}
