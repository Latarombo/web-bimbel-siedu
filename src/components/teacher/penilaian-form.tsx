'use client';

import { useState, useMemo, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import {
    savePenilaianBatch,
    tarikPenilaian,
    hapusPenilaian,
} from '@/app/actions/teacher';
import { Search, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { UnderlineTabs } from '@/components/ui/underline-tabs';

export interface StudentAssessmentRow {
    pendaftaranId: number;
    nama: string;
    statusHasil: 'belum_dinilai' | 'dinilai' | 'tidak_ikut';
    nilai: number | string | null;
    catatan: string | null;
    jenjang?: string | null;
}

interface PenilaianFormProps {
    kelasId: number;
    penilaianId?: number;
    initialNama?: string;
    initialTanggal?: string;
    initialNilaiMaksimum?: number | string;
    initialDraf?: boolean;
    diterbitkanPada?: string | null;
    initialSesiId?: number | null;
    sessions?: { id: number; label: string }[];
    siswa: StudentAssessmentRow[];
}

const MAX_SCORE = 100;

export function PenilaianForm({
    kelasId,
    penilaianId,
    nama: _ignoredNama,
    initialNama = '',
    initialTanggal,
    initialDraf = true,
    diterbitkanPada,
    initialSesiId = null,
    sessions = [],
    siswa: initialSiswa,
}: PenilaianFormProps & { nama?: string }) {
    const t = useTranslations('teacher');
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'grading' | 'settings'>(
        'grading',
    );

    const [nama, setNama] = useState(initialNama);
    const [tanggal, setTanggal] = useState(
        initialTanggal ?? new Date().toISOString().slice(0, 10),
    );
    const [isDraf, setIsDraf] = useState(initialDraf);
    const [publishedAt, setPublishedAt] = useState<string | null>(
        diterbitkanPada ?? null,
    );
    const [sesiId, setSesiId] = useState<number | null>(initialSesiId ?? null);

    const [studentRows, setStudentRows] = useState<
        Record<
            number,
            {
                statusHasil: 'belum_dinilai' | 'dinilai' | 'tidak_ikut';
                nilai: string;
                catatan: string;
            }
        >
    >(() => {
        const map: Record<
            number,
            {
                statusHasil: 'belum_dinilai' | 'dinilai' | 'tidak_ikut';
                nilai: string;
                catatan: string;
            }
        > = {};
        for (const s of initialSiswa) {
            map[s.pendaftaranId] = {
                statusHasil: s.statusHasil,
                nilai: s.nilai != null ? String(s.nilai) : '',
                catatan: s.catatan ?? '',
            };
        }
        return map;
    });

    const [searchQuery, setSearchQuery] = useState('');

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Filtered Students List
    const filteredStudents = useMemo(() => {
        return initialSiswa.filter((s) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                if (!s.nama.toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [initialSiswa, searchQuery]);

    const handleStatusChange = (
        pId: number,
        statusHasil: 'belum_dinilai' | 'dinilai' | 'tidak_ikut',
    ) => {
        setStudentRows((prev) => ({
            ...prev,
            [pId]: {
                ...prev[pId],
                statusHasil,
                nilai: statusHasil === 'dinilai' ? prev[pId].nilai : '',
            },
        }));
    };

    const handleNilaiChange = (pId: number, val: string) => {
        setStudentRows((prev) => ({
            ...prev,
            [pId]: {
                ...prev[pId],
                nilai: val,
                statusHasil:
                    val.trim() !== '' ? 'dinilai' : prev[pId].statusHasil,
            },
        }));
    };

    const handleCatatanChange = (pId: number, val: string) => {
        setStudentRows((prev) => ({
            ...prev,
            [pId]: {
                ...prev[pId],
                catatan: val,
            },
        }));
    };

    const handleMarkAllRated = () => {
        const maxVal = '100';
        setStudentRows((prev) => {
            const next = { ...prev };
            for (const s of initialSiswa) {
                next[s.pendaftaranId] = {
                    ...next[s.pendaftaranId],
                    statusHasil: 'dinilai',
                    nilai:
                        next[s.pendaftaranId].nilai.trim() !== ''
                            ? next[s.pendaftaranId].nilai
                            : maxVal,
                };
            }
            return next;
        });
    };

    const handleClearAllScores = () => {
        setStudentRows((prev) => {
            const next = { ...prev };
            for (const s of initialSiswa) {
                next[s.pendaftaranId] = {
                    ...next[s.pendaftaranId],
                    statusHasil: 'belum_dinilai',
                    nilai: '',
                };
            }
            return next;
        });
    };

    const handleSubmit = (aksi: 'simpan_draf' | 'terbitkan') => {
        if (!nama.trim()) {
            setErrorMsg(t('assessmentNameRequired'));
            return;
        }

        for (const s of initialSiswa) {
            const cur = studentRows[s.pendaftaranId];
            if (
                cur &&
                cur.statusHasil === 'dinilai' &&
                cur.nilai.trim() !== ''
            ) {
                const valNum = Number(cur.nilai);
                if (isNaN(valNum) || valNum < 0 || valNum > MAX_SCORE) {
                    setErrorMsg(
                        `${s.nama}: ${t('scoreOutOfRange', { max: MAX_SCORE })}`,
                    );
                    return;
                }
            }
        }

        const formData = new FormData();
        formData.append('kelas_id', String(kelasId));
        if (penilaianId) {
            formData.append('penilaian_id', String(penilaianId));
        }
        if (sesiId) {
            formData.append('sesi_id', String(sesiId));
        }
        formData.append('nama', nama.trim());
        formData.append('tanggal', tanggal);
        formData.append('nilai_maksimum', '100');
        formData.append('aksi', aksi);

        for (const s of initialSiswa) {
            const cur = studentRows[s.pendaftaranId];
            if (cur) {
                formData.append(`status_${s.pendaftaranId}`, cur.statusHasil);
                formData.append(
                    `nilai_${s.pendaftaranId}`,
                    cur.statusHasil === 'dinilai' ? cur.nilai : '',
                );
                formData.append(`catatan_${s.pendaftaranId}`, cur.catatan);
            }
        }

        setErrorMsg(null);
        setSuccessMsg(null);

        startTransition(async () => {
            const res = await savePenilaianBatch({ ok: false }, formData);
            if (res?.error) {
                setErrorMsg(res.error);
            } else {
                setIsDraf(aksi === 'simpan_draf');
                if (aksi === 'terbitkan') {
                    setPublishedAt(new Date().toISOString());
                    setSuccessMsg(t('assessmentPublished'));
                } else {
                    setSuccessMsg(t('assessmentSaved'));
                }
            }
        });
    };

    const handleWithdraw = () => {
        if (!penilaianId) return;
        if (!confirm(t('withdrawConfirm'))) return;

        const formData = new FormData();
        formData.append('penilaian_id', String(penilaianId));

        setErrorMsg(null);
        setSuccessMsg(null);

        startTransition(async () => {
            const res = await tarikPenilaian({ ok: false }, formData);
            if (res?.error) {
                setErrorMsg(res.error);
            } else {
                setIsDraf(true);
                setPublishedAt(null);
                setSuccessMsg(t('assessmentWithdrawn'));
            }
        });
    };

    const handleDelete = () => {
        if (!penilaianId) return;
        if (!confirm(t('deleteAssessmentConfirm'))) return;

        const formData = new FormData();
        formData.append('penilaian_id', String(penilaianId));

        setErrorMsg(null);
        setSuccessMsg(null);

        startTransition(async () => {
            const res = await hapusPenilaian({ ok: false }, formData);
            if (res?.error) {
                setErrorMsg(res.error);
            } else {
                router.push(`/teacher/classes/${kelasId}`);
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* State Feedback Alerts */}
            {errorMsg ? (
                <div
                    role="alert"
                    className="flex items-center justify-between gap-2 rounded-lg border border-rose-200 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-xs font-medium text-rose-800 dark:text-rose-200"
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                        <span>{errorMsg}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setErrorMsg(null)}
                        className="text-xs font-bold text-rose-700 hover:text-rose-900 dark:text-rose-300 cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            ) : null}

            {successMsg ? (
                <div
                    role="status"
                    className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-200"
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <span>{successMsg}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSuccessMsg(null)}
                        className="text-xs font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 cursor-pointer"
                    >
                        Tutup
                    </button>
                </div>
            ) : null}

            {/* 2. Canonical Underline Tab Navigation with sliding indicator */}
            <UnderlineTabs
                tabs={[
                    { id: 'grading', label: 'Daftar Nilai Siswa' },
                    { id: 'settings', label: 'Pengaturan Asesmen' },
                ]}
                activeTab={activeTab}
                onChange={setActiveTab}
                ariaLabel="Tabs Penilaian & Pengaturan"
                layoutId="teacher-penilaian-tabs"
            />

            {/* 3. Tab Panels */}
            {activeTab === 'grading' ? (
                <section aria-label="Lembar Nilai Siswa" className="space-y-4">
                    {/* Standalone Control Toolbar: Search Bar on Left, Quick Actions on Right */}
                    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                        {/* Live Search Input (Left) */}
                        <div className="relative w-full sm:w-64">
                            <label
                                htmlFor="search-student"
                                className="sr-only"
                            >
                                Cari siswa
                            </label>
                            <Search
                                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                                aria-hidden="true"
                            />
                            <input
                                id="search-student"
                                type="search"
                                maxLength={100}
                                autoComplete="off"
                                value={searchQuery}
                                onChange={(e) =>
                                    setSearchQuery(e.target.value)
                                }
                                placeholder="Cari nama siswa…"
                                className="h-9 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Hapus kata kunci pencarian"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20"
                                >
                                    <X
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </button>
                            )}
                        </div>

                        {/* Quick Actions (Right) */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleMarkAllRated}
                                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 cursor-pointer"
                            >
                                <span>Beri Nilai Maks Semua</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAllScores}
                                className="inline-flex h-9 items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 text-xs font-semibold text-rose-600 dark:text-rose-400 shadow-2xs transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 hover:border-rose-300 dark:hover:border-rose-800 cursor-pointer"
                            >
                                <span>Reset</span>
                            </button>
                        </div>
                    </div>

                    {/* Table Spreadsheet Container (Matching class-detail-view style) */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
                        <div
                            tabIndex={0}
                            role="region"
                            aria-label="Tabel spreadsheet penilaian siswa"
                            className="w-full overflow-x-auto overscroll-x-contain focus:outline-hidden focus:ring-1 focus:ring-blue-600/30 touch-pan-x"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            <table className="w-full min-w-[700px] text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        <th
                                            scope="col"
                                            className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center"
                                        >
                                            No
                                        </th>
                                        <th
                                            scope="col"
                                            className="sticky left-12 z-20 min-w-[150px] max-w-[220px] bg-slate-50 dark:bg-slate-800 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
                                        >
                                            Siswa
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-56 px-4 py-3 text-center whitespace-nowrap"
                                        >
                                            Status Penilaian
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-28 px-4 py-3 text-right whitespace-nowrap"
                                        >
                                            Nilai
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Catatan & Umpan Balik Guru
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {filteredStudents.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={5}
                                                className="py-12 text-center text-slate-500 dark:text-slate-400"
                                            >
                                                Tidak ada siswa yang cocok
                                                dengan pencarian &quot;
                                                {searchQuery}&quot;.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredStudents.map((s, idx) => {
                                            const cur = studentRows[
                                                s.pendaftaranId
                                            ] ?? {
                                                statusHasil: 'belum_dinilai',
                                                nilai: '',
                                                catatan: '',
                                            };

                                            return (
                                                <tr
                                                    key={s.pendaftaranId}
                                                    className="group/row relative border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                                                >
                                                    {/* 1. Nomor (Sticky Left 0) */}
                                                    <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs transition-colors">
                                                        {idx + 1}
                                                    </td>

                                                    {/* 2. Nama Siswa (Sticky Left 12) */}
                                                    <td className="sticky left-12 z-10 min-w-[150px] max-w-[220px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                                                        <span
                                                            className="font-medium text-slate-950 dark:text-slate-50 text-sm truncate block"
                                                            title={s.nama}
                                                        >
                                                            {s.nama}
                                                        </span>
                                                    </td>

                                                    {/* 3. Status Penilaian (Radio Button: Dinilai & Tidak Ikut) */}
                                                    <td className="py-3 px-4 whitespace-nowrap text-center">
                                                        <div className="inline-flex items-center justify-center gap-4 text-xs font-medium">
                                                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors">
                                                                <input
                                                                    type="radio"
                                                                    name={`status_penilaian_${s.pendaftaranId}`}
                                                                    value="dinilai"
                                                                    checked={
                                                                        cur.statusHasil ===
                                                                        'dinilai'
                                                                    }
                                                                    onChange={() =>
                                                                        handleStatusChange(
                                                                            s.pendaftaranId,
                                                                            'dinilai',
                                                                        )
                                                                    }
                                                                    className="size-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                                                                />
                                                                <span>
                                                                    Dinilai
                                                                </span>
                                                            </label>

                                                            <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors">
                                                                <input
                                                                    type="radio"
                                                                    name={`status_penilaian_${s.pendaftaranId}`}
                                                                    value="tidak_ikut"
                                                                    checked={
                                                                        cur.statusHasil ===
                                                                        'tidak_ikut'
                                                                    }
                                                                    onChange={() =>
                                                                        handleStatusChange(
                                                                            s.pendaftaranId,
                                                                            'tidak_ikut',
                                                                        )
                                                                    }
                                                                    className="size-4 text-rose-600 focus:ring-rose-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                                                                />
                                                                <span>
                                                                    Tidak Ikut
                                                                </span>
                                                            </label>
                                                        </div>
                                                    </td>

                                                    {/* 4. Nilai (Clean inline input) */}
                                                    <td className="py-3 px-4 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end">
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                min="0"
                                                                max={MAX_SCORE}
                                                                disabled={
                                                                    cur.statusHasil ===
                                                                    'tidak_ikut'
                                                                }
                                                                value={
                                                                    cur.nilai
                                                                }
                                                                onChange={(e) =>
                                                                    handleNilaiChange(
                                                                        s.pendaftaranId,
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                aria-label={`Nilai untuk ${s.nama}`}
                                                                placeholder="-"
                                                                className="w-16 py-1 px-1.5 text-right font-medium text-slate-900 dark:text-slate-100 tabular-nums text-xs sm:text-sm bg-transparent rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed placeholder:text-slate-400 dark:placeholder:text-slate-600"
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* 5. Catatan & Umpan Balik Guru (Clean inline input) */}
                                                    <td className="py-3 px-4">
                                                        <input
                                                            type="text"
                                                            maxLength={1000}
                                                            value={cur.catatan}
                                                            onChange={(e) =>
                                                                handleCatatanChange(
                                                                    s.pendaftaranId,
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            aria-label={`Catatan untuk ${s.nama}`}
                                                            placeholder={
                                                                t(
                                                                    'notesPlaceholder',
                                                                ) ||
                                                                'Tambah catatan...'
                                                            }
                                                            className="w-full py-1 px-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 bg-transparent rounded border border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-600 dark:focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none transition-colors placeholder:text-slate-400/80 dark:placeholder:text-slate-500"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Standalone Action Footer */}
                    <div className="flex flex-wrap items-center justify-end gap-3 py-2">
                        {!isDraf && penilaianId ? (
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={handleWithdraw}
                                    className="inline-flex min-h-10 w-full sm:w-auto items-center justify-center rounded-lg border border-amber-300 dark:border-amber-800 px-4 py-2 text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors disabled:opacity-50 cursor-pointer"
                                >
                                    {t('withdrawToDraft')}
                                </button>
                            ) : null}

                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleSubmit('simpan_draf')}
                                className="inline-flex min-h-10 w-full sm:w-auto items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                            >
                                {isPending ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </span>
                                ) : (
                                    <span>{t('saveDraft')}</span>
                                )}
                            </button>

                            <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleSubmit('terbitkan')}
                                className="inline-flex min-h-10 w-full sm:w-auto items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                                {isPending ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </span>
                                ) : (
                                    <span>
                                        {isDraf
                                            ? t('publishToParents')
                                            : t('saveChanges')}
                                    </span>
                                )}
                            </button>
                        </div>
                </section>
            ) : (
                <section aria-label="Pengaturan Asesmen">
                    {/* Card matching SessionJournalForm */}
                    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xs">
                        <div className="mb-6 border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-base font-bold text-slate-950 dark:text-slate-50">
                                    Informasi & Pengaturan Asesmen
                                </h2>
                                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                                    Atur nama tugas/ujian, tanggal pelaksanaan,
                                    dan batas skor maksimum penilaian.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-bold border ${
                                        isDraf
                                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    }`}
                                >
                                    {isDraf
                                        ? t('draftStatus')
                                        : t('publishedStatus')}
                                </span>
                                {!isDraf && publishedAt && (
                                    <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                                        · Diterbitkan:{' '}
                                        {new Date(
                                            publishedAt,
                                        ).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric',
                                            timeZone: 'Asia/Jakarta',
                                        })}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-3">
                                <div>
                                    <label
                                        htmlFor="assessment-name"
                                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
                                    >
                                        {t('assessmentName')}{' '}
                                        <span className="text-rose-500 font-bold ml-0.5">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        id="assessment-name"
                                        type="text"
                                        required
                                        maxLength={100}
                                        value={nama}
                                        onChange={(e) =>
                                            setNama(e.target.value)
                                        }
                                        placeholder={t(
                                            'assessmentNamePlaceholder',
                                        )}
                                        className="w-full h-11 sm:h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 sm:px-4 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="assessment-date"
                                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
                                    >
                                        {t('assessmentDate')}{' '}
                                        <span className="text-rose-500 font-bold ml-0.5">
                                            *
                                        </span>
                                    </label>
                                    <DatePicker
                                        id="assessment-date"
                                        value={tanggal}
                                        onChange={setTanggal}
                                        required
                                    />
                                </div>
                            </div>

                            {sessions.length > 0 && (
                                <div>
                                    <label
                                        htmlFor="assessment-session"
                                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
                                    >
                                        {t('linkedSession')} (Opsional)
                                    </label>
                                    <select
                                        id="assessment-session"
                                        value={sesiId ?? ''}
                                        onChange={(e) =>
                                            setSesiId(
                                                e.target.value
                                                    ? Number(e.target.value)
                                                    : null,
                                            )
                                        }
                                        className="w-full h-11 sm:h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 sm:px-4 text-base sm:text-sm text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors cursor-pointer"
                                    >
                                        <option value="">
                                            {t('noLinkedSession')}
                                        </option>
                                        {sessions.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.label}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        Tugas ini akan terhubung ke sesi
                                        pertemuan kelas yang dipilih.
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    disabled={isPending}
                                    onClick={() => handleSubmit('simpan_draf')}
                                    className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {isPending ? (
                                        <span className="inline-flex items-center gap-2">
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Menyimpan...</span>
                                        </span>
                                    ) : (
                                        <span>Simpan Pengaturan Asesmen</span>
                                    )}
                                </button>
                            </div>

                            {penilaianId && (
                                <div className="mt-8 pt-6 border-t border-rose-200 dark:border-rose-900/40">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-lg bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/30">
                                        <div>
                                            <h4 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
                                                {t('deleteAssessment')}
                                            </h4>
                                            <p className="text-xs text-rose-700 dark:text-rose-300/80 mt-0.5">
                                                Tindakan ini permanen. Seluruh
                                                skor dan catatan nilai siswa
                                                pada tugas ini akan ikut
                                                dihapus.
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            disabled={isPending}
                                            onClick={handleDelete}
                                            className="inline-flex items-center justify-center rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                                        >
                                            {isPending
                                                ? 'Menghapus...'
                                                : t('deleteAssessment')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
