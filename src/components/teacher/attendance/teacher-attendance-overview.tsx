"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { UnderlineTabs } from "@/components/ui/underline-tabs";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { TablePagination } from "@/components/ui/table-pagination";
import {
  Search,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
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
  const [studentSort, setStudentSort] = useState<{
    key: "nama" | "kelas" | "jenjang" | "hadir" | "alpa" | "total" | "persentase";
    dir: "asc" | "desc";
  } | null>(null);
  const [sessionSort, setSessionSort] = useState<{
    key: "tanggal" | "kelas" | "kehadiran" | "status";
    dir: "asc" | "desc";
  } | null>(null);

  const toggleStudentSort = (
    key: "nama" | "kelas" | "jenjang" | "hadir" | "alpa" | "total" | "persentase",
  ) => {
    setStudentSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === "asc" ? { key, dir: "desc" } : null;
      }
      return { key, dir: "asc" };
    });
    setStudentPage(1);
  };

  const toggleSessionSort = (
    key: "tanggal" | "kelas" | "kehadiran" | "status",
  ) => {
    setSessionSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === "asc" ? { key, dir: "desc" } : null;
      }
      return { key, dir: "asc" };
    });
    setSessionPage(1);
  };

  const renderSortIcon = (
    state: { key: string; dir: "asc" | "desc" } | null,
    key: string,
  ) =>
    state?.key === key ? (
      state.dir === "asc" ? (
        <ArrowUp className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
      ) : (
        <ArrowDown className="size-3 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
      )
    ) : (
      <ArrowUpDown className="size-3 text-slate-400 opacity-60 shrink-0" aria-hidden="true" />
    );

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
    const list = students.filter((s) => {
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

    if (studentSort) {
      const { key, dir } = studentSort;
      list.sort((a, b) => {
        let cmp = 0;
        if (key === "nama") {
          cmp = a.nama.localeCompare(b.nama, "id");
        } else if (key === "kelas") {
          cmp = a.kelasNama.localeCompare(b.kelasNama, "id");
        } else if (key === "jenjang") {
          cmp = a.jenjang.localeCompare(b.jenjang, "id");
        } else if (key === "hadir") {
          cmp = a.hadir - b.hadir;
        } else if (key === "alpa") {
          cmp = a.alpa - b.alpa;
        } else if (key === "total") {
          cmp = a.totalPertemuan - b.totalPertemuan;
        } else if (key === "persentase") {
          cmp = a.persentase - b.persentase;
        }
        return dir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [students, selectedClass, studentStatusFilter, studentSearch, studentSort]);

  const totalStudentPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (studentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, studentPage]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    const list = sessions.filter((sess) => {
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

    if (sessionSort) {
      const { key, dir } = sessionSort;
      list.sort((a, b) => {
        let cmp = 0;
        if (key === "tanggal") {
          cmp =
            a.tanggal.localeCompare(b.tanggal) ||
            a.jamMulai.localeCompare(b.jamMulai);
        } else if (key === "kelas") {
          cmp = a.kelasNama.localeCompare(b.kelasNama, "id");
        } else if (key === "kehadiran") {
          const pctA = a.totalSiswa > 0 ? a.hadirCount / a.totalSiswa : 0;
          const pctB = b.totalSiswa > 0 ? b.hadirCount / b.totalSiswa : 0;
          cmp = pctA - pctB || a.terisiCount - b.terisiCount;
        } else if (key === "status") {
          const rank = (s: SessionAttendanceRow) =>
            s.statusSesi === "dibatalkan" ? 0 : s.terisiCount > 0 ? 3 : 1;
          cmp = rank(a) - rank(b);
        }
        return dir === "asc" ? cmp : -cmp;
      });
    }

    return list;
  }, [sessions, selectedClass, sessionSearch, sessionSort]);

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
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          Rekapitulasi Presensi
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Pantau tingkat kehadiran seluruh murid, rekapitulasi semester, dan kelola sesi pembelajaran kelas binaan.
        </p>
      </div>

      {/* 2. KPI Cards ("KPIs are type, not tiles" - No colored square icons) */}
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
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tidak ada data murid ditemukan
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Silakan sesuaikan filter kelas atau kata kunci pencarian Anda.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              {/* Responsive Scrollable Table (Desktop & Mobile) */}
              <div
                tabIndex={0}
                role="region"
                aria-label="Tabel rekapitulasi kehadiran murid"
                className="w-full overflow-x-auto overscroll-x-contain focus:outline-hidden focus:ring-1 focus:ring-blue-600/30 touch-pan-x"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <table className="w-full min-w-[1000px] text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <th scope="col" className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">No</th>
                      <th
                        scope="col"
                        aria-sort={studentSort?.key === "nama" ? (studentSort.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="sticky left-12 z-20 min-w-[170px] max-w-[240px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStudentSort("nama")}
                          className="flex w-full items-center justify-between gap-1.5 py-3 px-4 sm:px-6 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Murid</span>
                          {renderSortIcon(studentSort, "nama")}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={studentSort?.key === "kelas" ? (studentSort.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 whitespace-nowrap text-left"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStudentSort("kelas")}
                          className="inline-flex w-full items-center justify-between gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Kelas</span>
                          {renderSortIcon(studentSort, "kelas")}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={studentSort?.key === "jenjang" ? (studentSort.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 whitespace-nowrap text-left"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStudentSort("jenjang")}
                          className="inline-flex w-full items-center justify-between gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Jenjang</span>
                          {renderSortIcon(studentSort, "jenjang")}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={studentSort?.key === "hadir" ? (studentSort.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-right whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStudentSort("hadir")}
                          className="inline-flex w-full items-center justify-end gap-1.5 py-3 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Hadir</span>
                          {renderSortIcon(studentSort, "hadir")}
                        </button>
                      </th>
                      <th scope="col" className="px-3 py-3 text-right whitespace-nowrap">Izin</th>
                      <th scope="col" className="px-3 py-3 text-right whitespace-nowrap">Sakit</th>
                      <th
                        scope="col"
                        aria-sort={studentSort?.key === "alpa" ? (studentSort.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-right whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStudentSort("alpa")}
                          className="inline-flex w-full items-center justify-end gap-1.5 py-3 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Alpa</span>
                          {renderSortIcon(studentSort, "alpa")}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={studentSort?.key === "total" ? (studentSort.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-right whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStudentSort("total")}
                          className="inline-flex w-full items-center justify-end gap-1.5 py-3 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Total Sesi</span>
                          {renderSortIcon(studentSort, "total")}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={studentSort?.key === "persentase" ? (studentSort.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-right whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleStudentSort("persentase")}
                          className="inline-flex w-full items-center justify-end gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>% Kehadiran</span>
                          {renderSortIcon(studentSort, "persentase")}
                        </button>
                      </th>
                      <th scope="col" className="md:sticky md:right-0 md:z-20 px-4 py-3 text-center bg-slate-50 dark:bg-slate-800 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedStudents.map((s, idx) => (
                      <tr
                        key={s.pendaftaranId}
                        className="group/row relative border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        {/* 1. Nomor Urut (Sticky Left 0) */}
                        <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs transition-colors">
                          {(studentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                        </td>

                        {/* 2. Murid (Sticky Left 12) */}
                        <td className="sticky left-12 z-10 min-w-[170px] max-w-[240px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 sm:px-6 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                          <span
                            className="font-semibold text-slate-950 dark:text-slate-50 text-sm truncate block"
                            title={s.nama}
                          >
                            {s.nama}
                          </span>
                        </td>

                        {/* 3. Kelas */}
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900 dark:text-slate-100">
                          {s.kelasNama}
                        </td>

                        {/* 4. Jenjang */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                          {s.jenjang}
                        </td>

                        {/* 4. Hadir */}
                        <td className="px-3 py-3 text-right text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                          {s.hadir}
                        </td>

                        {/* 5. Izin */}
                        <td className="px-3 py-3 text-right text-xs sm:text-sm tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {s.izin}
                        </td>

                        {/* 6. Sakit */}
                        <td className="px-3 py-3 text-right text-xs sm:text-sm tabular-nums text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          {s.sakit}
                        </td>

                        {/* 7. Alpa */}
                        <td className="px-3 py-3 text-right text-xs sm:text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">
                          {s.alpa}
                        </td>

                        {/* 8. Total Sesi */}
                        <td className="px-3 py-3 text-right text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                          {s.totalPertemuan}
                        </td>

                        {/* 9. Persentase Kehadiran */}
                        <td className="px-4 py-3 text-right text-xs sm:text-sm font-bold text-slate-950 dark:text-slate-50 tabular-nums whitespace-nowrap">
                          {s.persentase}%
                        </td>

                        {/* 10. Status (Sticky Right on Desktop) */}
                        <td className="md:sticky md:right-0 md:z-10 px-4 py-3 text-center whitespace-nowrap bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                          <span className="inline-flex items-center gap-2 text-xs font-medium">
                            <span
                              className={`size-1.5 rounded-full ${
                                s.statusKehadiran === "sangat_baik"
                                  ? "bg-emerald-500"
                                  : s.statusKehadiran === "cukup"
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                              }`}
                            />
                            <span className="text-slate-700 dark:text-slate-300">
                              {s.statusKehadiran === "sangat_baik"
                                ? "Sangat Baik"
                                : s.statusKehadiran === "cukup"
                                  ? "Cukup"
                                  : "Perlu Perhatian"}
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <TablePagination
                currentPage={studentPage}
                totalPages={totalStudentPages}
                totalItems={filteredStudents.length}
                itemsPerPage={ITEMS_PER_PAGE}
                itemLabel="murid"
                onPageChange={setStudentPage}
              />
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
            <div className="rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 sm:p-12 text-center">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Tidak ada sesi pertemuan ditemukan
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Belum ada data sesi pertemuan pada kelas yang dipilih.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
              {/* Responsive Scrollable Table (Desktop & Mobile) */}
              <div
                tabIndex={0}
                role="region"
                aria-label="Tabel daftar sesi pertemuan"
                className="w-full overflow-x-auto overscroll-x-contain focus:outline-hidden focus:ring-1 focus:ring-blue-600/30 touch-pan-x"
                style={{ WebkitOverflowScrolling: "touch" }}
              >
                <table className="w-full min-w-[860px] text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <th scope="col" className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">No</th>
                      <th
                        scope="col"
                        aria-sort={sessionSort?.key === "tanggal" ? (sessionSort.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="sticky left-12 z-20 min-w-[200px] bg-slate-50 dark:bg-slate-800 p-0 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSessionSort("tanggal")}
                          className="flex w-full items-center justify-between gap-1.5 py-3 px-4 sm:px-6 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Tanggal & Waktu</span>
                          {renderSortIcon(sessionSort, "tanggal")}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={sessionSort?.key === "kelas" ? (sessionSort.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 whitespace-nowrap text-left"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSessionSort("kelas")}
                          className="inline-flex w-full items-center justify-between gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Kelas</span>
                          {renderSortIcon(sessionSort, "kelas")}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={sessionSort?.key === "kehadiran" ? (sessionSort.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-right whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSessionSort("kehadiran")}
                          className="inline-flex w-full items-center justify-end gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Kehadiran</span>
                          {renderSortIcon(sessionSort, "kehadiran")}
                        </button>
                      </th>
                      <th
                        scope="col"
                        aria-sort={sessionSort?.key === "status" ? (sessionSort.dir === "asc" ? "ascending" : "descending") : undefined}
                        className="p-0 text-center whitespace-nowrap"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSessionSort("status")}
                          className="inline-flex w-full items-center justify-center gap-1.5 py-3 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white cursor-pointer select-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-600"
                        >
                          <span>Status Sesi</span>
                          {renderSortIcon(sessionSort, "status")}
                        </button>
                      </th>
                      <th scope="col" className="md:sticky md:right-0 md:z-20 px-4 py-3 text-right bg-slate-50 dark:bg-slate-800 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedSessions.map((sess, idx) => {
                      const isComplete = sess.terisiCount > 0 && sess.terisiCount >= sess.totalSiswa;
                      const isPartial = sess.terisiCount > 0 && sess.terisiCount < sess.totalSiswa;
                      const isCancelled = sess.statusSesi === "dibatalkan";

                      return (
                        <tr
                          key={sess.id}
                          className="group/row relative border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* 1. Nomor Urut (Sticky Left 0) */}
                          <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-500 dark:text-slate-400 tabular-nums text-xs transition-colors">
                            {(sessionPage - 1) * ITEMS_PER_PAGE + idx + 1}
                          </td>

                          {/* 2. Tanggal & Waktu (Sticky Left 12) */}
                          <td className="sticky left-12 z-10 min-w-[200px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 py-3 px-4 sm:px-6 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                            <div className="font-medium text-slate-950 dark:text-slate-50 text-sm">
                              {formatDate(sess.tanggal)}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
                              {sess.jamMulai.slice(0, 5)} - {sess.jamSelesai.slice(0, 5)} WIB
                            </div>
                          </td>

                          {/* 3. Kelas */}
                          <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                            {sess.kelasNama}
                          </td>

                          {/* 4. Kehadiran */}
                          <td className="px-4 py-3 text-right whitespace-nowrap tabular-nums">
                            {isCancelled ? (
                              <span className="text-slate-400 dark:text-slate-500">—</span>
                            ) : sess.terisiCount > 0 ? (
                              <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                                {sess.hadirCount}/{sess.totalSiswa}{" "}
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">hadir</span>
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 font-medium text-xs sm:text-sm">
                                Belum diisi
                              </span>
                            )}
                          </td>

                          {/* 5. Status Sesi */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            <span className="inline-flex items-center gap-2 text-xs font-medium">
                              <span
                                className={`size-1.5 rounded-full ${
                                  isCancelled
                                    ? "bg-rose-500"
                                    : isComplete
                                      ? "bg-emerald-500"
                                      : isPartial
                                        ? "bg-blue-500"
                                        : "bg-slate-400"
                                }`}
                              />
                              <span className="text-slate-700 dark:text-slate-300">
                                {isCancelled
                                  ? "Dibatalkan"
                                  : isComplete
                                    ? `Lengkap (${sess.terisiCount}/${sess.totalSiswa})`
                                    : isPartial
                                      ? `Sebagian (${sess.terisiCount}/${sess.totalSiswa})`
                                      : "Belum Presensi"}
                              </span>
                            </span>
                          </td>

                          {/* 6. Aksi (Sticky Right on Desktop) */}
                          <td className="md:sticky md:right-0 md:z-10 px-4 py-3 text-right bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 md:border-l md:border-slate-200/80 md:dark:border-slate-800/80 md:shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
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
              <TablePagination
                currentPage={sessionPage}
                totalPages={totalSessionPages}
                totalItems={filteredSessions.length}
                itemsPerPage={ITEMS_PER_PAGE}
                itemLabel="sesi"
                onPageChange={setSessionPage}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
