'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useActionState, useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { saveChildInfo, type ChildInfoState } from '@/app/actions/child-info';
import { DatePicker } from '@/components/ui/date-picker';
import { CardSelect } from '@/components/ui/card-select';
import { useFormDraft } from '@/lib/use-form-draft';
import { StudentAvatar } from '@/components/parent/student-avatar';

const initial: ChildInfoState = {};

interface ChildDraft {
    nama: string;
    tanggal_lahir: string;
    jenjang_terakhir: 'TK' | 'SD' | 'SMP' | 'SMA' | '';
    tingkat: string;
    nomor_telepon: string;
    email_notifikasi: string;
    hpSama: boolean;
}

// Tanggal hari ini di zona WIB
function hariIniWIB(): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Jakarta',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    return `${g('year')}-${g('month')}-${g('day')}`;
}

export const KELAS_OPTIONS = {
    TK: [
        { value: 'TK A', label: 'TK A' },
        { value: 'TK B', label: 'TK B' },
    ],
    SD: [
        { value: 'Kelas 1', label: 'Kelas 1' },
        { value: 'Kelas 2', label: 'Kelas 2' },
        { value: 'Kelas 3', label: 'Kelas 3' },
        { value: 'Kelas 4', label: 'Kelas 4' },
        { value: 'Kelas 5', label: 'Kelas 5' },
        { value: 'Kelas 6', label: 'Kelas 6' },
    ],
    SMP: [
        { value: 'Kelas 7', label: 'Kelas 7' },
        { value: 'Kelas 8', label: 'Kelas 8' },
        { value: 'Kelas 9', label: 'Kelas 9' },
    ],
    SMA: [
        { value: 'Kelas 10', label: 'Kelas 10' },
        { value: 'Kelas 11', label: 'Kelas 11' },
        { value: 'Kelas 12', label: 'Kelas 12' },
    ],
} as const;

// Menghitung estimasi jenjang & kelas berdasarkan usia dari tanggal lahir
export function inferJenjangDanKelasFromBirthDate(birthDateStr: string): {
    jenjang: 'TK' | 'SD' | 'SMP' | 'SMA';
    tingkat: string;
} | null {
    if (!birthDateStr) return null;
    const parts = birthDateStr.split('-');
    if (parts.length !== 3) return null;
    const birthYear = parseInt(parts[0], 10);
    const birthMonth = parseInt(parts[1], 10) - 1;
    const birthDay = parseInt(parts[2], 10);
    if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return null;

    const today = new Date();
    let age = today.getFullYear() - birthYear;
    const m = today.getMonth() - birthMonth;
    if (m < 0 || (m === 0 && today.getDate() < birthDay)) {
        age--;
    }

    if (age <= 4) return { jenjang: 'TK', tingkat: 'TK A' };
    if (age <= 6) return { jenjang: 'TK', tingkat: 'TK B' };
    if (age === 7) return { jenjang: 'SD', tingkat: 'Kelas 1' };
    if (age === 8) return { jenjang: 'SD', tingkat: 'Kelas 2' };
    if (age === 9) return { jenjang: 'SD', tingkat: 'Kelas 3' };
    if (age === 10) return { jenjang: 'SD', tingkat: 'Kelas 4' };
    if (age === 11) return { jenjang: 'SD', tingkat: 'Kelas 5' };
    if (age === 12) return { jenjang: 'SD', tingkat: 'Kelas 6' };
    if (age === 13) return { jenjang: 'SMP', tingkat: 'Kelas 7' };
    if (age === 14) return { jenjang: 'SMP', tingkat: 'Kelas 8' };
    if (age === 15) return { jenjang: 'SMP', tingkat: 'Kelas 9' };
    if (age === 16) return { jenjang: 'SMA', tingkat: 'Kelas 10' };
    if (age === 17) return { jenjang: 'SMA', tingkat: 'Kelas 11' };
    return { jenjang: 'SMA', tingkat: 'Kelas 12' };
}

// Ikon inline kecil di kiri input — feather-style
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
const ICON_GRADUATION =
    'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5';

export default function ChildInfoForm({
    parentPhone = '',
    title,
    subtitle,
    submitLabel,
    redirectTo,
    backHref,
    backLabel,
    showSkip = true,
}: {
    parentPhone?: string;
    title?: string;
    subtitle?: string;
    submitLabel?: string;
    redirectTo?: string;
    backHref?: string;
    backLabel?: string;
    showSkip?: boolean;
}) {
    const t = useTranslations('auth');
    const locale = useLocale();

    const JENJANG_LIST = [
        { value: 'TK', label: 'TK' },
        { value: 'SD', label: 'SD' },
        { value: 'SMP', label: 'SMP' },
        { value: 'SMA', label: 'SMA' },
    ] as const;

    const [state, formAction, pending] = useActionState(saveChildInfo, initial);
    const errors = state.fieldErrors ?? {};

    const ortuPunyaHp = parentPhone.trim() !== '';

    const [draft, setDraftField, setMultipleDraft, clearDraft] = useFormDraft<ChildDraft>(
        'siedu_draft_child_info',
        {
            nama: state.nama ?? '',
            tanggal_lahir: state.tanggal_lahir ?? '',
            jenjang_terakhir: (state.jenjang_terakhir as 'TK' | 'SD' | 'SMP' | 'SMA' | '') ?? '',
            tingkat: state.tingkat ?? '',
            nomor_telepon: state.nomor_telepon ?? '',
            email_notifikasi: state.email_notifikasi ?? '',
            hpSama: ortuPunyaHp,
        }
    );

    // Tanggal lahir & Jenjang & Kelas/Tingkat
    const [tanggalLahir, setTanggalLahir] = useState(draft.tanggal_lahir);
    const [jenjang, setJenjang] = useState<'TK' | 'SD' | 'SMP' | 'SMA' | ''>(draft.jenjang_terakhir);
    const [tingkat, setTingkat] = useState(draft.tingkat);
    const [nama, setNama] = useState(draft.nama);
    const [emailNotifikasi, setEmailNotifikasi] = useState(draft.email_notifikasi);

    // Toggle "No. HP anak sama dengan orang tua"
    const [hpSama, setHpSama] = useState(draft.hpSama);
    const [hpValue, setHpValue] = useState(draft.nomor_telepon);
    const hpTerkunci = hpSama && ortuPunyaHp;

    // Sinkronkan state lokal saat draft selesai dibaca dari sessionStorage
    useEffect(() => {
        if (draft.nama) setNama(draft.nama);
        if (draft.tanggal_lahir) setTanggalLahir(draft.tanggal_lahir);
        if (draft.jenjang_terakhir) setJenjang(draft.jenjang_terakhir);
        if (draft.tingkat) setTingkat(draft.tingkat);
        if (draft.nomor_telepon) setHpValue(draft.nomor_telepon);
        if (draft.email_notifikasi) setEmailNotifikasi(draft.email_notifikasi);
        if (typeof draft.hpSama === 'boolean') setHpSama(draft.hpSama);
    }, [draft]);

    useEffect(() => {
        if (state.tanggal_lahir) {
            setTanggalLahir(state.tanggal_lahir);
        }
        if (state.jenjang_terakhir) {
            setJenjang(state.jenjang_terakhir as 'TK' | 'SD' | 'SMP' | 'SMA');
        }
        if (state.tingkat) {
            setTingkat(state.tingkat);
        }
    }, [state.tanggal_lahir, state.jenjang_terakhir, state.tingkat]);

    const handleDateChange = (date: string) => {
        setTanggalLahir(date);
        const suggested = inferJenjangDanKelasFromBirthDate(date);
        if (suggested) {
            setJenjang(suggested.jenjang);
            setTingkat(suggested.tingkat);
            setMultipleDraft({
                tanggal_lahir: date,
                jenjang_terakhir: suggested.jenjang,
                tingkat: suggested.tingkat,
            });
        } else {
            setDraftField('tanggal_lahir', date);
        }
    };

    const handleJenjangChange = (newJenjang: 'TK' | 'SD' | 'SMP' | 'SMA') => {
        setJenjang(newJenjang);
        const opts = KELAS_OPTIONS[newJenjang];
        const newTingkat = opts && opts.length > 0 ? opts[0].value : '';
        if (newTingkat) {
            setTingkat(newTingkat);
            setMultipleDraft({
                jenjang_terakhir: newJenjang,
                tingkat: newTingkat,
            });
        } else {
            setDraftField('jenjang_terakhir', newJenjang);
        }
    };

    const inputBase =
        'w-full pl-10 sm:pl-11 pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all placeholder:text-slate-400 bg-white';

    const currentKelasOptions = jenjang ? KELAS_OPTIONS[jenjang] : [];

    return (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 w-full max-w-[460px] mx-auto">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-1.5 sm:mb-2">
                {title ?? t('childTitle')}
            </h2>
            {subtitle ? (
                <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">{subtitle}</p>
            ) : (
                <div className="mb-5" />
            )}

            {/* Preview foto profil — seed nama+jenjang, identik dgn hasil setelah save */}
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3">
                <StudentAvatar nama={nama} jenjang={jenjang || null} size="md" />
                <div className="min-w-0">
                    {nama.trim() ? (
                        <p className="truncate text-sm font-bold text-slate-800">{nama.trim()}</p>
                    ) : null}
                    <p className="text-xs text-slate-500">{t('photoAuto')}</p>
                </div>
            </div>

            <form action={formAction} className="space-y-4 sm:space-y-4.5">
                {redirectTo ? (
                    <input type="hidden" name="redirect_to" value={redirectTo} />
                ) : null}

                {/* Nama Lengkap Anak — wajib */}
                <div>
                    <label
                        htmlFor="nama"
                        className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
                    >
                        {t('childFullName')}{' '}
                        <span className="text-danger" aria-hidden="true">
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
                            placeholder={t('childFullName')}
                            value={nama}
                            onChange={(e) => {
                                setNama(e.target.value);
                                setDraftField('nama', e.target.value);
                            }}
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

                {/* Tanggal Lahir — wajib */}
                <div>
                    <label
                        htmlFor="tanggal_lahir"
                        className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
                    >
                        {t('childBirth')}{' '}
                        <span className="text-danger" aria-hidden="true">
                            *
                        </span>
                    </label>
                    <DatePicker
                        id="tanggal_lahir"
                        name="tanggal_lahir"
                        value={tanggalLahir}
                        onChange={handleDateChange}
                        max={hariIniWIB()}
                        placeholder={t('pickBirthDate')}
                        locale={locale}
                        required
                        ariaInvalid={errors.tanggal_lahir ? true : undefined}
                        ariaDescribedby={
                            errors.tanggal_lahir ? 'tgl-error' : undefined
                        }
                    />
                    {errors.tanggal_lahir ? (
                        <p id="tgl-error" className="mt-1.5 text-xs text-rose-600">
                            {errors.tanggal_lahir}
                        </p>
                    ) : null}
                </div>

                {/* Grid 2 Dropdown: 1. Jenjang Pendidikan & 2. Kelas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                    {/* 1. Jenjang Pendidikan */}
                    <div>
                        <label
                            htmlFor="jenjang_terakhir"
                            className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
                        >
                            {t('educationLevel')}{' '}
                            <span className="text-danger" aria-hidden="true">
                                *
                            </span>
                        </label>
                        <CardSelect
                            id="jenjang_terakhir"
                            name="jenjang_terakhir"
                            required
                            value={jenjang}
                            onChange={(val) =>
                                handleJenjangChange(
                                    val as 'TK' | 'SD' | 'SMP' | 'SMA'
                                )
                            }
                            options={JENJANG_LIST}
                            placeholder={t('selectEducationLevel')}
                            modalTitle={t('educationLevel')}
                            icon={<FieldIcon d={ICON_GRADUATION} />}
                            ariaInvalid={Boolean(errors.jenjang_terakhir)}
                            ariaDescribedby={
                                errors.jenjang_terakhir
                                    ? 'jenjang-error'
                                    : undefined
                            }
                        />
                        {errors.jenjang_terakhir ? (
                            <p id="jenjang-error" className="mt-1 text-xs text-rose-600">
                                {errors.jenjang_terakhir}
                            </p>
                        ) : null}
                    </div>

                    {/* 2. Kelas */}
                    <div>
                        <label
                            htmlFor="tingkat"
                            className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
                        >
                            {t('classLevel')}{' '}
                            <span className="text-danger" aria-hidden="true">
                                *
                            </span>
                        </label>
                        <CardSelect
                            id="tingkat"
                            name="tingkat"
                            required
                            value={tingkat}
                            onChange={(val) => {
                                setTingkat(val);
                                setDraftField('tingkat', val);
                            }}
                            disabled={!jenjang}
                            options={currentKelasOptions}
                            placeholder={t('selectClassPrompt')}
                            modalTitle={t('classLevel')}
                            icon={<FieldIcon d={ICON_USER} />}
                            ariaInvalid={Boolean(errors.tingkat)}
                            ariaDescribedby={
                                errors.tingkat ? 'tingkat-error' : undefined
                            }
                        />
                        {errors.tingkat ? (
                            <p id="tingkat-error" className="mt-1 text-xs text-rose-600">
                                {errors.tingkat}
                            </p>
                        ) : null}
                    </div>
                </div>

                {/* Nomor Telepon Anak — wajib, bisa disamakan dengan orang tua */}
                <div>
                    <label
                        htmlFor="nomor_telepon"
                        className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2"
                    >
                        {t('childPhoneLabel')}{' '}
                        <span className="text-danger" aria-hidden="true">
                            *
                        </span>
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                            <FieldIcon d={ICON_PHONE} />
                        </span>
                        <input
                            id="nomor_telepon"
                            name="nomor_telepon"
                            type="tel"
                            inputMode="tel"
                            required
                            autoComplete="off"
                            placeholder={t('childPhonePlaceholder')}
                            value={hpTerkunci ? parentPhone : hpValue}
                            onChange={(e) => {
                                setHpValue(e.target.value);
                                setDraftField('nomor_telepon', e.target.value);
                            }}
                            readOnly={hpTerkunci}
                            aria-readonly={hpTerkunci}
                            aria-invalid={errors.nomor_telepon ? true : undefined}
                            aria-describedby={
                                errors.nomor_telepon ? 'hp-error' : undefined
                            }
                            className={`${inputBase} ${
                                hpTerkunci ? 'bg-slate-50 text-slate-500' : ''
                            }`}
                        />
                    </div>
                    {ortuPunyaHp && (
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
                                        setDraftField('hpSama', checked);
                                        if (!checked) {
                                            setHpValue('');
                                            setDraftField('nomor_telepon', '');
                                        } else {
                                            setHpValue(parentPhone);
                                            setDraftField('nomor_telepon', parentPhone);
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
                    {errors.nomor_telepon ? (
                        <p id="hp-error" className="mt-1 text-xs text-rose-600">
                            {errors.nomor_telepon}
                        </p>
                    ) : null}
                </div>

                {/* Email Anak — opsional, HANYA untuk notifikasi (BR#25) */}
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
                            <FieldIcon d={ICON_MAIL} />
                        </span>
                        <input
                            id="email_notifikasi"
                            name="email_notifikasi"
                            type="email"
                            autoComplete="off"
                            placeholder={t('childEmail')}
                            value={emailNotifikasi}
                            onChange={(e) => {
                                setEmailNotifikasi(e.target.value);
                                setDraftField('email_notifikasi', e.target.value);
                            }}
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

                {/* Action Buttons Group (Tombol Utama & Tombol Sekunder/Lewati) */}
                <div className="pt-2 space-y-2.5">
                    <button
                        type="submit"
                        disabled={pending}
                        className="w-full bg-brand hover:bg-brand-strong disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm sm:text-base font-semibold py-3 sm:py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center active:scale-[0.99] cursor-pointer"
                    >
                        <span>{pending ? t('processing') : (submitLabel ?? t('createChild'))}</span>
                    </button>

                    {backHref ? (
                        <Link
                            href={backHref}
                            className="w-full flex items-center justify-center py-2.5 sm:py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-[0.99] cursor-pointer shadow-xs"
                        >
                            <span>{backLabel ?? (locale.startsWith('en') ? 'Cancel & Back to Dashboard' : 'Batal & Kembali ke Dashboard')}</span>
                        </Link>
                    ) : showSkip ? (
                        <Link
                            href="/home"
                            className="w-full flex items-center justify-center py-2.5 sm:py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold transition-all duration-150 active:scale-[0.99] cursor-pointer shadow-xs"
                        >
                            <span>{t('skipChildStep')}</span>
                        </Link>
                    ) : null}
                </div>
            </form>
        </div>
    );
}
