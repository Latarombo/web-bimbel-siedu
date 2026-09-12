'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { registerParent, type RegisterState } from '@/app/actions/register';
import GoogleButton from '@/components/GoogleButton';

const initial: RegisterState = {};

// Checklist syarat password — dihitung real-time saat mengetik.
const passwordRules = [
    { key: 'length', label: 'Minimal 8 karakter', test: (pw: string) => pw.length >= 8 },
] as const;

export default function RegisterForm({
    googleEnabled = false,
}: {
    googleEnabled?: boolean;
}) {
    const [state, formAction, pending] = useActionState(registerParent, initial);
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('');
    const errors = state.fieldErrors ?? {};

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md">
            {/* Heading — headline-lg-mobile 24px/700 → sm:headline-md 20px/600 (DESIGN.md) */}
            <h2 className="text-2xl sm:text-[20px] sm:leading-[1.3] font-bold sm:font-semibold text-slate-900 mb-2">
                Yuk, buat akun Siedu Anda!
            </h2>
            <p className="text-sm text-body mb-8">
                Langkah 1 dari 3 — buat akun orang tua terlebih dahulu.
            </p>

            <form action={formAction} className="space-y-5">
                {/* Email */}
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
                        placeholder="nama@email.com"
                        defaultValue={state.email ?? ''}
                        aria-invalid={errors.email ? true : undefined}
                        aria-describedby={errors.email ? 'email-error' : undefined}
                        className="w-full px-4 py-3 text-base text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400"
                    />
                    {errors.email ? (
                        <p id="email-error" className="mt-1 text-xs text-rose-600">
                            {errors.email}
                        </p>
                    ) : null}
                </div>

                {/* Kata Sandi */}
                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                        Kata Sandi
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="new-password"
                            placeholder="Buat kata sandi"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            aria-invalid={errors.password ? true : undefined}
                            aria-describedby={
                                [errors.password ? 'password-error' : null, 'password-rules']
                                    .filter(Boolean)
                                    .join(' ') || undefined
                            }
                            className="w-full px-4 py-3 pr-12 text-base text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 -m-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none cursor-pointer"
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
                                    aria-hidden="true"
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
                                    aria-hidden="true"
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
                    {/* Checklist real-time menggantikan hint statis */}
                    <ul id="password-rules" className="mt-2 space-y-1">
                        {passwordRules.map((rule) => {
                            const ok = rule.test(password);
                            return (
                                <li
                                    key={rule.key}
                                    className={`flex items-center gap-1.5 text-xs ${
                                        ok ? 'text-emerald-600' : 'text-slate-400'
                                    }`}
                                >
                                    {ok ? (
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
                                    {rule.label}
                                </li>
                            );
                        })}
                    </ul>
                    {errors.password ? (
                        <p id="password-error" className="mt-1 text-xs text-rose-600">
                            {errors.password}
                        </p>
                    ) : null}
                </div>

                {/* Error dari server */}
                {state.error ? (
                    <p
                        className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700"
                        role="alert"
                    >
                        {state.error}
                    </p>
                ) : null}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={pending}
                    className="w-full bg-brand hover:bg-brand-strong disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                    <span>{pending ? 'Memproses...' : 'Daftar'}</span>
                    {!pending && (
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden="true"
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

            {/* Divider — pola identik LoginForm */}
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

            {/* Daftar via Google — user baru otomatis loncat ke step 2, consent
                ditagih di sana; user lama (email bentrok) diarahkan ke login */}
            <GoogleButton
                label="Daftar dengan Akun Google"
                enabled={googleEnabled}
                title="Login Google akan segera tersedia"
            />

            {/* Login Link */}
            <p className="text-center text-sm text-body mt-6">
                Sudah punya akun?{' '}
                <Link
                    href="/login"
                    className="text-brand hover:text-brand-strong font-semibold"
                >
                    Masuk
                </Link>
            </p>
        </div>
    );
}
