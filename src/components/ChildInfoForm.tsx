'use client';

import { useActionState, useState } from 'react';
import { saveChildInfo, type ChildInfoState } from '@/app/actions/child-info';

const initial: ChildInfoState = {};

const JENJANG = [
    { value: 'TK', label: 'TK' },
    { value: 'SD', label: 'SD' },
    { value: 'SMP', label: 'SMP' },
    { value: 'SMA', label: 'SMA' },
] as const;

// Ikon inline kecil di kiri input — feather-style, stroke currentColor
// (mengikuti bahasa ikon wizard: outline, bukan emoji).
function FieldIcon({ d }: { d: string }) {
    return (
        <svg
            className="w-5 h-5 text-slate-400 shrink-0"
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
                d={d}
            />
        </svg>
    );
}

const ICON_USER =
    'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z';
const ICON_PHONE =
    'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z';
const ICON_MAIL =
    'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
const ICON_CALENDAR =
    'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z';

export default function ChildInfoForm({
    parentPhone = '',
}: {
    parentPhone?: string;
}) {
    const [state, formAction, pending] = useActionState(saveChildInfo, initial);
    const errors = state.fieldErrors ?? {};

    // Toggle "No. HP anak sama dengan orang tua" (ref desain): ON → field HP
    // terisi & terkunci dgn nomor ortu; OFF → field bebas (boleh kosong).
    // Default ON hanya bila ortu memang punya nomor terdaftar.
    const ortuPunyaHp = parentPhone.trim() !== '';
    const [hpSama, setHpSama] = useState(ortuPunyaHp);
    // Controlled: perlu bereaksi saat toggle dipindah (defaultValue tidak akan).
    const [hpValue, setHpValue] = useState('');
    const hpTerkunci = hpSama && ortuPunyaHp;

    const inputBase =
        'w-full pl-11 pr-4 py-3 text-base text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/15 focus:border-brand transition-colors placeholder:text-slate-400';

    return (
        <div className="bg-white rounded-3xl shadow-2xl p-8 sm:p-10 w-full max-w-md">
            <h2 className="text-2xl sm:text-[20px] sm:leading-[1.3] font-bold sm:font-semibold text-slate-900 text-center mb-2">
                Lengkapi Informasi Profil Anak
            </h2>
            <p className="text-sm text-body text-center mb-8">
                Langkah 3 dari 3 — anak bisa dikelola kapan saja dari dashboard.
            </p>

            <form action={formAction} className="space-y-5">
                {/* Nama Lengkap Anak — wajib (ref: label + tanda bintang) */}
                <div>
                    <label
                        htmlFor="nama"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                        Masukkan Nama Lengkap Anak{' '}
                        <span className="text-rose-500" aria-hidden="true">
                            *
                        </span>
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                            <FieldIcon d={ICON_USER} />
                        </span>
                        <input
                            id="nama"
                            name="nama"
                            type="text"
                            required
                            autoComplete="off"
                            placeholder="Masukkan Nama Lengkap Anak"
                            defaultValue={state.nama ?? ''}
                            aria-invalid={errors.nama ? true : undefined}
                            aria-describedby={errors.nama ? 'nama-error' : undefined}
                            className={inputBase}
                        />
                    </div>
                    {errors.nama ? (
                        <p id="nama-error" className="mt-1 text-xs text-rose-600">
                            {errors.nama}
                        </p>
                    ) : null}
                </div>

                {/* Tanggal Lahir — wajib (DB NOT NULL + CHECK bukan masa depan +
                    BR#16 duplikat); tidak ada di ref tapi tetap ditampilkan */}
                <div>
                    <label
                        htmlFor="tanggal_lahir"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                        Tanggal Lahir Anak{' '}
                        <span className="text-rose-500" aria-hidden="true">
                            *
                        </span>
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                            <FieldIcon d={ICON_CALENDAR} />
                        </span>
                        <input
                            id="tanggal_lahir"
                            name="tanggal_lahir"
                            type="date"
                            required
                            max={new Date().toISOString().slice(0, 10)}
                            aria-invalid={errors.tanggal_lahir ? true : undefined}
                            aria-describedby={
                                errors.tanggal_lahir ? 'tgl-error' : undefined
                            }
                            className={`${inputBase} text-slate-500`}
                        />
                    </div>
                    {errors.tanggal_lahir ? (
                        <p id="tgl-error" className="mt-1 text-xs text-rose-600">
                            {errors.tanggal_lahir}
                        </p>
                    ) : null}
                </div>

                {/* Pilih Kelas — wajib (label UI "Kelas", kolom DB jenjang_terakhir, BR#13) */}
                <div>
                    <label
                        htmlFor="jenjang_terakhir"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                        Pilih Kelas{' '}
                        <span className="text-rose-500" aria-hidden="true">
                            *
                        </span>
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                            <FieldIcon d={ICON_USER} />
                        </span>
                        <select
                            id="jenjang_terakhir"
                            name="jenjang_terakhir"
                            required
                            defaultValue={state.jenjang_terakhir ?? ''}
                            aria-invalid={
                                errors.jenjang_terakhir ? true : undefined
                            }
                            aria-describedby={
                                errors.jenjang_terakhir
                                    ? 'jenjang-error'
                                    : undefined
                            }
                            className={`${inputBase} appearance-none cursor-pointer pr-10 bg-white`}
                        >
                            <option value="" disabled>
                                Pilih Kelas
                            </option>
                            {JENJANG.map((j) => (
                                <option key={j.value} value={j.value}>
                                    {j.label}
                                </option>
                            ))}
                        </select>
                        <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none">
                            <svg
                                className="w-4 h-4 text-slate-400"
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
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </span>
                    </div>
                    {errors.jenjang_terakhir ? (
                        <p id="jenjang-error" className="mt-1 text-xs text-rose-600">
                            {errors.jenjang_terakhir}
                        </p>
                    ) : null}
                </div>

                {/* Toggle "No. HP anak sama dengan orang tua" (ref desain) */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label
                            htmlFor="hp_sama"
                            className="text-sm font-semibold text-slate-700 cursor-pointer"
                        >
                            No. HP anak sama dengan orang tua
                        </label>
                        {/* Checkbox hidup sebagai switch — nama form hp_sama
                            tidak dikirim ke action (bukan field schema) */}
                        <input
                            id="hp_sama"
                            type="checkbox"
                            role="switch"
                            checked={hpSama}
                            onChange={(e) => setHpSama(e.target.checked)}
                            disabled={!ortuPunyaHp}
                            className="sr-only peer"
                        />
                        <label
                            htmlFor="hp_sama"
                            aria-hidden="true"
                            className="w-11 h-6 rounded-full bg-slate-200 peer-checked:bg-brand relative transition-colors cursor-pointer shrink-0 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
                        />
                    </div>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                            <FieldIcon d={ICON_PHONE} />
                        </span>
                        <input
                            id="nomor_telepon"
                            name="nomor_telepon"
                            type="tel"
                            inputMode="tel"
                            autoComplete="off"
                            placeholder="No. HP anak (opsional)"
                            value={hpTerkunci ? parentPhone : hpValue}
                            onChange={(e) => setHpValue(e.target.value)}
                            readOnly={hpTerkunci}
                            aria-readonly={hpTerkunci}
                            className={`${inputBase} ${
                                hpTerkunci ? 'bg-slate-50 text-slate-500' : ''
                            }`}
                        />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">
                        {ortuPunyaHp
                            ? hpSama
                                ? 'Nomor HP orang tua dipakai sebagai kontak anak.'
                                : 'Kosongkan bila anak tidak punya nomor sendiri.'
                            : 'Orang tua belum mengisi No. HP di langkah 2.'}
                    </p>
                </div>

                {/* Email Anak — opsional, HANYA notifikasi (BR#25) */}
                <div>
                    <label
                        htmlFor="email_notifikasi"
                        className="block text-sm font-semibold text-slate-700 mb-2"
                    >
                        Masukkan Email Anak{' '}
                        <span className="font-normal text-slate-400">
                            (Opsional)
                        </span>
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                            <FieldIcon d={ICON_MAIL} />
                        </span>
                        <input
                            id="email_notifikasi"
                            name="email_notifikasi"
                            type="email"
                            autoComplete="off"
                            placeholder="Masukkan Email Anak (Opsional)"
                            aria-invalid={
                                errors.email_notifikasi ? true : undefined
                            }
                            aria-describedby={
                                errors.email_notifikasi
                                    ? 'email-error'
                                    : undefined
                            }
                            className={inputBase}
                        />
                    </div>
                    {errors.email_notifikasi ? (
                        <p id="email-error" className="mt-1 text-xs text-rose-600">
                            {errors.email_notifikasi}
                        </p>
                    ) : null}
                </div>

                {state.error ? (
                    <p
                        className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700"
                        role="alert"
                    >
                        {state.error}
                    </p>
                ) : null}

                {/* CTA — copy dari ref: "Buat Profil Anak" */}
                <button
                    type="submit"
                    disabled={pending}
                    className="w-full bg-brand hover:bg-brand-strong disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold py-3 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                    <span>{pending ? 'Memproses...' : 'Buat Profil Anak'}</span>
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
        </div>
    );
}
