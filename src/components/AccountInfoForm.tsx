'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { saveAccountInfo, type AccountInfoState } from '@/app/actions/account-info';

const initial: AccountInfoState = {};

export default function AccountInfoForm({
    needsConsent = false,
    isGoogle = false,
    currentName = '',
}: {
    needsConsent?: boolean;
    isGoogle?: boolean;
    currentName?: string;
}) {
    const [state, formAction, pending] = useActionState(saveAccountInfo, initial);
    const errors = state.fieldErrors ?? {};

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md">
            <h2 className="text-2xl sm:text-[20px] sm:leading-[1.3] font-bold sm:font-semibold text-slate-900 mb-2">
                Lengkapi Informasi Akun
            </h2>
            <p className="text-sm text-body mb-8">
                Langkah 2 dari 3 — lengkapi data diri Anda untuk komunikasi sekolah.
            </p>

            {/* Akun via Google: pengingat consent yang ditagih di step 2 karena
                melewati step 1 (PRD F1) */}
            {needsConsent && isGoogle ? (
                <div className="mb-6 rounded-lg bg-blue-50 px-4 py-3 text-sm text-slate-600">
                    Anda mendaftar melalui Akun Google. Mohon lengkapi persetujuan
                    berikut untuk melanjutkan.
                </div>
            ) : null}

            <form action={formAction} className="space-y-5">
                {/* Nama Lengkap — pindah dari step 1; praisi nama sementara
                    (prefix email) atau nama profil Google */}
                <div>
                    <label
                        htmlFor="name"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                        Nama Lengkap
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        autoComplete="name"
                        placeholder="Nama sesuai identitas"
                        defaultValue={state.name ?? currentName}
                        aria-invalid={errors.name ? true : undefined}
                        aria-describedby={errors.name ? 'name-error' : undefined}
                        className="w-full px-4 py-3 text-base text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400"
                    />
                    {errors.name ? (
                        <p id="name-error" className="mt-1 text-xs text-rose-600">
                            {errors.name}
                        </p>
                    ) : null}
                </div>

                {/* Nomor HP */}
                <div>
                    <label
                        htmlFor="nomor_telepon"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                        Nomor HP
                    </label>
                    <input
                        id="nomor_telepon"
                        name="nomor_telepon"
                        type="tel"
                        autoComplete="tel"
                        placeholder="08xxxxxxxxxx"
                        className="w-full px-4 py-3 text-base text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400"
                    />
                </div>

                {/* Alamat */}
                <div>
                    <label
                        htmlFor="alamat"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                        Alamat
                    </label>
                    <textarea
                        id="alamat"
                        name="alamat"
                        rows={3}
                        placeholder="Alamat tempat tinggal"
                        className="w-full px-4 py-3 text-base text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400 resize-y"
                    />
                </div>

                {/* Consent (PRD F1) — ditagih di step 2 (pindah dari step 1);
                    tampil hanya bila belum pernah disetujui */}
                {needsConsent ? (
                    <fieldset className="space-y-3 pt-1">
                        <legend className="sr-only">Persetujuan</legend>
                        <div className="flex items-start gap-3">
                            <input
                                id="consent_privasi"
                                name="consent_privasi"
                                type="checkbox"
                                required
                                aria-invalid={errors.consent_privasi ? true : undefined}
                                aria-describedby={
                                    errors.consent_privasi || errors.consent_wali
                                        ? 'consent-error'
                                        : undefined
                                }
                                className="mt-0.5 h-5 w-5 shrink-0 accent-brand cursor-pointer"
                            />
                            <label
                                htmlFor="consent_privasi"
                                className="text-sm text-slate-600 leading-snug cursor-pointer"
                            >
                                Saya telah membaca dan memahami{' '}
                                <Link
                                    href="/privacy-policy"
                                    className="text-brand hover:text-brand-strong font-medium"
                                >
                                    Kebijakan Privasi
                                </Link>{' '}
                                dan{' '}
                                <Link
                                    href="/terms"
                                    className="text-brand hover:text-brand-strong font-medium"
                                >
                                    Syarat &amp; Ketentuan
                                </Link>
                                , dan memberikan persetujuan eksplisit atas pemrosesan
                                data pribadi saya untuk tujuan sebagaimana diatur dalam
                                Kebijakan Privasi
                            </label>
                        </div>
                        <div className="flex items-start gap-3">
                            <input
                                id="consent_wali"
                                name="consent_wali"
                                type="checkbox"
                                required
                                aria-invalid={errors.consent_wali ? true : undefined}
                                aria-describedby={
                                    errors.consent_privasi || errors.consent_wali
                                        ? 'consent-error'
                                        : undefined
                                }
                                className="mt-0.5 h-5 w-5 shrink-0 accent-brand cursor-pointer"
                            />
                            <label
                                htmlFor="consent_wali"
                                className="text-sm text-slate-600 leading-snug cursor-pointer"
                            >
                                Saya adalah orang tua atau wali sah dari anak yang
                                datanya saya cantumkan, dan memberikan persetujuan atas
                                pemrosesan data pribadi anak tersebut
                            </label>
                        </div>
                        {errors.consent_privasi || errors.consent_wali ? (
                            <p id="consent-error" className="text-xs text-rose-600">
                                {errors.consent_privasi ?? errors.consent_wali}
                            </p>
                        ) : null}
                    </fieldset>
                ) : null}

                {state.error ? (
                    <p
                        className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700"
                        role="alert"
                    >
                        {state.error}
                    </p>
                ) : null}

                {/* Submit — gaya Primary Button LoginForm */}
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
        </div>
    );
}
