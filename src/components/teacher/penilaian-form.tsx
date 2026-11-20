"use client";

import { useState, useMemo, useTransition } from "react";
import { useTranslations } from "next-intl";
import { savePenilaianBatch, tarikPenilaian } from "@/app/actions/teacher";
import { StudentAvatar } from "@/components/parent/student-avatar";
import { Search, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export interface StudentAssessmentRow {
  pendaftaranId: number;
  nama: string;
  statusHasil: "belum_dinilai" | "dinilai" | "tidak_ikut";
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
  siswa: StudentAssessmentRow[];
}

export function PenilaianForm({
  kelasId,
  penilaianId,
  initialNama = "",
  initialTanggal,
  initialNilaiMaksimum = 100,
  initialDraf = true,
  diterbitkanPada,
  siswa: initialSiswa,
}: PenilaianFormProps) {
  const t = useTranslations("teacher");
  const [activeTab, setActiveTab] = useState<"grading" | "settings">("grading");

  const [nama, setNama] = useState(initialNama);
  const [tanggal, setTanggal] = useState(
    initialTanggal ?? new Date().toISOString().slice(0, 10),
  );
  const [nilaiMaksimum, setNilaiMaksimum] = useState(String(initialNilaiMaksimum));
  const [isDraf, setIsDraf] = useState(initialDraf);
  const [publishedAt, setPublishedAt] = useState<string | null>(diterbitkanPada ?? null);

  const [studentRows, setStudentRows] = useState<
    Record<
      number,
      {
        statusHasil: "belum_dinilai" | "dinilai" | "tidak_ikut";
        nilai: string;
        catatan: string;
      }
    >
  >(() => {
    const map: Record<
      number,
      { statusHasil: "belum_dinilai" | "dinilai" | "tidak_ikut"; nilai: string; catatan: string }
    > = {};
    for (const s of initialSiswa) {
      map[s.pendaftaranId] = {
        statusHasil: s.statusHasil,
        nilai: s.nilai != null ? String(s.nilai) : "",
        catatan: s.catatan ?? "",
      };
    }
    return map;
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "belum" | "dinilai">("all");

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
      const status = cur?.statusHasil ?? "belum_dinilai";
      if (status === "belum_dinilai") {
        belumDinilai++;
      } else if (status === "tidak_ikut") {
        tidakIkut++;
      } else if (status === "dinilai") {
        dinilai++;
        if (cur && cur.nilai.trim() !== "") {
          const num = Number(cur.nilai);
          if (!isNaN(num)) {
            sumScore += num;
            countScore++;
          }
        }
      }
    }

    const averageScore = countScore > 0 ? Math.round((sumScore / countScore) * 10) / 10 : null;
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
      const status = cur?.statusHasil ?? "belum_dinilai";
      if (filterStatus === "belum") return status === "belum_dinilai";
      if (filterStatus === "dinilai") return status === "dinilai";
      return true;
    });
  }, [initialSiswa, studentRows, searchQuery, filterStatus]);

  const handleStatusChange = (
    pId: number,
    statusHasil: "belum_dinilai" | "dinilai" | "tidak_ikut",
  ) => {
    setStudentRows((prev) => ({
      ...prev,
      [pId]: {
        ...prev[pId],
        statusHasil,
        nilai: statusHasil === "dinilai" ? prev[pId].nilai : "",
      },
    }));
  };

  const handleNilaiChange = (pId: number, val: string) => {
    setStudentRows((prev) => ({
      ...prev,
      [pId]: {
        ...prev[pId],
        nilai: val,
        statusHasil: val.trim() !== "" ? "dinilai" : prev[pId].statusHasil,
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
          statusHasil: "dinilai",
          nilai: next[s.pendaftaranId].nilai.trim() !== "" ? next[s.pendaftaranId].nilai : maxVal,
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
          statusHasil: "belum_dinilai",
          nilai: "",
        };
      }
      return next;
    });
  };

  const handleSubmit = (aksi: "simpan_draf" | "terbitkan") => {
    if (!nama.trim()) {
      setErrorMsg(t("assessmentNameRequired"));
      return;
    }

    const maxScoreNum = Number(nilaiMaksimum);
    if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
      setErrorMsg(t("invalidMaxScore"));
      return;
    }

    for (const s of initialSiswa) {
      const cur = studentRows[s.pendaftaranId];
      if (cur && cur.statusHasil === "dinilai" && cur.nilai.trim() !== "") {
        const valNum = Number(cur.nilai);
        if (isNaN(valNum) || valNum < 0 || valNum > maxScoreNum) {
          setErrorMsg(`${s.nama}: ${t("scoreOutOfRange", { max: maxScoreNum })}`);
          return;
        }
      }
    }

    const formData = new FormData();
    formData.append("kelas_id", String(kelasId));
    if (penilaianId) {
      formData.append("penilaian_id", String(penilaianId));
    }
    formData.append("nama", nama.trim());
    formData.append("tanggal", tanggal);
    formData.append("nilai_maksimum", String(maxScoreNum));
    formData.append("aksi", aksi);

    for (const s of initialSiswa) {
      const cur = studentRows[s.pendaftaranId];
      if (cur) {
        formData.append(`status_${s.pendaftaranId}`, cur.statusHasil);
        formData.append(`nilai_${s.pendaftaranId}`, cur.statusHasil === "dinilai" ? cur.nilai : "");
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
        setIsDraf(aksi === "simpan_draf");
        if (aksi === "terbitkan") {
          setPublishedAt(new Date().toISOString());
          setSuccessMsg(t("assessmentPublished"));
        } else {
          setSuccessMsg(t("assessmentSaved"));
        }
      }
    });
  };

  const handleWithdraw = () => {
    if (!penilaianId) return;
    if (!confirm(t("withdrawConfirm"))) return;

    const formData = new FormData();
    formData.append("penilaian_id", String(penilaianId));

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await tarikPenilaian({ ok: false }, formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setIsDraf(true);
        setPublishedAt(null);
        setSuccessMsg(t("assessmentWithdrawn"));
      }
    });
  };

  const persenDinilai =
    counts.total > 0 ? Math.round((counts.dinilai / counts.total) * 100) : 0;
  const isComplete = counts.total > 0 && counts.dinilai === counts.total;

  return (
    <div className="space-y-6">
      {/* 1. Canonical 4-Stat Strip (Matching SessionStatStrip) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Card 1: Total Siswa (Blue) */}
        <div className="relative overflow-hidden rounded-lg border border-blue-200/70 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/80 via-blue-50/20 to-white dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-blue-600 dark:text-blue-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("students")}
                </p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-100/80 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                  Rombel
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {counts.total}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              Total murid terdaftar di kelas
            </p>
          </div>
          <svg
            className="pointer-events-none absolute -right-4 -top-4 w-32 sm:w-36 opacity-[0.16] dark:opacity-[0.22]"
            viewBox="0 0 400 280"
            fill="none"
            aria-hidden="true"
          >
            <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="currentColor" fillOpacity="0.4" />
            <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="currentColor" fillOpacity="0.6" />
            <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="currentColor" fillOpacity="0.8" />
          </svg>
        </div>

        {/* Card 2: Sudah Dinilai (Emerald) */}
        <div className="relative overflow-hidden rounded-lg border border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 via-emerald-50/20 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-emerald-600 dark:text-emerald-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sudah Dinilai
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border tabular-nums ${
                    isComplete
                      ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800"
                      : "bg-emerald-100/90 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300 border-emerald-300/80 dark:border-emerald-800"
                  }`}
                >
                  {persenDinilai}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums tracking-tight">
                  {counts.dinilai}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                  / {counts.total}
                </span>
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              {isComplete ? "Penilaian telah lengkap" : "Entri nilai sedang berjalan"}
            </p>
          </div>
          <svg
            className="pointer-events-none absolute -right-4 -top-4 w-32 sm:w-36 opacity-[0.16] dark:opacity-[0.22]"
            viewBox="0 0 400 280"
            fill="none"
            aria-hidden="true"
          >
            <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="currentColor" fillOpacity="0.4" />
            <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="currentColor" fillOpacity="0.6" />
            <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="currentColor" fillOpacity="0.8" />
          </svg>
        </div>

        {/* Card 3: Belum Dinilai (Amber) */}
        <div className="relative overflow-hidden rounded-lg border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 via-amber-50/20 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-amber-600 dark:text-amber-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Belum Dinilai
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                    counts.belumDinilai > 0
                      ? "bg-amber-100/90 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 border-amber-300/80 dark:border-amber-800"
                      : "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800"
                  }`}
                >
                  {counts.belumDinilai > 0 ? "Perlu Aksi" : "Lengkap"}
                </span>
              </div>
              <p
                className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                  counts.belumDinilai > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-950 dark:text-white"
                }`}
              >
                {counts.belumDinilai}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              {counts.belumDinilai > 0
                ? `${counts.belumDinilai} murid menunggu penilaian`
                : "Semua murid telah dinilai"}
            </p>
          </div>
          <svg
            className="pointer-events-none absolute -right-4 -top-4 w-32 sm:w-36 opacity-[0.16] dark:opacity-[0.22]"
            viewBox="0 0 400 280"
            fill="none"
            aria-hidden="true"
          >
            <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="currentColor" fillOpacity="0.4" />
            <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="currentColor" fillOpacity="0.6" />
            <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="currentColor" fillOpacity="0.8" />
          </svg>
        </div>

        {/* Card 4: Rata-rata Skor (Indigo) */}
        <div className="relative overflow-hidden rounded-lg border border-indigo-200/70 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/80 via-indigo-50/20 to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-indigo-600 dark:text-indigo-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rata-rata Skor
                </p>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                    isDraf
                      ? "bg-amber-100/90 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 border-amber-300/80 dark:border-amber-800"
                      : "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800"
                  }`}
                >
                  {isDraf ? "Draf" : "Terbit"}
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-950 dark:text-white">
                {counts.averageScore !== null ? counts.averageScore : "—"}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              Batas Maksimum: {nilaiMaksimum} poin
            </p>
          </div>
          <svg
            className="pointer-events-none absolute -right-4 -top-4 w-32 sm:w-36 opacity-[0.16] dark:opacity-[0.22]"
            viewBox="0 0 400 280"
            fill="none"
            aria-hidden="true"
          >
            <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="currentColor" fillOpacity="0.4" />
            <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="currentColor" fillOpacity="0.6" />
            <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="currentColor" fillOpacity="0.8" />
          </svg>
        </div>
      </div>

      {/* State Feedback Alerts */}
      {errorMsg ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-2.5 rounded-md border border-rose-200 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 text-xs font-medium text-rose-800 dark:text-rose-200"
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
          className="flex items-center justify-between gap-2.5 rounded-md border border-emerald-200 dark:border-emerald-900/70 bg-emerald-50 dark:bg-emerald-950/30 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-200"
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

      {/* 2. Canonical Underline Tab Navigation (Matching TeacherAttendanceManager) */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex gap-6" aria-label="Tabs Penilaian & Pengaturan">
          <button
            type="button"
            onClick={() => setActiveTab("grading")}
            className={`pb-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === "grading"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100"
            }`}
          >
            <span>Daftar Nilai Siswa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`pb-3 text-sm font-semibold transition-colors cursor-pointer border-b-2 -mb-px ${
              activeTab === "settings"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100"
            }`}
          >
            <span>Pengaturan Asesmen</span>
          </button>
        </nav>
      </div>

      {/* 3. Tab Panels */}
      {activeTab === "grading" ? (
        <section aria-label="Lembar Nilai Siswa" className="space-y-6">
          {/* Main Spreadsheet Table Container with Integrated Toolbar & Footer */}
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            {/* Integrated Control Toolbar: Quick Actions + Search Bar */}
            <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkAllRated}
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                >
                  <span>Beri Nilai Maks Semua</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearAllScores}
                  className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white cursor-pointer"
                >
                  <span>Reset Nilai</span>
                </button>

                {/* Filter Status Pills */}
                <div className="inline-flex rounded-md bg-slate-100 dark:bg-slate-800 p-0.5 text-xs font-medium sm:ml-2">
                  <button
                    type="button"
                    onClick={() => setFilterStatus("all")}
                    className={`rounded px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                      filterStatus === "all"
                        ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    Semua ({initialSiswa.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus("belum")}
                    className={`rounded px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                      filterStatus === "belum"
                        ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    Belum ({counts.belumDinilai})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterStatus("dinilai")}
                    className={`rounded px-2.5 py-1 text-xs transition-colors cursor-pointer ${
                      filterStatus === "dinilai"
                        ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-2xs font-bold"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                    }`}
                  >
                    Dinilai ({counts.dinilai})
                  </button>
                </div>
              </div>

              {/* Live Search Input */}
              <div className="relative w-full sm:w-64">
                <label htmlFor="search-student" className="sr-only">
                  Cari siswa
                </label>
                <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  id="search-student"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama siswa..."
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-9 pr-8 text-xs text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Table Spreadsheet */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <th scope="col" className="w-12 px-4 py-3 text-center">
                      No
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Siswa
                    </th>
                    <th scope="col" className="w-56 px-4 py-3 text-center">
                      Status Penilaian
                    </th>
                    <th scope="col" className="w-40 px-4 py-3 text-center">
                      Nilai (Maks {nilaiMaksimum})
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Catatan & Umpan Balik Guru
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-400">
                        Tidak ada siswa yang cocok dengan pencarian &quot;{searchQuery}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const cur = studentRows[s.pendaftaranId] ?? {
                        statusHasil: "belum_dinilai",
                        nilai: "",
                        catatan: "",
                      };

                      return (
                        <tr
                          key={s.pendaftaranId}
                          className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                        >
                          {/* 1. Nomor */}
                          <td className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                            {idx + 1}
                          </td>

                          {/* 2. Nama Siswa */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <StudentAvatar
                                nama={s.nama}
                                jenjang={s.jenjang}
                                size="xs"
                              />
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-950 dark:text-slate-50 truncate">
                                  {s.nama}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                  ID Pendaftaran: {s.pendaftaranId}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 3. Segmented Status Button Toggles (Dinilai, Belum, Absen) */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <div className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-0.5 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(s.pendaftaranId, "dinilai")}
                                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                                    cur.statusHasil === "dinilai"
                                      ? "bg-emerald-600 text-white shadow-xs"
                                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                                  }`}
                                >
                                  {t("statusDinilai")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(s.pendaftaranId, "belum_dinilai")}
                                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                                    cur.statusHasil === "belum_dinilai"
                                      ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs font-bold"
                                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                                  }`}
                                >
                                  Belum
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(s.pendaftaranId, "tidak_ikut")}
                                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                                    cur.statusHasil === "tidak_ikut"
                                      ? "bg-rose-600 text-white shadow-xs"
                                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                                  }`}
                                >
                                  Absen
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* 4. Nilai (Skor) */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                max={nilaiMaksimum || 100}
                                disabled={cur.statusHasil !== "dinilai"}
                                value={cur.nilai}
                                onChange={(e) => handleNilaiChange(s.pendaftaranId, e.target.value)}
                                placeholder="0"
                                className="w-16 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-center text-xs sm:text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800/60 disabled:text-slate-400 dark:disabled:text-slate-500 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                              />
                              <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                / {nilaiMaksimum}
                              </span>
                            </div>
                          </td>

                          {/* 5. Catatan & Umpan Balik */}
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              value={cur.catatan}
                              onChange={(e) => handleCatatanChange(s.pendaftaranId, e.target.value)}
                              placeholder={t("notesPlaceholder")}
                              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 transition-colors placeholder:text-slate-500 dark:placeholder:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Integrated Form Footer (Matching attendance-table.tsx) */}
            <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {counts.belumDinilai > 0 ? (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">
                    {counts.belumDinilai} dari {initialSiswa.length} siswa belum dinilai
                  </span>
                ) : (
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    Semua siswa ({initialSiswa.length}) telah dinilai
                  </span>
                )}
                <span className="mx-2 text-slate-300 dark:text-slate-600 hidden sm:inline">·</span>
                <span className="text-slate-500 dark:text-slate-400 block sm:inline mt-0.5 sm:mt-0">
                  Dinilai: {counts.dinilai} · Rata-rata:{" "}
                  {counts.averageScore !== null ? counts.averageScore : "—"} · Absen:{" "}
                  {counts.tidakIkut}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSubmit("simpan_draf")}
                  className="inline-flex min-h-10 w-full sm:w-auto items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </span>
                  ) : (
                    <span>{t("saveDraft")}</span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSubmit("terbitkan")}
                  className="inline-flex min-h-10 w-full sm:w-auto items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </span>
                  ) : (
                    <span>{isDraf ? t("publishToParents") : t("saveChanges")}</span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Floating Action Bar (Matching AttendanceStickyBar) */}
          <div className="sticky bottom-4 z-30 mt-6 transition-all">
            <div className="mx-auto rounded-lg border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 p-3.5 shadow-lg backdrop-blur-md sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Real-time Status Counts */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-emerald-700 dark:text-emerald-300">
                    <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
                    Dinilai: <span className="font-bold tabular-nums">{counts.dinilai}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 text-amber-700 dark:text-amber-300">
                    <span className="size-2 rounded-full bg-amber-500" aria-hidden="true" />
                    Belum Dinilai:{" "}
                    <span className="font-bold tabular-nums">{counts.belumDinilai}</span>
                  </span>
                  {counts.tidakIkut > 0 && (
                    <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 px-2.5 py-1 text-rose-700 dark:text-rose-300">
                      <span className="size-2 rounded-full bg-rose-500" aria-hidden="true" />
                      Absen: <span className="font-bold tabular-nums">{counts.tidakIkut}</span>
                    </span>
                  )}
                  <span className="hidden sm:inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {isDraf ? "Status: Draf" : "Status: Diterbitkan"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2.5">
                  {!isDraf && penilaianId ? (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleWithdraw}
                      className="inline-flex min-h-10 items-center justify-center rounded-md border border-amber-300 dark:border-amber-800 px-4 py-2 text-xs sm:text-sm font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {t("withdrawToDraft")}
                    </button>
                  ) : null}

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSubmit("simpan_draf")}
                    className="inline-flex min-h-10 items-center justify-center rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </span>
                    ) : (
                      <span>{t("saveDraft")}</span>
                    )}
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSubmit("terbitkan")}
                    className="inline-flex min-h-10 items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPending ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Loader2 className="size-3.5 animate-spin" />
                        <span>Menyimpan...</span>
                      </span>
                    ) : (
                      <span>{isDraf ? t("publishToParents") : t("saveChanges")}</span>
                    )}
                  </button>
                </div>
              </div>
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
                  Atur nama tugas/ujian, tanggal pelaksanaan, dan batas skor maksimum penilaian.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold border ${
                    isDraf
                      ? "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                      : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  }`}
                >
                  {isDraf ? t("draftStatus") : t("publishedStatus")}
                </span>
                {!isDraf && publishedAt && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                    · Diterbitkan:{" "}
                    {new Date(publishedAt).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: "Asia/Jakarta",
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
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {t("assessmentName")} <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    id="assessment-name"
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder={t("assessmentNamePlaceholder")}
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="assessment-date"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {t("assessmentDate")} <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    id="assessment-date"
                    type="date"
                    required
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="assessment-max"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    {t("maxScore")} <span className="text-rose-500 font-bold ml-0.5">*</span>
                  </label>
                  <input
                    id="assessment-max"
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={nilaiMaksimum}
                    onChange={(e) => setNilaiMaksimum(e.target.value)}
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-colors"
                  />
                  <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {t("maxScoreHelp")}
                  </p>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleSubmit("simpan_draf")}
                  className="inline-flex min-h-10 items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isPending ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="size-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </span>
                  ) : (
                    <span>Simpan Pengaturan Asesmen</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
