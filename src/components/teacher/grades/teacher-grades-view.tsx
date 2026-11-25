"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { QuickAssessmentModal } from "@/components/teacher/classes/quick-assessment-modal";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import {
  Search,
  FileEdit,
  BookOpen,
  X,
} from "lucide-react";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import { TablePagination } from "@/components/ui/table-pagination";

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
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"tugas" | "murid">(initialTab);
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);

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

  const classFilterOptions = useMemo(() => [
    { value: "all", label: "Semua Kelas" },
    ...classes.map((c) => ({
      value: String(c.id),
      label: `${c.nama} · ${c.jenjang}`,
    })),
  ], [classes]);

  const assessmentStatusOptions = useMemo(() => [
    { value: "all", label: "Semua Status" },
    { value: "terbit", label: "Diterbitkan" },
    { value: "draf", label: "Draf" },
  ], []);

  const studentGradeStatusOptions = useMemo(() => [
    { value: "all", label: "Semua Siswa" },
    { value: "sudah", label: "Sudah Dinilai" },
    { value: "belum", label: "Belum Ada Nilai" },
  ], []);

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
          <button
            type="button"
            onClick={() => setIsAssessmentModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
          >
            <span>Buat Tugas Baru</span>
          </button>
        </div>
      </div>

      {/* 2. Banner Perlu Dinilai (Hanya Muncul Saat Ada Antrean Siswa Belum Dinilai) */}
      {stats.studentsUngraded > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 px-4 py-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <p className="font-medium">
              Terdapat <b>{stats.studentsUngraded} siswa</b> yang belum dinilai pada asesmen aktif.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("murid")}
            className="font-bold text-amber-800 dark:text-amber-300 hover:underline shrink-0 cursor-pointer"
          >
            Buka Rekap Siswa →
          </button>
        </div>
      )}

      {/* 3. Propify Underline Tab Switcher with sliding animation */}
      <UnderlineTabs
        tabs={[
          { id: "tugas", label: "Asesmen Kelas" },
          { id: "murid", label: "Rekap Nilai Siswa" },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Tabs Penilaian"
        layoutId="teacher-grades-tabs"
      />

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

            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative">
                <label htmlFor="search-assessment" className="sr-only">
                  Cari nama tugas atau kelas
                </label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="search-assessment"
                  type="search"
                  autoComplete="off"
                  placeholder="Cari nama tugas atau kelas…"
                  value={assessmentSearch}
                  onChange={(e) => {
                    setAssessmentSearch(e.target.value);
                    setAssessmentPage(1);
                  }}
                  className="h-10 sm:h-9 w-48 sm:w-64 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-8 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors shadow-2xs"
                />
                {assessmentSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAssessmentSearch("");
                      setAssessmentPage(1);
                    }}
                    aria-label="Hapus filter tugas atau kelas"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              {/* Class Filter Dropdown */}
              <FilterDropdown
                value={assessmentClassFilter}
                onChange={(val) => {
                  setAssessmentClassFilter(val);
                  setAssessmentPage(1);
                }}
                options={classFilterOptions}
                ariaLabel="Filter kelas asesmen"
                size="sm"
              />

              {/* Status Filter Dropdown */}
              <FilterDropdown
                value={assessmentStatusFilter}
                onChange={(val) => {
                  setAssessmentStatusFilter(val as "all" | "terbit" | "draf");
                  setAssessmentPage(1);
                }}
                options={assessmentStatusOptions}
                ariaLabel="Filter status publikasi asesmen"
                size="sm"
              />
            </div>
          </div>

          {/* Propify Table & Mobile Cards */}
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            {/* Desktop Table View (>= md) */}
            <div
              tabIndex={0}
              role="region"
              aria-label="Tabel rekap tugas dan asesmen kelas"
              className="hidden md:block overflow-x-auto overscroll-x-contain focus:outline-hidden focus:ring-1 focus:ring-brand/30"
            >
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <th scope="col" className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">No</th>
                    <th scope="col" className="sticky left-12 z-20 min-w-[160px] max-w-[240px] bg-slate-50 dark:bg-slate-800 py-3 px-4 sm:px-6 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]">Nama Asesmen</th>
                    <th scope="col" className="py-3 px-4 whitespace-nowrap">Kelas</th>
                    <th scope="col" className="py-3 px-4 text-right whitespace-nowrap">Tanggal</th>
                    <th scope="col" className="py-3 px-4 text-right whitespace-nowrap">Siswa Dinilai</th>
                    <th scope="col" className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                    <th scope="col" className="sticky right-0 z-20 py-3 px-4 sm:px-6 text-right bg-slate-50 dark:bg-slate-800 border-l border-slate-200/80 dark:border-slate-800/80 shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedAssessments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-600 dark:text-slate-400 text-sm">
                        Tidak ada asesmen yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedAssessments.map((a, idx) => {
                      return (
                        <tr key={a.id} className="group/row relative border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          {/* 1. Nomor Urut (Sticky Left 0) */}
                          <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs transition-colors">
                            {(assessmentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                          </td>

                          {/* 2. Nama Asesmen (Sticky Left 12, Truncate, Title) */}
                          <td className="sticky left-12 z-10 min-w-[160px] max-w-[240px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 sm:px-6 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                            <p className="font-semibold text-slate-950 dark:text-slate-50 truncate text-sm" title={a.nama}>
                              {a.nama}
                            </p>
                          </td>

                          {/* 3. Kelas (1 Data) */}
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate max-w-[160px] block" title={a.kelasNama}>
                              {a.kelasNama}
                            </span>
                          </td>

                          {/* 4. Tanggal (1 Data) */}
                          <td className="py-3 px-4 text-right text-xs text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
                            {formatDate(a.tanggal)}
                          </td>

                          {/* 5. Siswa Dinilai (1 Data) */}
                          <td className="py-3 px-4 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm whitespace-nowrap">
                            {a.countDinilai}/{a.totalSiswa}
                          </td>

                          {/* 6. Status (1 Data) */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-2 text-xs font-medium">
                              <span
                                className={`size-1.5 rounded-full ${
                                  a.draf ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                              />
                              <span className="text-slate-700 dark:text-slate-300">
                                {a.draf ? "Draf" : "Terbit"}
                              </span>
                            </span>
                          </td>

                          {/* 7. Aksi (Sticky Right 0) */}
                          <td className="sticky right-0 z-10 py-3 px-4 sm:px-6 text-right bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 border-l border-slate-200/80 dark:border-slate-800/80 shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                            <div className="inline-flex items-center gap-2 opacity-70 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity duration-150 max-sm:opacity-100">
                              <Link
                                href={`/teacher/classes/${a.kelasId}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs transition-colors cursor-pointer"
                                title="Buka Detail Kelas"
                              >
                                <BookOpen className="size-3.5" aria-hidden="true" />
                                <span>Detail</span>
                              </Link>

                              <Link
                                href={`/teacher/grades/assessment/${a.id}`}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:border-slate-400 dark:hover:border-slate-600 shadow-2xs transition-colors cursor-pointer"
                                title="Input Nilai Asesmen"
                              >
                                <FileEdit className="size-3.5" aria-hidden="true" />
                                <span>Input Nilai</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedAssessments.length === 0 ? (
                <div className="py-12 text-center text-slate-600 dark:text-slate-400 text-sm px-4">
                  Tidak ada asesmen yang sesuai dengan filter pencarian.
                </div>
              ) : (
                paginatedAssessments.map((a, idx) => {
                  const pct = a.totalSiswa > 0 ? Math.round((a.countDinilai / a.totalSiswa) * 100) : 0;

                  return (
                    <div
                      key={a.id}
                      className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="size-6 shrink-0 grid place-items-center rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 tabular-nums mt-0.5">
                            {(assessmentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/teacher/grades/assessment/${a.id}`}
                              className="font-semibold text-slate-950 dark:text-slate-50 hover:text-blue-600 dark:hover:text-blue-400 text-sm line-clamp-1"
                            >
                              {a.nama}
                            </Link>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {a.kelasNama} · {a.jenjang} {a.tingkat ? `(${a.tingkat})` : ""}
                            </p>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-2 text-xs font-medium shrink-0 pt-0.5">
                          <span
                            className={`size-2 rounded-full ${
                              a.draf ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          />
                          <span className="text-slate-700 dark:text-slate-300">
                            {a.draf ? "Draf" : "Terbit"}
                          </span>
                        </span>
                      </div>

                      {/* Meta info & Progress Bar */}
                      <div className="rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/30 p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                          <span>{formatDate(a.tanggal)}</span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-semibold">
                            <span className="text-slate-900 dark:text-slate-100 tabular-nums">
                              {a.countDinilai}/{a.totalSiswa} Siswa dinilai
                            </span>
                            <span className="text-slate-600 dark:text-slate-400 tabular-nums">{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded bg-slate-200 dark:bg-slate-700">
                            <div
                              className={`h-full rounded ${pct >= 100 ? "bg-emerald-600" : "bg-blue-600"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/teacher/classes/${a.kelasId}`}
                          className="flex-1 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors"
                        >
                          <BookOpen className="size-4" aria-hidden="true" />
                          <span>Detail</span>
                        </Link>
                        <Link
                          href={`/teacher/grades/assessment/${a.id}`}
                          className="flex-1 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors"
                        >
                          <FileEdit className="size-4" aria-hidden="true" />
                          <span>Input Nilai</span>
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Table Pagination Footer */}
            <TablePagination
              currentPage={assessmentPage}
              totalPages={totalAssessmentPages}
              totalItems={filteredAssessments.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemLabel="asesmen"
              onPageChange={setAssessmentPage}
            />
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

            <div className="flex flex-wrap items-center gap-2">
              {/* Search input */}
              <div className="relative">
                <label htmlFor="search-student-grade" className="sr-only">
                  Cari nama siswa atau kelas
                </label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="search-student-grade"
                  type="search"
                  autoComplete="off"
                  placeholder="Cari nama siswa atau kelas…"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setStudentPage(1);
                  }}
                  className="h-10 sm:h-9 w-48 sm:w-64 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-8 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors shadow-2xs"
                />
                {studentSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStudentSearch("");
                      setStudentPage(1);
                    }}
                    aria-label="Hapus filter nama siswa atau kelas"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              {/* Class Filter Dropdown */}
              <FilterDropdown
                value={studentClassFilter}
                onChange={(val) => {
                  setStudentClassFilter(val);
                  setStudentPage(1);
                }}
                options={classFilterOptions}
                ariaLabel="Filter kelas siswa"
                size="sm"
              />

              {/* Grade Status Filter Dropdown */}
              <FilterDropdown
                value={studentGradeStatusFilter}
                onChange={(val) => {
                  setStudentGradeStatusFilter(val as "all" | "sudah" | "belum");
                  setStudentPage(1);
                }}
                options={studentGradeStatusOptions}
                ariaLabel="Filter status nilai siswa"
                size="sm"
              />
            </div>
          </div>

          {/* Propify Table & Mobile Cards */}
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            {/* Desktop Table View (>= md) */}
            <div
              tabIndex={0}
              role="region"
              aria-label="Tabel rekap nilai siswa per kelas"
              className="hidden md:block overflow-x-auto overscroll-x-contain focus:outline-hidden focus:ring-1 focus:ring-brand/30"
            >
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <th scope="col" className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">No</th>
                    <th scope="col" className="sticky left-12 z-20 min-w-[150px] max-w-[220px] bg-slate-50 dark:bg-slate-800 py-3 px-4 sm:px-6 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]">Siswa</th>
                    <th scope="col" className="py-3 px-4 whitespace-nowrap">Kelas</th>
                    <th scope="col" className="py-3 px-4 text-right whitespace-nowrap">Tugas Dinilai</th>
                    <th scope="col" className="py-3 px-4 text-right whitespace-nowrap">Rata-rata Nilai</th>
                    <th scope="col" className="py-3 px-4 text-right whitespace-nowrap">Terakhir Dinilai</th>
                    <th scope="col" className="sticky right-0 z-20 py-3 px-4 sm:px-6 text-right bg-slate-50 dark:bg-slate-800 border-l border-slate-200/80 dark:border-slate-800/80 shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-600 dark:text-slate-400 text-sm">
                        Tidak ada siswa yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s, idx) => {
                      return (
                        <tr key={s.id} className="group/row relative border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          {/* 1. Nomor Urut (Sticky Left 0) */}
                          <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs transition-colors">
                            {(studentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                          </td>

                          {/* 2. Siswa (Sticky Left 12, Truncate, Title) */}
                          <td className="sticky left-12 z-10 min-w-[150px] max-w-[220px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 sm:px-6 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                            <span className="font-semibold text-slate-950 dark:text-slate-50 truncate block text-sm" title={s.nama}>
                              {s.nama}
                            </span>
                          </td>

                          {/* 3. Kelas (1 Data) */}
                          <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                            <span className="truncate max-w-[160px] block" title={s.kelasNama}>
                              {s.kelasNama}
                            </span>
                          </td>

                          {/* 4. Tugas Dinilai */}
                          <td className="py-3 px-4 text-right tabular-nums text-slate-900 dark:text-slate-100 font-medium whitespace-nowrap">
                            {s.jumlahNilai > 0 ? (
                              <span>{s.jumlahNilai} tugas</span>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500">0 tugas</span>
                            )}
                          </td>

                          {/* 5. Rata-rata Nilai (Clean typography without badge clutter) */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {s.rataRata != null ? (
                              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums text-sm">
                                {s.rataRata}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                Belum dinilai
                              </span>
                            )}
                          </td>

                          {/* 6. Terakhir Dinilai */}
                          <td className="py-3 px-4 text-right text-xs text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">
                            {formatDate(s.nilaiTerakhir)}
                          </td>

                          {/* 7. Aksi (Sticky Right 0) */}
                          <td className="sticky right-0 z-10 py-3 px-4 sm:px-6 text-right bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 border-l border-slate-200/80 dark:border-slate-800/80 shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                            <div className="flex items-center justify-end opacity-70 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity duration-150 max-sm:opacity-100">
                              <Link
                                href={`/teacher/grades/${s.id}`}
                                className="inline-flex items-center justify-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-blue-600 dark:hover:text-blue-400 hover:border-slate-400 dark:hover:border-slate-600 transition-colors shadow-2xs cursor-pointer"
                              >
                                <span>{s.jumlahNilai === 0 ? "Input Nilai" : "Kelola"}</span>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-600 dark:text-slate-400 text-sm px-4">
                  Tidak ada siswa yang sesuai dengan filter pencarian.
                </div>
              ) : (
                paginatedStudents.map((s, idx) => {
                  const initial = (s.nama?.[0] || "S").toUpperCase();

                  return (
                    <div
                      key={s.id}
                      className="p-4 space-y-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="size-6 shrink-0 grid place-items-center rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                          {(studentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </span>
                        <div className="grid size-9 shrink-0 place-items-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950 dark:text-slate-50 truncate text-sm">
                            {s.nama}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                            {s.kelasNama} · {s.jenjang}
                          </p>
                        </div>
                      </div>

                      {/* 2-Column Metrics */}
                      <div className="grid grid-cols-2 gap-2 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/30 p-3 text-center">
                        <div className="border-r border-slate-200/60 dark:border-slate-800/80 pr-2">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                            Rata-rata Nilai
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums text-sm">
                            {s.rataRata != null ? s.rataRata : "—"}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            {s.rataRata != null ? "Rata-rata kumulatif" : "Belum dinilai"}
                          </span>
                        </div>

                        <div className="pl-2">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                            Tugas Dinilai
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums text-sm">
                            {s.jumlahNilai} tugas
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block tabular-nums">
                            {s.nilaiTerakhir ? formatDate(s.nilaiTerakhir) : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Link
                        href={`/teacher/grades/${s.id}`}
                        className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 flex items-center justify-center text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors"
                      >
                        <span>{s.jumlahNilai === 0 ? "Input Nilai" : "Kelola"}</span>
                      </Link>
                    </div>
                  );
                })
              )}
            </div>

            {/* Table Pagination Footer */}
            <TablePagination
              currentPage={studentPage}
              totalPages={totalStudentPages}
              totalItems={filteredStudents.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemLabel="siswa"
              onPageChange={setStudentPage}
            />
          </div>
        </div>
      )}

      {/* QuickAssessmentModal for Creating New Assessment */}
      <QuickAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        classes={classes}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}
