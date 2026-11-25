"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useSetTeacherHeaderAction } from "@/components/teacher/teacher-header-action-context";

export interface StudentAttendanceRow {
  pendaftaranId: number;
  anakId: number;
  nama: string;
  kelasId: number;
  kelasNama: string;
  jenjang: string;
  tingkat?: string | null;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  totalPertemuan: number;
  persentase: number; // 0 - 100
  statusKehadiran: "sangat_baik" | "cukup" | "perlu_perhatian";
}

export interface SessionAttendanceRow {
  id: string;
  kelasId: number;
  kelasNama: string;
  jadwalItemId: number;
  tanggal: string; // YYYY-MM-DD
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  totalSiswa: number;
  hadirCount: number;
  terisiCount: number;
  statusSesi: "terjadwal" | "selesai" | "dibatalkan";
  attendanceUrl: string;
}

export interface AttendanceKPIStats {
  totalPresensiDicatat: number;
  rataRataKehadiran: number;
  totalHadir: number;
  totalIzinSakit: number;
  totalAlpa: number;
  totalSiswaAktif: number;
  unrecordedSessionsCount: number;
}

export interface ClassFilterOption {
  id: number;
  nama: string;
  jenjang: string;
  tingkat?: string | null;
}

export interface TeacherAttendanceOverviewProps {
  stats: AttendanceKPIStats;
  students: StudentAttendanceRow[];
  sessions: SessionAttendanceRow[];
  classes: ClassFilterOption[];
  locale: string;
}

const ITEMS_PER_PAGE = 10;

export function TeacherAttendanceOverview({
  stats,
  students,
  sessions,
  classes,
  locale,
}: TeacherAttendanceOverviewProps) {
  const [activeTab, setActiveTab] = useState<"students" | "sessions">("students");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [studentStatusFilter, setStudentStatusFilter] = useState<string>("all");
  const [studentSearch, setStudentSearch] = useState<string>("");
  const [sessionSearch, setSessionSearch] = useState<string>("");
  const [studentPage, setStudentPage] = useState<number>(1);
  const [sessionPage, setSessionPage] = useState<number>(1);

  const targetAttendanceSession = useMemo(() => {
    return (
      sessions.find(
        (s) => s.statusSesi !== "dibatalkan" && s.terisiCount === 0
      ) ?? sessions[0]
    );
  }, [sessions]);

  useSetTeacherHeaderAction(
    useMemo(
      () => ({
        type: "attendance",
        label: "Isi Presensi Sesi Terdekat",
        href: targetAttendanceSession?.attendanceUrl,
      }),
      [targetAttendanceSession]
    )
  );

  // Dropdown options
  const classOptions = useMemo(() => {
    return [
      { value: "all", label: "Semua Kelas Binaan" },
      ...classes.map((c) => ({
        value: String(c.id),
        label: `${c.nama} (${c.jenjang}${c.tingkat ? ` · ${c.tingkat}` : ""})`,
      })),
    ];
  }, [classes]);

  const studentStatusOptions = [
    { value: "all", label: "Semua Status Kehadiran" },
    { value: "sangat_baik", label: "Sangat Baik (≥ 90%)" },
    { value: "cukup", label: "Cukup (75% - 89%)" },
    { value: "perlu_perhatian", label: "Perlu Perhatian (< 75%)" },
  ];

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (selectedClass !== "all" && String(s.kelasId) !== selectedClass) {
        return false;
      }
      if (studentStatusFilter !== "all" && s.statusKehadiran !== studentStatusFilter) {
        return false;
      }
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        const matchName = s.nama.toLowerCase().includes(q);
        const matchClass = s.kelasNama.toLowerCase().includes(q);
        if (!matchName && !matchClass) return false;
      }
      return true;
    });
  }, [students, selectedClass, studentStatusFilter, studentSearch]);

  const totalStudentPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, studentPage]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((sess) => {
      if (selectedClass !== "all" && String(sess.kelasId) !== selectedClass) {
        return false;
      }
      if (sessionSearch.trim()) {
        const q = sessionSearch.toLowerCase();
        const matchClass = sess.kelasNama.toLowerCase().includes(q);
        const matchDate = sess.tanggal.includes(q);
        if (!matchClass && !matchDate) return false;
      }
      return true;
    });
  }, [sessions, selectedClass, sessionSearch]);

  const totalSessionPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE) || 1;
  const paginatedSessions = useMemo(() => {
    const start = (sessionPage - 1) * ITEMS_PER_PAGE;
    return filteredSessions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSessions, sessionPage]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(`${dateStr}T00:00:00+07:00`);
      return d.toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
        weekday: "short",
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
      {/* 1. Header (Clean, confident typography without badge soup) */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          Rekapitulasi Presensi
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Pantau tingkat kehadiran seluruh murid, rekapitulasi semester, dan kelola sesi pembelajaran kelas binaan.
        </p>
      </div>

      {/* 2. Unrecorded Attendance Alert (If Any) */}
      {stats.unrecordedSessionsCount > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/80 dark:bg-amber-950/40 px-4 py-3 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <p className="font-medium">
              Terdapat <b>{stats.unrecordedSessionsCount} sesi pertemuan</b> yang belum diisi lembar presensinya.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("sessions")}
            className="font-bold text-amber-800 dark:text-amber-300 hover:underline shrink-0 cursor-pointer"
          >
            Buka Daftar Sesi →
          </button>
        </div>
      ) : null}

      {/* 3. KPI Cards ("KPIs are type, not tiles" - No colored square icons) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
          <div className="text-2xl sm:text-3xl font-display font-bold text-slate-950 dark:text-slate-50 tabular-nums">
            {stats.rataRataKehadiran}%
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Rata-rata Kehadiran Kelas
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
          <div className="text-2xl sm:text-3xl font-display font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {stats.totalHadir}
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Akumulasi Hadir
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
          <div className="text-2xl sm:text-3xl font-display font-bold text-amber-600 dark:text-amber-400 tabular-nums">
            {stats.totalIzinSakit}
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Keterangan Izin & Sakit
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
          <div className="text-2xl sm:text-3xl font-display font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {stats.totalAlpa}
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            Total Tanpa Keterangan (Alpa)
          </p>
        </div>
      </div>

      {/* 4. Underline Tabs Navigation */}
      <UnderlineTabs
        tabs={[
          {
            id: "students",
            label: "Rekapitulasi Murid",
            count: filteredStudents.length,
          },
          {
            id: "sessions",
            label: "Daftar Sesi Pertemuan",
            count: filteredSessions.length,
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="Tabs Presensi Guru"
        layoutId="teacher-attendance-tabs"
      />

      {/* ================================================================= */}
      {/* TAB 1: REKAPITULASI MURID                                         */}
      {/* ================================================================= */}
      {activeTab === "students" ? (
        <div className="space-y-4">
          {/* Toolbar Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-slate-50 tracking-tight">
                Matriks Kehadiran Siswa
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Akumulasi kehadiran per murid sepanjang periode bimbingan belajar.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                value={selectedClass}
                onChange={(val) => {
                  setSelectedClass(val);
                  setStudentPage(1);
                  setSessionPage(1);
                }}
                options={classOptions}
                placeholder="Pilih Kelas"
                size="sm"
                className="w-full sm:w-auto"
              />

              <FilterDropdown
                value={studentStatusFilter}
                onChange={(val) => {
                  setStudentStatusFilter(val);
                  setStudentPage(1);
                }}
                options={studentStatusOptions}
                placeholder="Status"
                size="sm"
                className="w-full sm:w-auto"
              />

              <div className="relative">
                <label htmlFor="search-student" className="sr-only">
                  Cari nama murid
                </label>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="search-student"
                  type="search"
                  autoComplete="off"
                  placeholder="Cari nama murid…"
                  value={studentSearch}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setStudentPage(1);
                  }}
                  className="h-9 w-44 sm:w-56 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors shadow-2xs"
                />
                {studentSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStudentSearch("");
                      setStudentPage(1);
                    }}
                    aria-label="Hapus filter murid"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Student Table */}
          {filteredStudents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tidak ada data murid ditemukan
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Silakan sesuaikan filter kelas atau kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th scope="col" className="px-4 py-3">Murid</th>
                      <th scope="col" className="px-4 py-3">Kelas & Jenjang</th>
                      <th scope="col" className="px-3 py-3 text-right">Hadir</th>
                      <th scope="col" className="px-3 py-3 text-right">Izin</th>
                      <th scope="col" className="px-3 py-3 text-right">Sakit</th>
                      <th scope="col" className="px-3 py-3 text-right">Alpa</th>
                      <th scope="col" className="px-3 py-3 text-right">Total Sesi</th>
                      <th scope="col" className="px-4 py-3 text-right">% Kehadiran</th>
                      <th scope="col" className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedStudents.map((s) => (
                      <tr
                        key={s.pendaftaranId}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                          {s.nama}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          <span>{s.kelasNama}</span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">
                            ({s.jenjang})
                          </span>
                        </td>
                        <td className="px-3 py-3.5 text-right font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {s.hadir}
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {s.izin}
                        </td>
                        <td className="px-3 py-3.5 text-right tabular-nums text-slate-700 dark:text-slate-300">
                          {s.sakit}
                        </td>
                        <td className="px-3 py-3.5 text-right font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                          {s.alpa}
                        </td>
                        <td className="px-3 py-3.5 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                          {s.totalPertemuan}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-slate-950 dark:text-slate-50 tabular-nums">
                          {s.persentase}%
                        </td>
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {s.statusKehadiran === "sangat_baik" ? (
                            <span className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              Sangat Baik
                            </span>
                          ) : s.statusKehadiran === "cukup" ? (
                            <span className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Cukup
                            </span>
                          ) : (
                            <span className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              Perlu Perhatian
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalStudentPages > 1 ? (
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3">
                  <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                    Halaman {studentPage} dari {totalStudentPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={studentPage <= 1}
                      onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      aria-label="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="size-4" />
                      <span className="hidden sm:inline">Sebelumnya</span>
                    </button>
                    <button
                      type="button"
                      disabled={studentPage >= totalStudentPages}
                      onClick={() => setStudentPage((p) => Math.min(totalStudentPages, p + 1))}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      aria-label="Halaman Berikutnya"
                    >
                      <span className="hidden sm:inline">Berikutnya</span>
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {/* ================================================================= */}
      {/* TAB 2: DAFTAR SESI PERTEMUAN                                      */}
      {/* ================================================================= */}
      {activeTab === "sessions" ? (
        <div className="space-y-4">
          {/* Toolbar Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950 dark:text-slate-50 tracking-tight">
                Riwayat & Jadwal Sesi Pertemuan
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Kelola pencatatan presensi per sesi kelas secara langsung.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <FilterDropdown
                value={selectedClass}
                onChange={(val) => {
                  setSelectedClass(val);
                  setStudentPage(1);
                  setSessionPage(1);
                }}
                options={classOptions}
                placeholder="Pilih Kelas"
                size="sm"
                className="w-full sm:w-auto"
              />

              <div className="relative">
                <label htmlFor="search-session" className="sr-only">
                  Cari sesi
                </label>
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="search-session"
                  type="search"
                  autoComplete="off"
                  placeholder="Cari kelas atau tanggal (YYYY-MM-DD)…"
                  value={sessionSearch}
                  onChange={(e) => {
                    setSessionSearch(e.target.value);
                    setSessionPage(1);
                  }}
                  className="h-9 w-52 sm:w-64 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors shadow-2xs"
                />
                {sessionSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSessionSearch("");
                      setSessionPage(1);
                    }}
                    aria-label="Hapus filter sesi"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          {/* Session Table */}
          {filteredSessions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center bg-white dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tidak ada sesi pertemuan ditemukan
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Belum ada data sesi pertemuan pada kelas yang dipilih.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300 border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th scope="col" className="px-4 py-3">Tanggal & Waktu</th>
                      <th scope="col" className="px-4 py-3">Kelas</th>
                      <th scope="col" className="px-4 py-3">Kehadiran</th>
                      <th scope="col" className="px-4 py-3">Status Sesi</th>
                      <th scope="col" className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedSessions.map((sess) => {
                      const isComplete = sess.terisiCount > 0 && sess.terisiCount >= sess.totalSiswa;
                      const isPartial = sess.terisiCount > 0 && sess.terisiCount < sess.totalSiswa;
                      const isCancelled = sess.statusSesi === "dibatalkan";

                      return (
                        <tr
                          key={sess.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <div className="font-medium text-slate-900 dark:text-slate-100">
                              {formatDate(sess.tanggal)}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                              {sess.jamMulai.slice(0, 5)} - {sess.jamSelesai.slice(0, 5)} WIB
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {sess.kelasNama}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap tabular-nums">
                            {isCancelled ? (
                              <span className="text-slate-400 dark:text-slate-500">-</span>
                            ) : sess.terisiCount > 0 ? (
                              <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {sess.hadirCount}/{sess.totalSiswa} hadir
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                Belum diisi
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {isCancelled ? (
                              <span className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                Dibatalkan
                              </span>
                            ) : isComplete ? (
                              <span className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                Lengkap ({sess.terisiCount}/{sess.totalSiswa})
                              </span>
                            ) : isPartial ? (
                              <span className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                Sebagian ({sess.terisiCount}/{sess.totalSiswa})
                              </span>
                            ) : (
                              <span className="inline-block rounded px-2 py-0.5 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                Belum Presensi
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            {isCancelled ? (
                              <span className="text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed">
                                Sesi Batal
                              </span>
                            ) : (
                              <Link
                                href={sess.attendanceUrl}
                                className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer shadow-2xs ${
                                  sess.terisiCount > 0
                                    ? "border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                                    : "bg-blue-600 text-white hover:bg-blue-700"
                                }`}
                              >
                                <span>{sess.terisiCount > 0 ? "Edit Presensi" : "Catat Presensi"}</span>
                              </Link>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalSessionPages > 1 ? (
                <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 px-4 py-3">
                  <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                    Halaman {sessionPage} dari {totalSessionPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={sessionPage <= 1}
                      onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      aria-label="Halaman Sebelumnya"
                    >
                      <ChevronLeft className="size-4" />
                      <span className="hidden sm:inline">Sebelumnya</span>
                    </button>
                    <button
                      type="button"
                      disabled={sessionPage >= totalSessionPages}
                      onClick={() => setSessionPage((p) => Math.min(totalSessionPages, p + 1))}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                      aria-label="Halaman Berikutnya"
                    >
                      <span className="hidden sm:inline">Berikutnya</span>
                      <ChevronRight className="size-4" />
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
