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

export function PenilaianForm({
    kelasId,
    penilaianId,
    initialNama = '',
    initialTanggal,
    initialNilaiMaksimum = 100,
    initialDraf = true,
    diterbitkanPada,
    initialSesiId = null,
    sessions = [],
    siswa: initialSiswa,
}: PenilaianFormProps) {
    const t = useTranslations('teacher');
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'grading' | 'settings'>(
        'grading',
    );

    const [nama, setNama] = useState(initialNama);
    const [tanggal, setTanggal] = useState(
        initialTanggal ?? new Date().toISOString().slice(0, 10),
    );
    const [nilaiMaksimum, setNilaiMaksimum] = useState(
        String(initialNilaiMaksimum),
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
    const [filterStatus, setFilterStatus] = useState<
        'all' | 'belum' | 'dinilai'
    >('all');

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    // Real-time KPI Counts & Averages
    const counts = useMemo(() => {
        let dinilai = 0;
        let belumDinilai = 0;
        let tidakIkut = 0;
        let sumScore = 0;
        let countScore = 0;

        for (const s of initialSiswa) {
            const cur = studentRows[s.pendaftaranId];
            const status = cur?.statusHasil ?? 'belum_dinilai';
            if (status === 'belum_dinilai') {
                belumDinilai++;
            } else if (status === 'tidak_ikut') {
                tidakIkut++;
            } else if (status === 'dinilai') {
                dinilai++;
                if (cur && cur.nilai.trim() !== '') {
                    const num = Number(cur.nilai);
                    if (!isNaN(num)) {
                        sumScore += num;
                        countScore++;
                    }
                }
            }
        }

        const averageScore =
            countScore > 0
                ? Math.round((sumScore / countScore) * 10) / 10
                : null;
        return {
            total: initialSiswa.length,
            dinilai,
            belumDinilai,
            tidakIkut,
            averageScore,
        };
    }, [initialSiswa, studentRows]);

    // Filtered Students List
    const filteredStudents = useMemo(() => {
        return initialSiswa.filter((s) => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                if (!s.nama.toLowerCase().includes(q)) return false;
            }
            const cur = studentRows[s.pendaftaranId];
            const status = cur?.statusHasil ?? 'belum_dinilai';
            if (filterStatus === 'belum') return status === 'belum_dinilai';
            if (filterStatus === 'dinilai') return status === 'dinilai';
            return true;
        });
    }, [initialSiswa, studentRows, searchQuery, filterStatus]);

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
        const maxVal = String(Number(nilaiMaksimum) || 100);
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

        const maxScoreNum = Number(nilaiMaksimum);
        if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
            setErrorMsg(t('invalidMaxScore'));
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
                if (isNaN(valNum) || valNum < 0 || valNum > maxScoreNum) {
                    setErrorMsg(
                        `${s.nama}: ${t('scoreOutOfRange', { max: maxScoreNum })}`,
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
        formData.append('nilai_maksimum', String(maxScoreNum));
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
                    {/* Standalone Control Toolbar: Quick Actions + Status Pills + Search Bar */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={handleMarkAllRated}
                                className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                            >
                                <span>Beri Nilai Maks Semua</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAllScores}
                                className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                            >
                                <span>Reset Nilai</span>
                            </button>

                            {/* Filter Status Pills */}
                            <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-medium sm:ml-2">
                                <button
                                    type="button"
                                    onClick={() => setFilterStatus('all')}
                                    className={`rounded-md px-3 py-1 text-xs transition-colors cursor-pointer ${
                                        filterStatus === 'all'
                                            ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-2xs font-bold'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                                >
                                    Semua ({initialSiswa.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFilterStatus('belum')}
                                    className={`rounded-md px-3 py-1 text-xs transition-colors cursor-pointer ${
                                        filterStatus === 'belum'
                                            ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-2xs font-bold'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                                >
                                    Belum ({counts.belumDinilai})
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFilterStatus('dinilai')
                                    }
                                    className={`rounded-md px-3 py-1 text-xs transition-colors cursor-pointer ${
                                        filterStatus === 'dinilai'
                                            ? 'bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-2xs font-bold'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                    }`}
                                >
                                    Dinilai ({counts.dinilai})
                                </button>
                            </div>
                        </div>

                        {/* Live Search Input */}
                        <div className="relative w-full sm:w-64">
                            <label
                                htmlFor="search-student"
                                className="sr-only"
                            >
                                Cari siswa
                            </label>
                            <Search
                                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
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
                                className="h-10 sm:h-9 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-8 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    aria-label="Hapus kata kunci pencarian"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
                                >
                                    <X
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table Spreadsheet Container (Separated) */}
                    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
                        <div
                            tabIndex={0}
                            role="region"
                            aria-label="Tabel spreadsheet penilaian siswa"
                            className="overflow-x-auto overscroll-x-contain focus:outline-hidden focus:ring-1 focus:ring-brand/30"
                        >
                            <table className="w-full min-w-[700px] border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        <th
                                            scope="col"
                                            className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center"
                                        >
                                            No
                                        </th>
                                        <th
                                            scope="col"
                                            className="sticky left-12 z-20 min-w-[150px] max-w-[220px] bg-slate-50 dark:bg-slate-800 px-4 py-3 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
                                        >
                                            Siswa
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-56 px-4 py-3 text-center"
                                        >
                                            Status Penilaian
                                        </th>
                                        <th
                                            scope="col"
                                            className="w-28 px-4 py-3 text-right"
                                        >
                                            Nilai
                                        </th>
                                        <th scope="col" className="px-4 py-3">
                                            Catatan & Umpan Balik Guru
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
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
                                                    className="group/row relative border-b border-slate-100 dark:border-slate-800/60 transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                                                >
                                                    {/* 1. Nomor (Sticky Left 0) */}
                                                    <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400 tabular-nums transition-colors">
                                                        {idx + 1}
                                                    </td>

                                                    {/* 2. Nama Siswa (Sticky Left 12) */}
                                                    <td className="sticky left-12 z-10 min-w-[150px] max-w-[220px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                                                        <p
                                                            className="font-semibold text-slate-950 dark:text-slate-50 truncate block"
                                                            title={s.nama}
                                                        >
                                                            {s.nama}
                                                        </p>
                                                    </td>

                                                    {/* 3. Segmented Status Button Toggles (Dinilai, Belum, Absen) */}
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center justify-center">
                                                            <div className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-0.5 text-xs">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleStatusChange(
                                                                            s.pendaftaranId,
                                                                            'dinilai',
                                                                        )
                                                                    }
                                                                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                                                                        cur.statusHasil ===
                                                                        'dinilai'
                                                                            ? 'bg-emerald-600 text-white shadow-xs'
                                                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                                                    }`}
                                                                >
                                                                    {t(
                                                                        'statusDinilai',
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleStatusChange(
                                                                            s.pendaftaranId,
                                                                            'belum_dinilai',
                                                                        )
                                                                    }
                                                                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                                                                        cur.statusHasil ===
                                                                        'belum_dinilai'
                                                                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold'
                                                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                                                    }`}
                                                                >
                                                                    {t(
                                                                        'statusBelumShort',
                                                                    )}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleStatusChange(
                                                                            s.pendaftaranId,
                                                                            'tidak_ikut',
                                                                        )
                                                                    }
                                                                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                                                                        cur.statusHasil ===
                                                                        'tidak_ikut'
                                                                            ? 'bg-rose-600 text-white shadow-xs'
                                                                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                                                                    }`}
                                                                >
                                                                    {t(
                                                                        'statusTidakIkutShort',
                                                                    )}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* 4. Nilai (Skor) */}
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <input
                                                                type="number"
                                                                inputMode="decimal"
                                                                min="0"
                                                                max={
                                                                    nilaiMaksimum ||
                                                                    100
                                                                }
                                                                disabled={
                                                                    cur.statusHasil !==
                                                                    'dinilai'
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
                                                                placeholder="0"
                                                                className="w-16 h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 text-right text-base sm:text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-500 hover:border-slate-400 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* 5. Catatan & Umpan Balik */}
                                                    <td className="px-4 py-3">
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
                                                            placeholder={t(
                                                                'notesPlaceholder',
                                                            )}
                                                            className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base sm:text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
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

                    {/* Standalone Action & Summary Footer (Separated from Table) */}
                    <div className="flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                            {counts.belumDinilai > 0 ? (
                                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                    {t('studentsUngradedCount', {
                                        count: counts.belumDinilai,
                                        total: initialSiswa.length,
                                    })}
                                </span>
                            ) : (
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                                    {t('allStudentsGraded', {
                                        total: initialSiswa.length,
                                    })}
                                </span>
                            )}
                            <span className="mx-2 text-slate-300 dark:text-slate-600 hidden sm:inline">
                                ·
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 block sm:inline mt-0.5 sm:mt-0">
                                {t('gradedSummary', {
                                    count: counts.dinilai,
                                })}
                                {counts.averageScore !== null
                                    ? counts.averageScore
                                    : '—'}{' '}
                                · Absen: {counts.tidakIkut}
                            </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
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

                                <div>
                                    <label
                                        htmlFor="assessment-max"
                                        className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2"
                                    >
                                        {t('maxScore')}{' '}
                                        <span className="text-rose-500 font-bold ml-0.5">
                                            *
                                        </span>
                                    </label>
                                    <input
                                        id="assessment-max"
                                        type="number"
                                        inputMode="numeric"
                                        min="1"
                                        max="1000"
                                        required
                                        value={nilaiMaksimum}
                                        onChange={(e) =>
                                            setNilaiMaksimum(e.target.value)
                                        }
                                        className="w-full h-11 sm:h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 sm:px-4 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 tabular-nums hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
                                    />
                                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        {t('maxScoreHelp')}
                                    </p>
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
