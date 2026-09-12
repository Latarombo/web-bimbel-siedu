'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { login, type LoginState } from '@/app/actions/login';
import GoogleButton from '@/components/GoogleButton';

const initial: LoginState = {};

export default function LoginForm({
    next,
    googleEnabled = false,
    oauthError,
}: {
    next?: string;
    googleEnabled?: boolean;
    oauthError?: string;
}) {
    const [state, formAction, pending] = useActionState(login, initial);
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md">
            {/* Heading — headline-lg-mobile 24px → sm:headline-md (DESIGN.md typography) */}
            <h2 className="text-2xl sm:text-[20px] sm:leading-[1.3] font-bold text-slate-900 mb-8">
                Yuk, masuk ke akun Siedu Anda!
            </h2>

            {/* Error OAuth — terima dari server page (?error=OAuthAccountNotLinked dll.) */}
            {oauthError ? (
                <p
                    className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700 mb-5"
                    role="alert"
                >
                    {oauthError}
                </p>
            ) : null}

            {/* Form */}
            <form action={formAction} className="space-y-5">
                {next ? <input type="hidden" name="next" value={next} /> : null}

                {/* Email Input */}
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        autoComplete="email"
                        defaultValue={state.email ?? ''}
                        placeholder="nama@email.com"
                        className="w-full px-4 py-3 text-base text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400"
                    />
                </div>

                {/* Password Input */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label
                            htmlFor="password"
                            className="block text-sm font-semibold text-slate-700"
                        >
                            Kata Sandi
                        </label>
                        <Link
                            href="/forgot-password"
                            className="text-sm text-blue-600 hover:text-brand-strong font-medium"
                        >
                            Lupa kata sandi?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="current-password"
                            placeholder="Masukkan kata sandi"
                            className="w-full px-4 py-3 pr-12 text-base text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                            aria-label={
                                showPassword
                                    ? 'Sembunyikan kata sandi'
                                    : 'Tampilkan kata sandi'
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

                {/* Error dari server — body-sm, rose (DESIGN.md error state) */}
                {state.error ? (
                    <p
                        className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700"
                        role="alert"
                    >
                        {state.error}
                    </p>
                ) : null}

                {/* Submit Button — lg 48px, title-sm (DESIGN.md Primary Button) */}
                <button
                    type="submit"
                    disabled={pending}
                    className="w-full bg-brand hover:bg-brand-strong disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                    <span>{pending ? 'Memproses...' : 'Lanjutkan'}</span>
                    {!pending && (
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
                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                            />
                        </svg>
                    )}
                </button>
            </form>
            {/* Divider */}
            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                    <span className="bg-white px-4 text-xs font-medium text-slate-400 tracking-wider">
                        ATAU
                    </span>
                </div>
            </div>

            {/* Google Login — aktif saat kredensial OAuth terpasang; user baru
                ditangkap pages.newUser (step 2), user lama lanjut ke dashboard */}
            <GoogleButton
                label="Masuk dengan Akun Google"
                enabled={googleEnabled}
                title="Login Google akan segera tersedia"
            />

            {/* Sign Up Link — body-sm */}
            <p className="text-center text-sm text-body mt-6">
                Belum punya akun?{' '}
                <Link
                    href="/register"
                    className="text-brand hover:text-brand-strong font-semibold"
                >
                    Daftar
                </Link>
            </p>
        </div>
    );
}
