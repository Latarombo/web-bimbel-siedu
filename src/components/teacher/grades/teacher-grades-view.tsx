"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import {
  Search,
  MoreVertical,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export interface AssessmentItem {
  id: number;
  nama: string;
  kelasId: number;
  kelasNama: string;
  jenjang: string;
  tingkat?: string | null;
  tanggal: string; // YYYY-MM-DD
  nilaiMaksimum: number;
  draf: boolean;
  diterbitkanPada?: string | null;
  countDinilai: number;
  countTidakIkut: number;
  countBelum: number;
  totalSiswa: number;
}

export interface StudentGradeItem {
  id: number; // pendaftaranId
  anakId: number;
  nama: string;
  kelasId: number;
  kelasNama: string;
  jenjang: string;
  tingkat?: string | null;
  jumlahNilai: number;
  rataRata: number | null;
  nilaiTerakhir?: string | null; // YYYY-MM-DD
  status: "terdaftar" | "tertunggak" | string;
}

export interface ClassFilterOption {
  id: number;
  nama: string;
  jenjang: string;
  tingkat?: string | null;
}

export interface TeacherGradesViewProps {
  assessments: AssessmentItem[];
  students: StudentGradeItem[];
  classes: ClassFilterOption[];
  locale: string;
  initialTab?: "tugas" | "murid";
  stats: {
    totalAssessments: number;
    totalPublished: number;
    studentsGraded: number;
    studentsUngraded: number;
  };
}

const ITEMS_PER_PAGE = 10;

export function TeacherGradesView({
  assessments,
  students,
  classes,
  locale,
  initialTab = "tugas",
  stats,
}: TeacherGradesViewProps) {
  const [activeTab, setActiveTab] = useState<"tugas" | "murid">(initialTab);

  // Filter states for Tab 1 (Asesmen Kelas)
  const [assessmentSearch, setAssessmentSearch] = useState("");
  const [assessmentClassFilter, setAssessmentClassFilter] = useState<string>("all");
  const [assessmentStatusFilter, setAssessmentStatusFilter] = useState<"all" | "terbit" | "draf">("all");
  const [assessmentPage, setAssessmentPage] = useState(1);

  // Filter states for Tab 2 (Rekap Murid)
  const [studentSearch, setStudentSearch] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState<string>("all");
  const [studentGradeStatusFilter, setStudentGradeStatusFilter] = useState<"all" | "sudah" | "belum">("all");
  const [studentPage, setStudentPage] = useState(1);

  // Filtered Assessments
  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      if (assessmentClassFilter !== "all" && String(a.kelasId) !== assessmentClassFilter) {
        return false;
      }
      if (assessmentStatusFilter === "terbit" && a.draf) return false;
      if (assessmentStatusFilter === "draf" && !a.draf) return false;
      if (assessmentSearch.trim()) {
        const q = assessmentSearch.toLowerCase();
        const matchName = a.nama.toLowerCase().includes(q);
        const matchClass = a.kelasNama.toLowerCase().includes(q);
        const matchJenjang = a.jenjang.toLowerCase().includes(q);
        if (!matchName && !matchClass && !matchJenjang) return false;
      }
      return true;
    });
  }, [assessments, assessmentClassFilter, assessmentStatusFilter, assessmentSearch]);

  const totalAssessmentPages = Math.ceil(filteredAssessments.length / ITEMS_PER_PAGE) || 1;
  const paginatedAssessments = useMemo(() => {
    const start = (assessmentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssessments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssessments, assessmentPage]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (studentClassFilter !== "all" && String(s.kelasId) !== studentClassFilter) {
        return false;
      }
      if (studentGradeStatusFilter === "sudah" && s.jumlahNilai === 0) return false;
      if (studentGradeStatusFilter === "belum" && s.jumlahNilai > 0) return false;
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const matchName = s.nama.toLowerCase().includes(q);
        const matchClass = s.kelasNama.toLowerCase().includes(q);
        if (!matchName && !matchClass) return false;
      }
      return true;
    });
  }, [students, studentClassFilter, studentGradeStatusFilter, studentSearch]);

  const totalStudentPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, studentPage]);

  // Helper date formatter
  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(`${dateStr}T00:00:00+07:00`);
      return d.toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      {/* 1. Page Header (Clean, zero gradients) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            Penilaian & Nilai
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Kelola asesmen kelas, input capaian belajar, dan pantau rekapitulasi nilai murid.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/teacher/grades/new"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Buat Tugas Baru</span>
          </Link>
        </div>
      </div>

      {/* 2. Top 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Metric 1: Total Asesmen */}
        <div className="relative overflow-hidden rounded-lg border border-blue-200/70 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/80 via-blue-50/20 to-white dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-blue-600 dark:text-blue-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Total Asesmen
                </p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-100/80 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                  Periode Aktif
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {stats.totalAssessments}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              Asesmen kelas periode berjalan
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

        {/* Metric 2: Siswa Tuntas Dinilai */}
        <div className="relative overflow-hidden rounded-lg border border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 via-emerald-50/20 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-emerald-600 dark:text-emerald-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Siswa Sudah Dinilai
                </p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                  Tuntas
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {stats.studentsGraded}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              Memiliki riwayat entri nilai
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

        {/* Metric 3: Siswa Belum Dinilai */}
        <div className="relative overflow-hidden rounded-lg border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 via-amber-50/20 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-amber-600 dark:text-amber-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Perlu Dinilai
                </p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                  stats.studentsUngraded > 0
                    ? "bg-amber-100/90 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 border-amber-300/80 dark:border-amber-800"
                    : "bg-slate-100/90 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                }`}>
                  {stats.studentsUngraded > 0 ? "Perlu Aksi" : "Lengkap"}
                </span>
              </div>
              <p className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                stats.studentsUngraded > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-950 dark:text-white"
              }`}>
                {stats.studentsUngraded}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              {stats.studentsUngraded === 0 ? "Seluruh siswa telah memiliki nilai" : "Menunggu input penilaian pertama"}
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

      {/* 3. Propify Underline Tab Switcher */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-6" aria-label="Tabs Penilaian">
          <button
            type="button"
            onClick={() => setActiveTab("tugas")}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "tugas"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <span>Asesmen Kelas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("murid")}
            className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "murid"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <span>Rekap Nilai Siswa</span>
          </button>
        </nav>
      </div>

      {/* ================================================================= */}
      {/* TAB 1: ASESMEN KELAS (Propify Data Table)                         */}
      {/* ================================================================= */}
      {activeTab === "tugas" && (
        <div className="space-y-4">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-slate-50 tracking-tight">
                Daftar Asesmen
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Kuis, tugas, dan ujian yang telah dibuat untuk rombongan belajar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama tugas atau kelas..."
                  value={assessmentSearch}
                  onChange={(e) => {
                    setAssessmentSearch(e.target.value);
                    setAssessmentPage(1);
                  }}
                  className="w-48 sm:w-64 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Class Filter Dropdown */}
              <select
                value={assessmentClassFilter}
                onChange={(e) => {
                  setAssessmentClassFilter(e.target.value);
                  setAssessmentPage(1);
                }}
                className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:border-blue-600 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nama} · {c.jenjang}
                  </option>
                ))}
              </select>

              {/* Status Filter Dropdown */}
              <select
                value={assessmentStatusFilter}
                onChange={(e) => {
                  setAssessmentStatusFilter(e.target.value as "all" | "terbit" | "draf");
                  setAssessmentPage(1);
                }}
                className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:border-blue-600 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="terbit">Diterbitkan</option>
                <option value="draf">Draf</option>
              </select>
            </div>
          </div>

          {/* Propify Table */}
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <th scope="col" className="py-3 px-4 sm:px-6">Nama Asesmen</th>
                    <th scope="col" className="py-3 px-4">Kelas</th>
                    <th scope="col" className="py-3 px-4 text-center">Tanggal</th>
                    <th scope="col" className="py-3 px-4 text-center">Status</th>
                    <th scope="col" className="py-3 px-4 text-center">Progres Penilaian</th>
                    <th scope="col" className="py-3 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedAssessments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-600 dark:text-slate-400 text-sm">
                        Tidak ada asesmen yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedAssessments.map((a) => {
                      const pct = a.totalSiswa > 0 ? Math.round((a.countDinilai / a.totalSiswa) * 100) : 0;

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          {/* 1. Nama Asesmen */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div>
                              <p className="font-semibold text-slate-950 dark:text-slate-50 line-clamp-1">
                                {a.nama}
                              </p>
                              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                Skala Maks: {a.nilaiMaksimum} poin
                              </p>
                            </div>
                          </td>

                          {/* 2. Kelas */}
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                              {a.kelasNama}
                            </span>
                            <span className="block text-xs text-slate-600 dark:text-slate-400">
                              {a.jenjang} {a.tingkat ? `· ${a.tingkat}` : ""}
                            </span>
                          </td>

                          {/* 3. Tanggal */}
                          <td className="py-3.5 px-4 text-center text-xs text-slate-800 dark:text-slate-200 tabular-nums">
                            {formatDate(a.tanggal)}
                          </td>

                          {/* 4. Status (Draf vs Terbit) */}
                          <td className="py-3.5 px-4 text-center">
                            {a.draf ? (
                              <span className="inline-flex items-center rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                                <span className="size-1.5 rounded-full bg-amber-600 dark:bg-amber-400 mr-1.5" />
                                Draf
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                                <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mr-1.5" />
                                Terbit
                              </span>
                            )}
                          </td>

                          {/* 5. Progres Penilaian */}
                          <td className="py-3.5 px-4">
                            <div className="max-w-[160px] mx-auto space-y-1">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-900 dark:text-slate-100 tabular-nums">
                                  {a.countDinilai}/{a.totalSiswa} Siswa
                                </span>
                                <span className="text-slate-600 dark:text-slate-400 tabular-nums">{pct}%</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                                <div
                                  className={`h-full rounded ${pct >= 100 ? "bg-emerald-600" : "bg-blue-600"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                                {a.countBelum > 0 ? (
                                  <span className="text-amber-700 dark:text-amber-400 font-medium">
                                    {a.countBelum} belum
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Lengkap</span>
                                )}
                                {a.countTidakIkut > 0 && (
                                  <span className="text-rose-600 dark:text-rose-400">
                                    {a.countTidakIkut} absen
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 6. Aksi */}
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <Link
                                href={`/teacher/grades/assessment/${a.id}`}
                                className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                <span>Input Nilai</span>
                              </Link>

                              <DropdownMenu>
                                <DropdownMenuTrigger className="grid size-7 place-items-center rounded-md text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer">
                                  <MoreVertical className="size-4" />
                                  <span className="sr-only">Aksi Asesmen</span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-md p-1">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/teacher/grades/assessment/${a.id}`}
                                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                                    >
                                      <FileEdit className="size-3.5 text-slate-500 dark:text-slate-400" />
                                      <span>Edit Nilai Murid</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/teacher/classes/${a.kelasId}`}
                                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                                    >
                                      <BookOpen className="size-3.5 text-slate-500 dark:text-slate-400" />
                                      <span>Buka Detail Kelas</span>
                                    </Link>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 px-4 py-3 sm:px-6 text-xs text-slate-600 dark:text-slate-400">
              <div>
                Menampilkan{" "}
                <span className="font-semibold text-slate-950 dark:text-slate-100">
                  {filteredAssessments.length > 0 ? (assessmentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
                </span>{" "}
                sampai{" "}
                <span className="font-semibold text-slate-950 dark:text-slate-100">
                  {Math.min(assessmentPage * ITEMS_PER_PAGE, filteredAssessments.length)}
                </span>{" "}
                dari <span className="font-semibold text-slate-950 dark:text-slate-100">{filteredAssessments.length}</span> asesmen
              </div>

              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={assessmentPage <= 1}
                  onClick={() => setAssessmentPage((p) => Math.max(p - 1, 1))}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Sebelumnya</span>
                </button>
                <span className="px-2 font-medium text-slate-800 dark:text-slate-200">
                  {assessmentPage} / {totalAssessmentPages}
                </span>
                <button
                  type="button"
                  disabled={assessmentPage >= totalAssessmentPages}
                  onClick={() => setAssessmentPage((p) => Math.min(p + 1, totalAssessmentPages))}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: REKAP NILAI SISWA (Propify Data Table)                     */}
      {/* ================================================================= */}
      {activeTab === "murid" && (
        <div className="space-y-4">
          {/* Table Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-slate-50 tracking-tight">
                Rekap Nilai Siswa
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Ringkasan akumulasi tugas dan nilai rata-rata per murid.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama siswa atau kelas..."
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setStudentPage(1);
                  }}
                  className="w-48 sm:w-64 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Class Filter Dropdown */}
              <select
                value={studentClassFilter}
                onChange={(e) => {
                  setStudentClassFilter(e.target.value);
                  setStudentPage(1);
                }}
                className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:border-blue-600 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nama} · {c.jenjang}
                  </option>
                ))}
              </select>

              {/* Grade Status Filter Dropdown */}
              <select
                value={studentGradeStatusFilter}
                onChange={(e) => {
                  setStudentGradeStatusFilter(e.target.value as "all" | "sudah" | "belum");
                  setStudentPage(1);
                }}
                className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:border-blue-600 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Siswa</option>
                <option value="sudah">Sudah Dinilai</option>
                <option value="belum">Belum Ada Nilai</option>
              </select>
            </div>
          </div>

          {/* Propify Table */}
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <th scope="col" className="py-3 px-4 sm:px-6">Siswa</th>
                    <th scope="col" className="py-3 px-4">Kelas</th>
                    <th scope="col" className="py-3 px-4 text-center">Tugas Dinilai</th>
                    <th scope="col" className="py-3 px-4 text-center">Rata-rata Nilai</th>
                    <th scope="col" className="py-3 px-4 text-center">Terakhir Dinilai</th>
                    <th scope="col" className="py-3 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-600 dark:text-slate-400 text-sm">
                        Tidak ada siswa yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s) => {
                      const initial = (s.nama?.[0] || "S").toUpperCase();

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          {/* 1. Siswa (Avatar + Name + ID) */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="grid size-9 shrink-0 place-items-center rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold">
                                {initial}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-950 dark:text-slate-50 line-clamp-1">
                                  {s.nama}
                                </p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                  ID: {s.id} · Anak #{s.anakId}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 2. Kelas */}
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                              {s.kelasNama}
                            </span>
                            <span className="block text-xs text-slate-600 dark:text-slate-400">
                              {s.jenjang} {s.tingkat ? `· ${s.tingkat}` : ""}
                            </span>
                          </td>

                          {/* 3. Tugas Dinilai */}
                          <td className="py-3.5 px-4 text-center tabular-nums text-slate-900 dark:text-slate-100 font-medium">
                            {s.jumlahNilai > 0 ? (
                              <span>{s.jumlahNilai} tugas</span>
                            ) : (
                              <span className="text-slate-500 dark:text-slate-400">0 tugas</span>
                            )}
                          </td>

                          {/* 4. Rata-rata Nilai */}
                          <td className="py-3.5 px-4 text-center">
                            {s.rataRata != null ? (
                              <span
                                className={`inline-flex items-center justify-center rounded px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                                  s.rataRata >= 80
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                    : s.rataRata >= 70
                                    ? "bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                }`}
                              >
                                {s.rataRata}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                                Belum dinilai
                              </span>
                            )}
                          </td>

                          {/* 5. Terakhir Dinilai */}
                          <td className="py-3.5 px-4 text-center text-xs text-slate-800 dark:text-slate-200 tabular-nums">
                            {formatDate(s.nilaiTerakhir)}
                          </td>

                          {/* 6. Aksi */}
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <Link
                              href={`/teacher/grades/${s.id}`}
                              className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            >
                              <span>{s.jumlahNilai === 0 ? "Input Nilai" : "Kelola"}</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Pagination Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 px-4 py-3 sm:px-6 text-xs text-slate-600 dark:text-slate-400">
              <div>
                Menampilkan{" "}
                <span className="font-semibold text-slate-950 dark:text-slate-100">
                  {filteredStudents.length > 0 ? (studentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
                </span>{" "}
                sampai{" "}
                <span className="font-semibold text-slate-950 dark:text-slate-100">
                  {Math.min(studentPage * ITEMS_PER_PAGE, filteredStudents.length)}
                </span>{" "}
                dari <span className="font-semibold text-slate-950 dark:text-slate-100">{filteredStudents.length}</span> siswa
              </div>

              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={studentPage <= 1}
                  onClick={() => setStudentPage((p) => Math.max(p - 1, 1))}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Sebelumnya</span>
                </button>
                <span className="px-2 font-medium text-slate-800 dark:text-slate-200">
                  {studentPage} / {totalStudentPages}
                </span>
                <button
                  type="button"
                  disabled={studentPage >= totalStudentPages}
                  onClick={() => setStudentPage((p) => Math.min(p + 1, totalStudentPages))}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
