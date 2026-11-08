"use client";

import { useState, useMemo } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import {
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ExportClassModal, type ExportType } from "./export-class-modal";
import { QuickAssessmentModal } from "./quick-assessment-modal";
import { QuickGradeDrawer } from "./quick-grade-drawer";

export interface StudentRosterItem {
  id: number; // pendaftaranId
  anakId: number;
  nama: string;
  status: "terdaftar" | "tertunggak" | string;
  nNilai: number;
  rata: number | null;
  hadir: number;
  tercatat: number;
  tingkat?: string | null;
}

export interface ScheduleSlotItem {
  id: number;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  nextSessionDate?: string;
  nextSessionTime?: string;
}

export interface ClassAssessmentItem {
  id: number;
  nama: string;
  tanggal: string;
  nilaiMaksimum: number;
  draf: boolean;
  diterbitkanPada?: string | null;
  countDinilai: number;
  countTidakIkut: number;
  countBelum: number;
  totalSiswa: number;
}

export interface ClassDetailViewProps {
  classId: number;
  className: string;
  jenjang: string;
  tingkat?: string | null;
  classStatus: string;
  kuotaMaksimum: number;
  kuotaMinimum: number;
  periodeNama?: string;
  students: StudentRosterItem[];
  schedules: ScheduleSlotItem[];
  assessments: ClassAssessmentItem[];
  firstTodaySession?: {
    jadwalItemId: number;
    jamMulai: string;
    jamSelesai: string;
  } | null;
  activeAttendanceSession?: {
    jadwalItemId: number;
    tanggalPertemuan: string;
    jamMulai: string;
    jamSelesai: string;
    isToday: boolean;
  } | null;
  todayStr: string;
  locale: string;
  stats: {
    activeStudents: number;
    totalGradeEntries: number;
    totalRecordedAttendance: number;
  };
}

const ITEMS_PER_PAGE = 10;

export function ClassDetailView({
  classId,
  className,
  jenjang,
  tingkat,
  classStatus,
  kuotaMaksimum,
  kuotaMinimum,
  periodeNama,
  students: initialStudents,
  schedules,
  assessments,
  firstTodaySession,
  activeAttendanceSession,
  todayStr,
  stats,
}: ClassDetailViewProps) {
  const router = useRouter();

  const attendanceTarget =
    activeAttendanceSession ??
    (firstTodaySession
      ? {
          jadwalItemId: firstTodaySession.jadwalItemId,
          tanggalPertemuan: todayStr,
          jamMulai: firstTodaySession.jamMulai,
          jamSelesai: firstTodaySession.jamSelesai,
          isToday: true,
        }
      : null);

  // Tabs: "roster" | "schedule" | "assessments" | "summary"
  const [activeTab, setActiveTab] = useState<
    "roster" | "schedule" | "assessments" | "summary"
  >("roster");

  // Local student state for immediate in-place feedback
  const [students, setStudents] = useState<StudentRosterItem[]>(initialStudents);

  // Modals & Drawers state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportInitialType, setExportInitialType] = useState<ExportType>("summary");
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [gradingStudentId, setGradingStudentId] = useState<number | null>(null);

  // Search & pagination state for roster
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered students
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return students;
    return students.filter((s) => s.nama.toLowerCase().includes(q));
  }, [students, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const capacityPct =
    kuotaMaksimum > 0
      ? Math.min(100, Math.round((students.length / kuotaMaksimum) * 100))
      : 0;

  // Active student for QuickGradeDrawer
  const gradingStudentIndex = useMemo(() => {
    if (gradingStudentId == null) return -1;
    return filteredStudents.findIndex((s) => s.id === gradingStudentId);
  }, [gradingStudentId, filteredStudents]);

  const currentGradingStudent =
    gradingStudentIndex >= 0 ? filteredStudents[gradingStudentIndex] : null;

  const handleNextStudent = () => {
    if (gradingStudentIndex < filteredStudents.length - 1) {
      setGradingStudentId(filteredStudents[gradingStudentIndex + 1].id);
    }
  };

  const handlePrevStudent = () => {
    if (gradingStudentIndex > 0) {
      setGradingStudentId(filteredStudents[gradingStudentIndex - 1].id);
    }
  };

  const handleGradeSavedSuccess = (pendaftaranId: number) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === pendaftaranId ? { ...s, nNilai: s.nNilai + 1 } : s))
    );
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* 1. Minimal Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
      >
        <Link
          href="/teacher/dashboard"
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          Dashboard
        </Link>
        <span className="text-slate-400 dark:text-slate-600">/</span>
        <Link
          href="/teacher/classes"
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          Kelas Diampu
        </Link>
        <span className="text-slate-400 dark:text-slate-600">/</span>
        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
          {className} {jenjang} {tingkat ? `· ${tingkat}` : ""}
        </span>
      </nav>

      {/* 2. Page Header Row + Actions */}
      <div className="flex flex-col gap-4 pb-4 border-b border-slate-200 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {className} · {jenjang} {tingkat ? `(${tingkat})` : ""}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {periodeNama ? `Periode: ${periodeNama} · ` : ""}
            Status: {classStatus === "aktif" ? "Aktif" : classStatus}
          </p>
        </div>

        {/* Action Buttons: Primary, Secondary, Utility */}
        <div className="flex flex-wrap items-center gap-2">
          {attendanceTarget ? (
            <Link
              href={`/teacher/classes/${classId}/sessions/${attendanceTarget.tanggalPertemuan}/attendance?sesi=${attendanceTarget.jadwalItemId}`}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors"
            >
              <span>
                {attendanceTarget.isToday
                  ? "Catat Presensi Hari Ini"
                  : "Isi Presensi"}
              </span>
            </Link>
          ) : null}

          <button
            type="button"
            onClick={() => setIsAssessmentModalOpen(true)}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
          >
            <span>Buat Tugas</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setExportInitialType("summary");
              setIsExportModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            title="Ekspor data rombel (CSV)"
          >
            <span>Ekspor</span>
          </button>
        </div>
      </div>

      {/* 3. Sleek Horizontal Underline Tabs Bar (Linear Style) */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <nav className="flex space-x-6 sm:space-x-8" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "roster"}
            onClick={() => setActiveTab("roster")}
            className={`pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
              activeTab === "roster"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <span>Roster Siswa</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "schedule"}
            onClick={() => setActiveTab("schedule")}
            className={`pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
              activeTab === "schedule"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <span>Jadwal & Sesi</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "assessments"}
            onClick={() => setActiveTab("assessments")}
            className={`pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
              activeTab === "assessments"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <span>Tugas & Asesmen</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "summary"}
            onClick={() => setActiveTab("summary")}
            className={`pb-3 text-sm font-medium transition-colors cursor-pointer border-b-2 -mb-px whitespace-nowrap ${
              activeTab === "summary"
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 font-semibold"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            <span>Ringkasan & Aksi</span>
          </button>
        </nav>
      </div>

      {/* 4. Tab Panels */}

      {/* TAB 1: ROSTER SISWA */}
      {activeTab === "roster" && (
        <div className="space-y-3.5">
          {/* Section Toolbar: Header left, Search right */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-950 dark:text-slate-50">
                Daftar Siswa
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daftar murid terdaftar dalam rombongan belajar ini.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama siswa..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-64 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 pl-8 pr-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <th scope="col" className="py-3 px-4 sm:px-6">Siswa</th>
                    <th scope="col" className="py-3 px-4">Status</th>
                    <th scope="col" className="py-3 px-4 text-center">Kehadiran</th>
                    <th scope="col" className="py-3 px-4 text-center">Nilai Rata-rata</th>
                    <th scope="col" className="py-3 px-4 text-center">Entri Tugas</th>
                    <th scope="col" className="py-3 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-12 text-center text-xs sm:text-sm text-slate-500 dark:text-slate-400"
                      >
                        Tidak ada siswa yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s) => {
                      const initial = (s.nama?.[0] || "S").toUpperCase();
                      const attendancePct =
                        s.tercatat > 0
                          ? Math.round((s.hadir / s.tercatat) * 100)
                          : 0;

                      return (
                        <tr
                          key={s.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          {/* 1. Siswa (Avatar + Nama + ID) */}
                          <td className="py-3 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                                {initial}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-950 dark:text-slate-50 truncate text-sm">
                                  {s.nama}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                  ID: {s.id} · Anak #{s.anakId}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 2. Status Registrasi */}
                          <td className="py-3 px-4">
                            {s.status === "terdaftar" ? (
                              <span className="inline-flex items-center rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                                Terdaftar
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                                Tertunggak
                              </span>
                            )}
                          </td>

                          {/* 3. Kehadiran */}
                          <td className="py-3 px-4 text-center">
                            {s.tercatat > 0 ? (
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums text-xs sm:text-sm">
                                  {s.hadir}/{s.tercatat} Sesi
                                </span>
                                <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                                  {attendancePct}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                Belum ada sesi
                              </span>
                            )}
                          </td>

                          {/* 4. Nilai Rata-rata */}
                          <td className="py-3 px-4 text-center">
                            {s.rata != null ? (
                              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums text-sm">
                                {s.rata}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 dark:text-slate-500">
                                Belum dinilai
                              </span>
                            )}
                          </td>

                          {/* 5. Entri Tugas */}
                          <td className="py-3 px-4 text-center tabular-nums text-xs text-slate-700 dark:text-slate-300">
                            {s.nNilai} tugas
                          </td>

                          {/* 6. Aksi: Quick Grade Drawer + Dropdown More */}
                          <td className="py-3 px-4 sm:px-6 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setGradingStudentId(s.id)}
                                className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
                              >
                                <span>Input Nilai</span>
                              </button>

                              <DropdownMenu>
                                <DropdownMenuTrigger
                                  className="grid size-7 place-items-center rounded-md border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
                                  aria-label={`Menu opsi untuk ${s.nama}`}
                                >
                                  <MoreVertical className="size-3.5" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-44 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md rounded-md p-1"
                                >
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/teacher/classes/${classId}/report/${s.id}`}
                                      className="flex w-full items-center px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                                    >
                                      <span>Lihat Rapor Siswa</span>
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/teacher/classes/${classId}/certificate/${s.id}`}
                                      className="flex w-full items-center px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer"
                                    >
                                      <span>Unduh Sertifikat</span>
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

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200 dark:border-slate-800 px-4 py-2.5 bg-slate-50/50 dark:bg-slate-900/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)}{" "}
                  dari {filteredStudents.length} siswa
                </p>

                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Sebelumnya</span>
                  </button>

                  <span className="px-2 text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                    Halaman {currentPage} dari {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    className="inline-flex items-center gap-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: JADWAL & SESI PERTEMUAN */}
      {activeTab === "schedule" && (
        <div className="space-y-3.5">
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-slate-950 dark:text-slate-50">
              Jadwal Sesi Mingguan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Waktu tatap muka rutin rombongan belajar ini dan tautan langsung pencatatan presensi.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {schedules.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  Belum ada jadwal yang ditentukan untuk kelas ini.
                </div>
              ) : (
                schedules.map((j) => (
                  <div
                    key={j.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Hari {j.hari}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                        {j.jamMulai.slice(0, 5)} - {j.jamSelesai.slice(0, 5)} WIB
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {j.nextSessionDate ? (
                        <div className="text-left sm:text-right">
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300 block">
                            Sesi Berikutnya: {j.nextSessionDate}
                          </span>
                          {j.nextSessionTime ? (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 block tabular-nums">
                              {j.nextSessionTime}
                            </span>
                          ) : null}
                        </div>
                      ) : null}

                      {j.nextSessionDate ? (
                        <Link
                          href={`/teacher/classes/${classId}/sessions/${j.nextSessionDate}/attendance?sesi=${j.id}`}
                          className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer"
                        >
                          <span>Presensi</span>
                        </Link>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TUGAS & ASESMEN */}
      {activeTab === "assessments" && (
        <div className="space-y-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-950 dark:text-slate-50">
                Tugas & Asesmen
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daftar tugas, kuis, dan ujian terstruktur untuk kelas ini.
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={() => setIsAssessmentModalOpen(true)}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors cursor-pointer"
              >
                <span>Buat Tugas</span>
              </button>
            </div>
          </div>

          {assessments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Belum ada tugas untuk kelas ini
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Buat tugas pertama untuk mulai mencatat penilaian siswa di rombongan belajar ini.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setIsAssessmentModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 px-3.5 py-2 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors cursor-pointer"
                >
                  <span>Buat Tugas Pertama</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <th className="py-3 px-4 sm:px-6">Nama Tugas & Tanggal</th>
                      <th className="py-3 px-4 text-center">Nilai Maks.</th>
                      <th className="py-3 px-4 text-center">Status Siswa</th>
                      <th className="py-3 px-4 text-center">Publikasi</th>
                      <th className="py-3 px-4 sm:px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {assessments.map((a) => (
                      <tr
                        key={a.id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="py-3 px-4 sm:px-6">
                          <Link
                            href={`/teacher/grades/assessment/${a.id}`}
                            className="font-medium text-slate-900 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
                          >
                            {a.nama}
                          </Link>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                            {a.tanggal}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-center tabular-nums font-medium text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                          {a.nilaiMaksimum}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="text-xs font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                              {a.countDinilai}/{a.totalSiswa} Dinilai
                            </span>
                            {a.countBelum > 0 ? (
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 tabular-nums">
                                {a.countBelum} belum
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {a.draf ? (
                            <span className="inline-flex items-center rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700">
                              Draf
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                              Terbit
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 sm:px-6 text-right">
                          <Link
                            href={`/teacher/grades/assessment/${a.id}`}
                            className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
                          >
                            <span>Nilai Siswa</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: RINGKASAN & AKSI KELAS */}
      {activeTab === "summary" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* Card 1: Statistik Mengajar (KPIs are type, not tiles) */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Statistik Kelas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ringkasan kuota dan aktivitas data kelas.
              </p>
            </div>

            <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-600 dark:text-slate-400">Status Kelas</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200 capitalize">
                  {classStatus === "aktif" ? "Aktif" : classStatus}
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-600 dark:text-slate-400">Siswa Aktif</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.activeStudents} siswa
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-600 dark:text-slate-400">Entri Penilaian Guru</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.totalGradeEntries} entri
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-600 dark:text-slate-400">Presensi Tercatat</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stats.totalRecordedAttendance} data
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-600 dark:text-slate-400">Kapasitas Kuota</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                  {students.length}/{kuotaMaksimum} ({capacityPct}%)
                </dd>
              </div>
              <div className="flex items-center justify-between py-2">
                <dt className="text-slate-600 dark:text-slate-400">Kuota Minimum</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200 tabular-nums">
                  {kuotaMinimum} siswa
                </dd>
              </div>
            </dl>

            <div className="pt-1">
              <div className="h-1.5 w-full overflow-hidden rounded bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded ${
                    capacityPct >= 90 ? "bg-amber-500" : "bg-blue-600"
                  }`}
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Unduhan & Rekapitulasi */}
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 shadow-2xs">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Aksi & Rekap Data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ekspor data kelas dan kelola dokumentasi belajar siswa.
              </p>
            </div>

            <div className="space-y-2">
              <Link
                href="/teacher/status"
                className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Dokumentasi Belajar
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Bagikan foto kegiatan pembelajaran ke orang tua
                  </p>
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Buka
                </span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setExportInitialType("attendance");
                  setIsExportModalOpen(true);
                }}
                className="w-full flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Rekap Presensi (CSV)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Unduh riwayat kehadiran seluruh sesi rombel
                  </p>
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Unduh
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setExportInitialType("grades");
                  setIsExportModalOpen(true);
                }}
                className="w-full flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer"
              >
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Rekap Nilai (CSV)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Unduh data nilai tugas dan asesmen siswa
                  </p>
                </div>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                  Unduh
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERLAYS: MODALS & SLIDE-OVER DRAWERS */}
      {/* 1. ExportClassModal (Stripe style) */}
      <ExportClassModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        classId={classId}
        initialType={exportInitialType}
      />

      {/* 2. QuickAssessmentModal (Linear style) */}
      <QuickAssessmentModal
        isOpen={isAssessmentModalOpen}
        onClose={() => setIsAssessmentModalOpen(false)}
        classId={classId}
        onSuccess={() => {
          setActiveTab("assessments");
          router.refresh();
        }}
      />

      {/* 3. QuickGradeDrawer (Google Classroom SpeedGrader style) */}
      <QuickGradeDrawer
        isOpen={gradingStudentId != null}
        onClose={() => setGradingStudentId(null)}
        student={currentGradingStudent}
        studentIndex={gradingStudentIndex}
        totalStudents={filteredStudents.length}
        onNextStudent={handleNextStudent}
        onPrevStudent={handlePrevStudent}
        classId={classId}
        onSavedSuccess={handleGradeSavedSuccess}
      />
    </div>
  );
}
