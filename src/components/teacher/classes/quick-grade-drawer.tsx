"use client";

import { useState, useTransition, useMemo } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { X, ChevronLeft, ChevronRight, Loader2, Check } from "lucide-react";
import { saveSingleStudentGrade } from "@/app/actions/teacher";
import { NativeDialog } from "@/components/common/native-dialog";
import { Select } from "@/components/ui/select";
import type { StudentRosterItem, ClassAssessmentItem } from "./class-detail-view";

interface QuickGradeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRosterItem | null;
  studentIndex: number;
  totalStudents: number;
  onNextStudent: () => void;
  onPrevStudent: () => void;
  classId: number;
  assessments?: ClassAssessmentItem[];
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
  assessments = [],
  onSavedSuccess,
}: QuickGradeDrawerProps) {
  const router = useRouter();
  const [selectedPenilaianId, setSelectedPenilaianId] = useState<string>(() => {
    return assessments.length > 0 ? String(assessments[0].id) : "new";
  });
  const [namaAsesmenBaru, setNamaAsesmenBaru] = useState("");
  const [statusHasil, setStatusHasil] = useState<"dinilai" | "tidak_ikut">("dinilai");
  const [nilai, setNilai] = useState("");
  const [catatan, setCatatan] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Ensure selected assessment is valid and defaults cleanly
  const isSelectedValid =
    selectedPenilaianId === "new" ||
    assessments.some((a) => String(a.id) === selectedPenilaianId);

  const effectivePenilaianId = isSelectedValid
    ? selectedPenilaianId
    : assessments.length > 0
    ? String(assessments[0].id)
    : "new";

  // Selected assessment object
  const currentAssessment = assessments.find(
    (a) => String(a.id) === effectivePenilaianId
  );
  const maxScore = currentAssessment ? currentAssessment.nilaiMaksimum : 100;

  const assessmentOptions = useMemo(() => [
    ...assessments.map((a) => ({
      value: String(a.id),
      label: a.nama,
      description: a.tanggal,
    })),
    { value: "new", label: "+ Buat Asesmen Baru" },
  ], [assessments]);

  // Reset form when student changes
  const [prevStudentId, setPrevStudentId] = useState(student?.id);
  if (student?.id !== prevStudentId) {
    setPrevStudentId(student?.id);
    if (student) {
      setNilai("");
      setCatatan("");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }

  if (!isOpen || !student) return null;

  const initial = (student.nama?.[0] || "S").toUpperCase();
  const attendancePct =
    student.tercatat > 0
      ? Math.round((student.hadir / student.tercatat) * 100)
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (effectivePenilaianId === "new" && !namaAsesmenBaru.trim()) {
      setErrorMsg("Nama asesmen/tugas baru wajib diisi.");
      return;
    }

    if (statusHasil === "dinilai") {
      if (!nilai.trim() && !catatan.trim()) {
        setErrorMsg("Masukkan nilai angka atau catatan evaluasi untuk siswa.");
        return;
      }

      if (nilai.trim()) {
        const num = Number(nilai);
        if (isNaN(num) || num < 0 || num > maxScore) {
          setErrorMsg(`Nilai harus berupa angka antara 0 sampai ${maxScore}.`);
          return;
        }
      }
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("kelas_id", String(classId));
      formData.append("pendaftaran_id", String(student.id));
      if (effectivePenilaianId !== "new") {
        formData.append("penilaian_id", effectivePenilaianId);
      } else {
        formData.append("nama_asesmen_baru", namaAsesmenBaru.trim());
      }
      formData.append("status_hasil", statusHasil);
      if (statusHasil === "dinilai" && nilai.trim()) {
        formData.append("nilai", nilai.trim());
      }
      if (catatan.trim()) {
        formData.append("catatan", catatan.trim());
      }

      const res = await saveSingleStudentGrade({}, formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Nilai berhasil disimpan!");
        router.refresh();
        if (onSavedSuccess) {
          onSavedSuccess(
            student.id,
            statusHasil === "dinilai" && nilai.trim() ? Number(nilai) : null,
            catatan.trim() || null
          );
        }
      }
    });
  };

  return (
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="quick-grade-drawer-title"
      preventClose={isPending}
      className="!m-0 !left-auto !right-0 !top-0 !bottom-0 !h-full !max-h-full !max-w-md w-full"
    >
      <div className="w-full max-w-md h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* 1. Header (Student Info + SpeedGrader Nav) */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center justify-between gap-2 mb-3">
            {/* SpeedGrader Student Stepper (< X of Y >) */}
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 shadow-2xs">
              <button
                type="button"
                disabled={studentIndex <= 0 || isPending}
                onClick={onPrevStudent}
                aria-label="Murid sebelumnya"
                className="grid size-6 place-items-center rounded text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
              >
                <ChevronLeft className="size-4" />
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
                <ChevronRight className="size-4" />
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
            <div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-sm font-semibold">
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
            {/* Pilihan Tugas / Asesmen */}
            <div className="space-y-2">
              <label
                htmlFor="grade-asesmen"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Tugas / Asesmen Kelas <span className="text-red-500">*</span>
              </label>
              <Select
                id="grade-asesmen"
                value={effectivePenilaianId}
                onChange={setSelectedPenilaianId}
                options={assessmentOptions}
                disabled={isPending}
                ariaLabel="Pilih tugas atau asesmen kelas"
                portal={false}
              />
            </div>

            {/* Nama Asesmen Baru jika dipilih 'new' */}
            {effectivePenilaianId === "new" ? (
              <div className="space-y-2 rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-3">
                <label
                  htmlFor="nama-asesmen-baru"
                  className="block text-xs font-semibold text-blue-950 dark:text-blue-200"
                >
                  Nama Asesmen Baru <span className="text-red-500">*</span>
                </label>
                <input
                  id="nama-asesmen-baru"
                  type="text"
                  maxLength={100}
                  placeholder="Contoh: Kuis Bab 3, Tugas Mandiri 1"
                  value={namaAsesmenBaru}
                  onChange={(e) => setNamaAsesmenBaru(e.target.value)}
                  disabled={isPending}
                  className="w-full h-11 sm:h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
                />
              </div>
            ) : null}

            {/* Status Hasil: Dinilai vs Tidak Ikut */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Status Keikutsertaan
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatusHasil("dinilai")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    statusHasil === "dinilai"
                      ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Dinilai
                </button>
                <button
                  type="button"
                  onClick={() => setStatusHasil("tidak_ikut")}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                    statusHasil === "tidak_ikut"
                      ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Tidak Ikut
                </button>
              </div>
            </div>

            {/* Nilai Angka */}
            {statusHasil === "dinilai" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="grade-nilai"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Nilai Angka
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
                  inputMode="decimal"
                  min="0"
                  max={maxScore}
                  step="0.5"
                  placeholder="Contoh: 85"
                  value={nilai}
                  onChange={(e) => setNilai(e.target.value)}
                  disabled={isPending}
                  className="w-full h-11 sm:h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-base sm:text-lg font-bold tabular-nums text-slate-950 dark:text-slate-50 placeholder:font-normal placeholder:text-sm placeholder:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
                />
              </div>
            ) : null}

            {/* Catatan Kualitatif / Feedback */}
            <div className="space-y-2">
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
                placeholder="Tuliskan catatan kemajuan belajar, keaktifan, atau evaluasi untuk siswa ini…"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                disabled={isPending}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 hover:border-slate-400 dark:hover:border-slate-500 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 resize-none transition-colors"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right tabular-nums">
                {catatan.length}/1000 karakter
              </p>
            </div>

            {/* Petunjuk Penyederhanaan */}
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Pembaruan Langsung:
              </span>{" "}
              Nilai yang disimpan dapat Anda perbarui kapan saja secara langsung tanpa memerlukan tiket koreksi admin.
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
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
          >
            <span>Tutup</span>
          </button>

          <button
            type="submit"
            form="quick-grade-form"
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            <span>{isPending ? "Menyimpan..." : "Simpan Nilai"}</span>
          </button>
        </div>
      </div>
    </NativeDialog>
  );
}
