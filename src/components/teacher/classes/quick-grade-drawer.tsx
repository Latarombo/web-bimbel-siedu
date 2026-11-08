"use client";

import { useState, useEffect, useTransition } from "react";
import { Link } from "@/i18n/navigation";
import { X, ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { saveNilai } from "@/app/actions/teacher";
import { useScrollLock } from "@/lib/use-scroll-lock";
import type { StudentRosterItem } from "./class-detail-view";

interface QuickGradeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRosterItem | null;
  studentIndex: number;
  totalStudents: number;
  onNextStudent: () => void;
  onPrevStudent: () => void;
  classId: number;
  onSavedSuccess?: (
    pendaftaranId: number,
    nilai: number | null,
    catatan: string | null
  ) => void;
}

export function QuickGradeDrawer({
  isOpen,
  onClose,
  student,
  studentIndex,
  totalStudents,
  onNextStudent,
  onPrevStudent,
  classId,
  onSavedSuccess,
}: QuickGradeDrawerProps) {
  const [tanggal, setTanggal] = useState("");
  const [nilai, setNilai] = useState("");
  const [catatan, setCatatan] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useScrollLock(isOpen);

  // Reset form when student changes
  useEffect(() => {
    if (student) {
      setTanggal(new Date().toISOString().slice(0, 10));
      setNilai("");
      setCatatan("");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [student?.id]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen || !student) return null;

  const initial = (student.nama?.[0] || "S").toUpperCase();
  const attendancePct =
    student.tercatat > 0
      ? Math.round((student.hadir / student.tercatat) * 100)
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggal) {
      setErrorMsg("Tanggal penilaian wajib diisi.");
      return;
    }
    if (!nilai.trim() && !catatan.trim()) {
      setErrorMsg("Masukkan nilai angka atau catatan evaluasi untuk siswa.");
      return;
    }

    if (nilai.trim()) {
      const num = Number(nilai);
      if (isNaN(num) || num < 0 || num > 100) {
        setErrorMsg("Nilai harus berupa angka antara 0 sampai 100.");
        return;
      }
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("pendaftaran_id", String(student.id));
      formData.append("tanggal", tanggal);
      if (nilai.trim()) {
        formData.append("nilai", nilai.trim());
      }
      if (catatan.trim()) {
        formData.append("catatan", catatan.trim());
      }

      const res = await saveNilai({}, formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Nilai berhasil disimpan!");
        if (onSavedSuccess) {
          onSavedSuccess(
            student.id,
            nilai.trim() ? Number(nilai) : null,
            catatan.trim() || null
          );
        }
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-grade-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* 1. Header (Student Info + SpeedGrader Nav) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* SpeedGrader Student Stepper (< X of Y >) */}
            <div className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 shadow-2xs">
              <button
                type="button"
                disabled={studentIndex <= 0 || isPending}
                onClick={onPrevStudent}
                aria-label="Murid sebelumnya"
                className="grid size-6 place-items-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronLeft className="size-3.5" />
              </button>

              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums px-1">
                {studentIndex + 1} / {totalStudents}
              </span>

              <button
                type="button"
                disabled={studentIndex >= totalStudents - 1 || isPending}
                onClick={onNextStudent}
                aria-label="Murid berikutnya"
                className="grid size-6 place-items-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronRight className="size-3.5" />
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              aria-label="Tutup panel nilai"
              className="grid size-7 place-items-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Student Profile Card */}
          <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold">
              {initial}
            </div>
            <div className="min-w-0 flex-1">
              <h3
                id="quick-grade-drawer-title"
                className="text-base font-semibold text-slate-950 dark:text-slate-50 truncate"
              >
                {student.nama}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pendaftaran #{student.id} · Kehadiran: {attendancePct}% ({student.hadir}/{student.tercatat})
              </p>
            </div>
          </div>
        </div>

        {/* 2. Scrollable Body: Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg ? (
            <div
              role="alert"
              className="p-3 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
            >
              {errorMsg}
            </div>
          ) : null}

          {successMsg ? (
            <div
              role="status"
              className="flex items-center gap-2 p-3 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300"
            >
              <Check className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          ) : null}

          <form id="quick-grade-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Tanggal Penilaian */}
            <div className="space-y-1.5">
              <label
                htmlFor="grade-tanggal"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Tanggal Penilaian <span className="text-red-500">*</span>
              </label>
              <input
                id="grade-tanggal"
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                disabled={isPending}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            {/* Nilai Angka */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="grade-nilai"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Nilai Angka (0 - 100)
                </label>
                {student.rata != null ? (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Rata-rata saat ini: <strong>{student.rata}</strong>
                  </span>
                ) : null}
              </div>
              <input
                id="grade-nilai"
                type="number"
                min="0"
                max="100"
                step="1"
                placeholder="Contoh: 85"
                value={nilai}
                onChange={(e) => setNilai(e.target.value)}
                disabled={isPending}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-base sm:text-lg font-bold tabular-nums text-slate-950 dark:text-slate-50 placeholder:font-normal placeholder:text-sm placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            {/* Catatan Kualitatif / Feedback */}
            <div className="space-y-1.5">
              <label
                htmlFor="grade-catatan"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Catatan Umpan Balik Guru
              </label>
              <textarea
                id="grade-catatan"
                rows={4}
                maxLength={1000}
                placeholder="Tuliskan catatan kemajuan belajar, keaktifan, atau evaluasi untuk siswa ini..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                disabled={isPending}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden resize-none"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
                {catatan.length}/1000 karakter
              </p>
            </div>
          </form>

          {/* Deep Route Shortcut */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href={`/teacher/grades/${student.id}`}
              className="inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Buka Riwayat Lengkap & Rapor Siswa</span>
            </Link>
          </div>
        </div>

        {/* 3. Sticky Footer Action */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
          >
            <span>Tutup</span>
          </button>

          <button
            type="submit"
            form="quick-grade-form"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            <span>{isPending ? "Menyimpan..." : "Simpan Nilai"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
