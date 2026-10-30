"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
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
  firstTodaySession?: {
    jadwalItemId: number;
    jamMulai: string;
    jamSelesai: string;
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
  students,
  schedules,
  firstTodaySession,
  todayStr,
  stats,
}: ClassDetailViewProps) {
  // Tabs: "roster" | "schedule" | "summary"
  const [activeTab, setActiveTab] = useState<"roster" | "schedule" | "summary">("roster");

  // Filter & Search states for Roster
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "terdaftar" | "tertunggak">("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [students, searchQuery, statusFilter]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredStudents, currentPage]);

  const capacityPct = kuotaMaksimum > 0 ? Math.min(100, Math.round((students.length / kuotaMaksimum) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* 1. Breadcrumbs Header */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-600">
        <Link href="/teacher/dashboard" className="hover:text-slate-950 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/teacher/classes" className="hover:text-slate-950 transition-colors">
          Kelas Diampu
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900 truncate">
          {className} {jenjang} {tingkat ? `· ${tingkat}` : ""}
        </span>
      </nav>

      {/* 2. Page Title Row + Action Button (Propify style) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
              {className} · {jenjang} {tingkat ? `(${tingkat})` : ""}
            </h1>
            <span className="inline-flex items-center rounded bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1">
              {students.length} Siswa
            </span>
            <span className="inline-flex items-center rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold px-2 py-0.5">
              <span className="size-1.5 rounded-full bg-emerald-600 mr-1.5" />
              {classStatus === "aktif" ? "Kelas Aktif" : classStatus}
            </span>
          </div>
          {periodeNama && (
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Periode: {periodeNama} · Kapasitas: {students.length} dari {kuotaMaksimum} siswa ({capacityPct}%)
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {firstTodaySession ? (
            <Link
              href={`/teacher/classes/${classId}/sessions/${todayStr}/attendance?sesi=${firstTodaySession.jadwalItemId}`}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors min-h-[44px] cursor-pointer"
            >
              <span>Catat Presensi Hari Ini</span>
            </Link>
          ) : (
            <Link
              href="/teacher/grades/new"
              className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors min-h-[44px] cursor-pointer"
            >
              <span>+ Buat Penilaian</span>
            </Link>
          )}

          <a
            href={`/api/export/class/${classId}?type=summary`}
            download
            className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 transition-colors min-h-[44px] cursor-pointer"
            title="Unduh rekap ringkasan"
          >
            <span>Ekspor</span>
          </a>
        </div>
      </div>

      {/* 3. Horizontal Underline Tabs Bar */}
      <div className="border-b border-slate-200 bg-white px-2 sm:px-4">
        <nav className="flex space-x-2 sm:space-x-8" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "roster"}
            onClick={() => setActiveTab("roster")}
            className={`flex items-center gap-2 py-3.5 px-2 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors min-h-[44px] cursor-pointer ${
              activeTab === "roster"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-700 hover:text-slate-950 hover:border-slate-300"
            }`}
          >
            <span>Roster Siswa</span>
            <span className="ml-1 inline-flex items-center rounded bg-slate-100 text-slate-800 text-xs font-semibold px-1.5 py-0.5">
              {students.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "schedule"}
            onClick={() => setActiveTab("schedule")}
            className={`flex items-center gap-2 py-3.5 px-2 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors min-h-[44px] cursor-pointer ${
              activeTab === "schedule"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-700 hover:text-slate-950 hover:border-slate-300"
            }`}
          >
            <span>Jadwal & Sesi</span>
            <span className="ml-1 inline-flex items-center rounded bg-slate-100 text-slate-800 text-xs font-semibold px-1.5 py-0.5">
              {schedules.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "summary"}
            onClick={() => setActiveTab("summary")}
            className={`flex items-center gap-2 py-3.5 px-2 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors min-h-[44px] cursor-pointer ${
              activeTab === "summary"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-700 hover:text-slate-950 hover:border-slate-300"
            }`}
          >
            <span>Ringkasan & Aksi Kelas</span>
          </button>
        </nav>
      </div>

      {/* 4. Tab Panels */}
      {/* TAB 1: ROSTER SISWA (Enterprise Data Table) */}
      {activeTab === "roster" && (
        <div className="space-y-4">
          {/* Toolbar: Counter Left, Search & Filter Right */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-950">
                Total Siswa ({filteredStudents.length})
              </h2>
              <p className="text-xs text-slate-600">
                Daftar murid terdaftar dalam rombongan belajar ini.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama siswa..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-48 sm:w-64 rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as "all" | "terdaftar" | "tertunggak");
                    setCurrentPage(1);
                  }}
                  className="rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-800 focus:border-blue-600 focus:outline-hidden cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="terdaftar">Terdaftar</option>
                  <option value="tertunggak">Tertunggak</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-700">
                    <th scope="col" className="py-3.5 px-4 sm:px-6">Siswa</th>
                    <th scope="col" className="py-3.5 px-4">Status</th>
                    <th scope="col" className="py-3.5 px-4 text-center">Kehadiran</th>
                    <th scope="col" className="py-3.5 px-4 text-center">Nilai Rata-rata</th>
                    <th scope="col" className="py-3.5 px-4 text-center">Entri Tugas</th>
                    <th scope="col" className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-600 text-sm">
                        Tidak ada siswa yang sesuai dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s) => {
                      const initial = (s.nama?.[0] || "S").toUpperCase();
                      const attendancePct = s.tercatat > 0 ? Math.round((s.hadir / s.tercatat) * 100) : 0;

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          {/* 1. Siswa (Avatar + Full Name + NISN/ID) */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="grid size-9 shrink-0 place-items-center rounded-md bg-blue-100 text-blue-800 text-xs font-bold">
                                {initial}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-950 line-clamp-1">
                                  {s.nama}
                                </p>
                                <p className="text-xs text-slate-600 mt-0.5">
                                  ID: {s.id} · Anak #{s.anakId}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* 2. Status Registrasi */}
                          <td className="py-3.5 px-4">
                            {s.status === "terdaftar" ? (
                              <span className="inline-flex items-center rounded bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                <span className="size-1.5 rounded-full bg-emerald-600 mr-1.5" />
                                Terdaftar
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded bg-amber-50 border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-800">
                                <span className="size-1.5 rounded-full bg-amber-600 mr-1.5" />
                                Tertunggak
                              </span>
                            )}
                          </td>

                          {/* 3. Kehadiran */}
                          <td className="py-3.5 px-4 text-center">
                            {s.tercatat > 0 ? (
                              <div>
                                <span className="font-bold text-slate-950 tabular-nums text-xs sm:text-sm">
                                  {s.hadir}/{s.tercatat} Sesi
                                </span>
                                <span className="block text-[11px] text-slate-600">
                                  ({attendancePct}%)
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">Belum ada sesi</span>
                            )}
                          </td>

                          {/* 4. Nilai Rata-rata */}
                          <td className="py-3.5 px-4 text-center">
                            {s.rata != null ? (
                              <span className="font-extrabold text-slate-950 tabular-nums text-sm">
                                {s.rata}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500">Belum dinilai</span>
                            )}
                          </td>

                          {/* 5. Entri Tugas */}
                          <td className="py-3.5 px-4 text-center tabular-nums text-xs font-medium text-slate-800">
                            {s.nNilai} tugas
                          </td>

                          {/* 6. Aksi (3-Titik Menu ala Referensi) */}
                          <td className="py-3.5 px-4 sm:px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger className="grid size-8 place-items-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-950 transition-colors ml-auto cursor-pointer">
                                <MoreVertical className="size-4" />
                                <span className="sr-only">Buka menu aksi</span>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 bg-white border border-slate-200 shadow-md rounded-md p-1">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/teacher/grades/${s.id}`}
                                    className="flex w-full items-center px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded cursor-pointer"
                                  >
                                    <span>Input / Lihat Nilai</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/teacher/classes/${classId}/report/${s.id}`}
                                    className="flex w-full items-center px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded cursor-pointer"
                                  >
                                    <span>Lihat Rapor Siswa</span>
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/teacher/classes/${classId}/certificate/${s.id}`}
                                    className="flex w-full items-center px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 rounded cursor-pointer"
                                  >
                                    <span>Unduh Sertifikat</span>
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar (Centered, Propify style) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-white">
                <p className="text-xs text-slate-600">
                  Menampilkan {(currentPage - 1) * ITEMS_PER_PAGE + 1} sampai{" "}
                  {Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)} dari{" "}
                  {filteredStudents.length} siswa
                </p>

                <div className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent rounded cursor-pointer"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>Sebelumnya</span>
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setCurrentPage(pageNum)}
                        className={`size-7 text-xs font-bold rounded cursor-pointer ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-slate-800 hover:bg-slate-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent rounded cursor-pointer"
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
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-950">
              Jadwal Sesi Mingguan
            </h2>
            <p className="text-xs text-slate-600">
              Waktu tatap muka rutin rombongan belajar ini dan tautan langsung pencatatan presensi.
            </p>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xs">
            <div className="divide-y divide-slate-100">
              {schedules.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-600">
                  Belum ada jadwal yang ditentukan oleh admin untuk kelas ini.
                </div>
              ) : (
                schedules.map((j) => (
                  <div
                    key={j.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-bold text-slate-950">
                        Hari {j.hari}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {j.jamMulai.slice(0, 5)} - {j.jamSelesai.slice(0, 5)} WIB
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {j.nextSessionDate ? (
                        <div className="text-right">
                          <span className="text-xs font-semibold text-slate-800 block">
                            Sesi Berikutnya: {j.nextSessionDate}
                          </span>
                          {j.nextSessionTime && (
                            <span className="text-[11px] text-slate-600 block">
                              {j.nextSessionTime}
                            </span>
                          )}
                        </div>
                      ) : null}

                      {j.nextSessionDate ? (
                        <Link
                          href={`/teacher/classes/${classId}/sessions/${j.nextSessionDate}/attendance?sesi=${j.id}`}
                          className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition-colors min-h-[38px] cursor-pointer"
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

      {/* TAB 3: RINGKASAN & AKSI KELAS */}
      {activeTab === "summary" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Card 1: Statistik Mengajar */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
              Statistik Kelas
            </h3>
            <dl className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-slate-600">Siswa Aktif</dt>
                <dd className="font-bold text-slate-950 tabular-nums">{stats.activeStudents} siswa</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-slate-600">Entri Penilaian Guru</dt>
                <dd className="font-bold text-slate-950 tabular-nums">{stats.totalGradeEntries} entri</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-slate-600">Presensi Tercatat</dt>
                <dd className="font-bold text-slate-950 tabular-nums">{stats.totalRecordedAttendance} data</dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-slate-600">Kapasitas Kuota</dt>
                <dd className="font-bold text-slate-950 tabular-nums">
                  {students.length}/{kuotaMaksimum} ({capacityPct}%)
                </dd>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-slate-600">Kuota Minimum Kelas</dt>
                <dd className="font-semibold text-slate-800 tabular-nums">{kuotaMinimum} siswa</dd>
              </div>
            </dl>

            <div className="pt-2">
              <div className="h-2 w-full overflow-hidden rounded-xs bg-slate-100">
                <div
                  className={`h-full rounded-xs ${capacityPct >= 90 ? "bg-amber-500" : "bg-blue-600"}`}
                  style={{ width: `${capacityPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Unduhan & Rekapitulasi */}
          <div className="rounded-lg border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">
              Aksi & Rekap Data
            </h3>
            <div className="space-y-2.5">
              <Link
                href="/teacher/status"
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-slate-950">Dokumentasi Belajar</p>
                  <p className="text-[11px] text-slate-600">Bagikan foto & jurnal kegiatan ke orang tua</p>
                </div>
                <ChevronRight className="size-4 text-slate-400" />
              </Link>

              <a
                href={`/api/export/class/${classId}?type=attendance`}
                download
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-slate-950">Rekap Presensi (CSV)</p>
                  <p className="text-[11px] text-slate-600">Format spreadsheet kehadiran siswa</p>
                </div>
                <span className="text-xs font-semibold text-blue-600">Unduh</span>
              </a>

              <a
                href={`/api/export/class/${classId}?type=grades`}
                download
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3 hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                <div>
                  <p className="text-xs font-bold text-slate-950">Rekap Nilai (CSV)</p>
                  <p className="text-[11px] text-slate-600">Format spreadsheet nilai & progres</p>
                </div>
                <span className="text-xs font-semibold text-blue-600">Unduh</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
