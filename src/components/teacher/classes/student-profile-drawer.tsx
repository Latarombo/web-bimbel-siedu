'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { X } from 'lucide-react';
import { NativeDialog } from '@/components/common/native-dialog';
import type { StudentRosterItem } from './class-detail-view';

interface StudentProfileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    student: StudentRosterItem | null;
    classId: number;
    onOpenGrading: (pendaftaranId: number) => void;
}

function hitungUmur(tanggalLahir?: string | null): number | null {
    if (!tanggalLahir) return null;
    const birth = new Date(tanggalLahir);
    if (isNaN(birth.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
    }
    return age >= 0 ? age : null;
}

export function StudentProfileDrawer({
    isOpen,
    onClose,
    student,
    classId,
    onOpenGrading,
}: StudentProfileDrawerProps) {
    const t = useTranslations('teacher');

    if (!isOpen || !student) return null;

    const initial = (student.nama?.[0] || 'S').toUpperCase();
    const attendancePct =
        student.tercatat > 0
            ? Math.round((student.hadir / student.tercatat) * 100)
            : 0;
    const umur = hitungUmur(student.tanggalLahir);

    return (
        <NativeDialog
            isOpen={isOpen}
            onClose={onClose}
            ariaLabelledBy="student-profile-title"
            className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 p-0 overscroll-contain animate-in slide-in-from-right duration-200"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
                <div>
                    <h2
                        id="student-profile-title"
                        className="text-base font-bold text-slate-950 dark:text-slate-50"
                    >
                        Profil Lengkap Siswa
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Informasi biodata, wali murid, dan capaian belajar
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Tutup profil siswa"
                    className="grid size-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                >
                    <X className="size-4" aria-hidden="true" />
                </button>
            </div>

            {/* Body Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                {/* Identitas Ringkas */}
                <div className="flex items-center gap-4">
                    <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-bold text-xl">
                        {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
                            {student.nama}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <span className="font-medium">
                                {student.tingkat
                                    ? `Tingkat ${student.tingkat}`
                                    : 'Siswa Kelas'}
                            </span>
                            <span>·</span>
                            <span
                                className={`font-semibold capitalize ${
                                    student.status === 'terdaftar'
                                        ? 'text-emerald-700 dark:text-emerald-400'
                                        : 'text-amber-700 dark:text-amber-400'
                                }`}
                            >
                                {student.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Ringkasan Capaian Kelas Ini (Metrik Bersih) */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                            Rata-rata Nilai
                        </span>
                        <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                                {student.rata != null ? student.rata : "—"}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                / 100
                            </span>
                        </div>
                        <span className="text-2xs text-slate-500 dark:text-slate-400 mt-1 block">
                            {student.nNilai} tugas dinilai
                        </span>
                    </div>

                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 p-4">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
                            Kehadiran Siswa
                        </span>
                        <div className="mt-1 flex items-baseline gap-1">
                            <span className="text-2xl font-bold tabular-nums text-slate-900 dark:text-slate-100">
                                {attendancePct}%
                            </span>
                        </div>
                        <span className="text-2xs text-slate-500 dark:text-slate-400 mt-1 block">
                            {student.hadir} dari {student.tercatat} sesi
                            tercatat
                        </span>
                    </div>
                </div>

                {/* Biodata Lengkap Siswa */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Biodata Siswa
                    </h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                        <div className="flex justify-between px-4 py-2.5">
                            <span className="text-slate-500 dark:text-slate-400">
                                Tanggal Lahir
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                {student.tanggalLahir
                                    ? `${student.tanggalLahir} ${umur != null ? `(${umur} tahun)` : ''}`
                                    : 'Belum dicatat'}
                            </span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5">
                            <span className="text-slate-500 dark:text-slate-400">
                                Telepon Siswa
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                {student.nomorTelepon || "—"}
                            </span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5">
                            <span className="text-slate-500 dark:text-slate-400">
                                Email Notifikasi
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[180px]">
                                {student.emailNotifikasi || "—"}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Kontak Orang Tua / Wali */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Orang Tua / Wali Murid
                    </h4>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
                        <div className="flex justify-between px-4 py-2.5">
                            <span className="text-slate-500 dark:text-slate-400">
                                Nama Wali
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {student.namaWali || 'Wali Terdaftar'}
                            </span>
                        </div>
                        <div className="flex justify-between px-4 py-2.5">
                            <span className="text-slate-500 dark:text-slate-400">
                                Telepon / WhatsApp
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                {student.teleponWali ? (
                                    <a
                                        href={`https://wa.me/${student.teleponWali.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        {student.teleponWali}
                                    </a>
                                ) : (
                                    "—"
                                )}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 px-4 py-2.5">
                            <span className="text-slate-500 dark:text-slate-400">
                                Alamat Tempat Tinggal
                            </span>
                            <span className="font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                                {student.alamatWali ||
                                    'Belum ada catatan alamat'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Tautan Cepat Riwayat */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Riwayat Belajar & Presensi
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        <Link
                            href={`/teacher/grades/${student.id}`}
                            className="flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center shadow-2xs"
                        >
                            Riwayat Nilai
                        </Link>
                        <Link
                            href={`/teacher/corrections?entitas=siswa&id=${student.id}`}
                            className="flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-center shadow-2xs"
                        >
                            Riwayat Presensi
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer Aksi */}
            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex flex-col gap-2 sm:flex-row">
                <button
                    type="button"
                    onClick={() => {
                        onClose();
                        onOpenGrading(student.id);
                    }}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition-colors text-center"
                >
                    Input Nilai Cepat
                </button>

                <Link
                    href={`/teacher/classes/${classId}/reports/${student.id}`}
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-center"
                >
                    Buka Rapor Siswa
                </Link>
            </div>
        </NativeDialog>
    );
}
