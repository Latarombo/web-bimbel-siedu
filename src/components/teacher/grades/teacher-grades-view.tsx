"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import {
  Search,
  Plus,
  MoreVertical,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  FileEdit,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  User,
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Penilaian & Nilai
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kelola asesmen kelas, input capaian belajar, dan pantau rekapitulasi nilai murid.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/teacher/grades/new"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Plus className="size-4 stroke-[2.5]" />
            <span>Buat Penilaian Baru</span>
          </Link>
        </div>
      </div>

      {/* 2. Top 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Total Asesmen */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Asesmen
            </span>
            <div className="grid size-8 place-items-center rounded-md bg-blue-50 text-blue-600">
              <ClipboardList className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {stats.totalAssessments}
            </span>
            <span className="text-xs text-slate-500">kegiatan</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats.totalPublished} diterbitkan · {stats.totalAssessments - stats.totalPublished} draf
          </p>
        </div>

        {/* Metric 2: Siswa Tuntas Dinilai */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Siswa Sudah Dinilai
            </span>
            <div className="grid size-8 place-items-center rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {stats.studentsGraded}
            </span>
            <span className="text-xs text-slate-500">murid</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Memiliki riwayat entri nilai aktif
          </p>
        </div>

        {/* Metric 3: Siswa Belum Dinilai */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Perlu Dinilai
            </span>
            <div className="grid size-8 place-items-center rounded-md bg-amber-50 text-amber-600">
              <AlertCircle className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              {stats.studentsUngraded}
            </span>
            <span className="text-xs text-slate-500">murid</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {stats.studentsUngraded === 0 ? "Seluruh siswa telah memiliki nilai" : "Menunggu input penilaian pertama"}
          </p>
        </div>
      </div>

      {/* 3. Propify Underline Tab Switcher */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6" aria-label="Tabs Penilaian">
          <button
            type="button"
            onClick={() => setActiveTab("tugas")}
            className={`flex items-center gap-2 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "tugas"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <ClipboardList className="size-4" />
            <span>Asesmen Kelas</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "tugas"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {assessments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("murid")}
            className={`flex items-center gap-2 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "murid"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <User className="size-4" />
            <span>Rekap Nilai Siswa</span>
            <span
              className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                activeTab === "murid"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {students.length}
            </span>
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
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Daftar Asesmen ({filteredAssessments.length})
              </h2>
              <p className="text-xs text-slate-500">
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
                  className="w-48 sm:w-64 rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Class Filter Dropdown */}
              <select
                value={assessmentClassFilter}
                onChange={(e) => {
                  setAssessmentClassFilter(e.target.value);
                  setAssessmentPage(1);
                }}
                className="rounded-md border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-700 focus:border-blue-600 focus:outline-hidden cursor-pointer"
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
                className="rounded-md border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-700 focus:border-blue-600 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Status</option>
                <option value="terbit">Diterbitkan</option>
                <option value="draf">Draf</option>
              </select>
            </div>
          </div>

          {/* Propify Table */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    <th scope="col" className="py-3 px-4 sm:px-6">Nama Asesmen</th>
                    <th scope="col" className="py-3 px-4">Kelas</th>
                    <th scope="col" className="py-3 px-4 text-center">Tanggal</th>
                    <th scope="col" className="py-3 px-4 text-center">Status</th>
                    <th scope="col" className="py-3 px-4 text-center">Progres Penilaian</th>
                    <th scope="col" className="py-3 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAssessments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                        Tidak ada asesmen yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedAssessments.map((a) => {
                      const pct = a.totalSiswa > 0 ? Math.round((a.countDinilai / a.totalSiswa) * 100) : 0;

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Nama Asesmen */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="grid size-9 shrink-0 place-items-center rounded-md bg-blue-50 text-blue-600 text-xs font-bold">
                                <GraduationCap className="size-4" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 line-clamp-1">
                                  {a.nama}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  Skala Maks: {a.nilaiMaksimum} poin
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 2. Kelas */}
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-800 text-xs sm:text-sm">
                              {a.kelasNama}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {a.jenjang} {a.tingkat ? `· ${a.tingkat}` : ""}
                            </span>
                          </td>

                          {/* 3. Tanggal */}
                          <td className="py-3.5 px-4 text-center text-xs text-slate-700 tabular-nums">
                            {formatDate(a.tanggal)}
                          </td>

                          {/* 4. Status (Draf vs Terbit) */}
                          <td className="py-3.5 px-4 text-center">
                            {a.draf ? (
                              <span className="inline-flex items-center rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                <span className="size-1.5 rounded-full bg-amber-600 mr-1.5" />
                                Draf
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                                <span className="size-1.5 rounded-full bg-emerald-600 mr-1.5" />
                                Terbit
                              </span>
                            )}
                          </td>

                          {/* 5. Progres Penilaian */}
                          <td className="py-3.5 px-4">
                            <div className="max-w-[160px] mx-auto space-y-1">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className="text-slate-800 tabular-nums">
                                  {a.countDinilai}/{a.totalSiswa} Siswa
                                </span>
                                <span className="text-slate-500 tabular-nums">{pct}%</span>
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded bg-slate-100">
                                <div
                                  className={`h-full rounded ${pct >= 100 ? "bg-emerald-600" : "bg-blue-600"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                {a.countBelum > 0 ? (
                                  <span className="text-amber-700 font-medium">
                                    {a.countBelum} belum
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 font-medium">Lengkap</span>
                                )}
                                {a.countTidakIkut > 0 && (
                                  <span className="text-rose-600">
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
                                className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                              >
                                <FileEdit className="size-3.5" />
                                <span>Input Nilai</span>
                              </Link>

                              <DropdownMenu>
                                <DropdownMenuTrigger className="grid size-7 place-items-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer">
                                  <MoreVertical className="size-4" />
                                  <span className="sr-only">Aksi Asesmen</span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-md rounded-md p-1">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/teacher/grades/assessment/${a.id}`}
                                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded cursor-pointer"
                                    >
                                      <FileEdit className="size-3.5 text-slate-500" />
                                      <span>Edit Nilai Murid</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/teacher/classes/${a.kelasId}`}
                                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded cursor-pointer"
                                    >
                                      <BookOpen className="size-3.5 text-slate-500" />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 sm:px-6 text-xs text-slate-500">
              <div>
                Menampilkan{" "}
                <span className="font-semibold text-slate-900">
                  {filteredAssessments.length > 0 ? (assessmentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
                </span>{" "}
                sampai{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min(assessmentPage * ITEMS_PER_PAGE, filteredAssessments.length)}
                </span>{" "}
                dari <span className="font-semibold text-slate-900">{filteredAssessments.length}</span> asesmen
              </div>

              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={assessmentPage <= 1}
                  onClick={() => setAssessmentPage((p) => Math.max(p - 1, 1))}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Sebelumnya</span>
                </button>
                <span className="px-2 font-medium text-slate-700">
                  {assessmentPage} / {totalAssessmentPages}
                </span>
                <button
                  type="button"
                  disabled={assessmentPage >= totalAssessmentPages}
                  onClick={() => setAssessmentPage((p) => Math.min(p + 1, totalAssessmentPages))}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
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
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Rekap Nilai Siswa ({filteredStudents.length})
              </h2>
              <p className="text-xs text-slate-500">
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
                  className="w-48 sm:w-64 rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Class Filter Dropdown */}
              <select
                value={studentClassFilter}
                onChange={(e) => {
                  setStudentClassFilter(e.target.value);
                  setStudentPage(1);
                }}
                className="rounded-md border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-700 focus:border-blue-600 focus:outline-hidden cursor-pointer"
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
                className="rounded-md border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-700 focus:border-blue-600 focus:outline-hidden cursor-pointer"
              >
                <option value="all">Semua Siswa</option>
                <option value="sudah">Sudah Dinilai</option>
                <option value="belum">Belum Ada Nilai</option>
              </select>
            </div>
          </div>

          {/* Propify Table */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    <th scope="col" className="py-3 px-4 sm:px-6">Siswa</th>
                    <th scope="col" className="py-3 px-4">Kelas</th>
                    <th scope="col" className="py-3 px-4 text-center">Tugas Dinilai</th>
                    <th scope="col" className="py-3 px-4 text-center">Rata-rata Nilai</th>
                    <th scope="col" className="py-3 px-4 text-center">Terakhir Dinilai</th>
                    <th scope="col" className="py-3 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">
                        Tidak ada siswa yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s) => {
                      const initial = (s.nama?.[0] || "S").toUpperCase();

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Siswa (Avatar + Name + ID) */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="grid size-9 shrink-0 place-items-center rounded-md bg-blue-100 text-blue-800 text-xs font-bold">
                                {initial}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900 line-clamp-1">
                                  {s.nama}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  ID: {s.id} · Anak #{s.anakId}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 2. Kelas */}
                          <td className="py-3.5 px-4">
                            <span className="font-medium text-slate-800 text-xs sm:text-sm">
                              {s.kelasNama}
                            </span>
                            <span className="block text-xs text-slate-500">
                              {s.jenjang} {s.tingkat ? `· ${s.tingkat}` : ""}
                            </span>
                          </td>

                          {/* 3. Tugas Dinilai */}
                          <td className="py-3.5 px-4 text-center tabular-nums text-slate-800 font-medium">
                            {s.jumlahNilai > 0 ? (
                              <span>{s.jumlahNilai} tugas</span>
                            ) : (
                              <span className="text-slate-400">0 tugas</span>
                            )}
                          </td>

                          {/* 4. Rata-rata Nilai */}
                          <td className="py-3.5 px-4 text-center">
                            {s.rataRata != null ? (
                              <span
                                className={`inline-flex items-center justify-center rounded px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                                  s.rataRata >= 80
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : s.rataRata >= 70
                                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                                    : "bg-amber-50 text-amber-800 border border-amber-200"
                                }`}
                              >
                                {s.rataRata}
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                                Belum dinilai
                              </span>
                            )}
                          </td>

                          {/* 5. Terakhir Dinilai */}
                          <td className="py-3.5 px-4 text-center text-xs text-slate-600 tabular-nums">
                            {formatDate(s.nilaiTerakhir)}
                          </td>

                          {/* 6. Aksi */}
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <Link
                              href={`/teacher/grades/${s.id}`}
                              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                            >
                              <span>{s.jumlahNilai === 0 ? "Input Nilai" : "Kelola"}</span>
                              <ChevronRight className="size-3.5" />
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/50 px-4 py-3 sm:px-6 text-xs text-slate-500">
              <div>
                Menampilkan{" "}
                <span className="font-semibold text-slate-900">
                  {filteredStudents.length > 0 ? (studentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
                </span>{" "}
                sampai{" "}
                <span className="font-semibold text-slate-900">
                  {Math.min(studentPage * ITEMS_PER_PAGE, filteredStudents.length)}
                </span>{" "}
                dari <span className="font-semibold text-slate-900">{filteredStudents.length}</span> siswa
              </div>

              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={studentPage <= 1}
                  onClick={() => setStudentPage((p) => Math.max(p - 1, 1))}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft className="size-3.5" />
                  <span>Sebelumnya</span>
                </button>
                <span className="px-2 font-medium text-slate-700">
                  {studentPage} / {totalStudentPages}
                </span>
                <button
                  type="button"
                  disabled={studentPage >= totalStudentPages}
                  onClick={() => setStudentPage((p) => Math.min(p + 1, totalStudentPages))}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
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
