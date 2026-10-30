"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import {
  Search,
  Clock,
  AlertCircle,
} from "lucide-react";

export interface ScheduleItem {
  id: number;
  hari: string;
  jamMulai: string;
  jamSelesai: string;
  isToday?: boolean;
}

export interface ClassCardItem {
  id: number;
  mapelNama: string;
  jenjang: string;
  tingkat?: string | null;
  ruangan?: string | null;
  periodeNama?: string | null;
  kuotaMaksimum: number;
  kuotaMinimum: number;
  kuotaTerisi: number;
  status: "aktif" | "dibatalkan" | string;
  schedules: ScheduleItem[];
  hasSessionToday: boolean;
}

export interface TeacherClassesViewProps {
  classes: ClassCardItem[];
  todayStr: string;
  todayDayLabel: string;
  locale: string;
  stats: {
    totalClasses: number;
    activeClasses: number;
    totalStudents: number;
    todaySessionsCount: number;
  };
}

const JENJANG_BADGES: Record<string, string> = {
  TK: "bg-pink-50 text-pink-700 border-pink-200",
  SD: "bg-blue-50 text-blue-700 border-blue-200",
  SMP: "bg-emerald-50 text-emerald-700 border-emerald-200",
  SMA: "bg-amber-50 text-amber-800 border-amber-200",
};

export function TeacherClassesView({
  classes,
  todayStr,
  todayDayLabel,
  stats,
}: TeacherClassesViewProps) {
  const [statusTab, setStatusTab] = useState<"semua" | "aktif" | "dibatalkan">("semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [jenjangFilter, setJenjangFilter] = useState<string>("all");

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
      // Status Tab filter
      if (statusTab === "aktif" && c.status !== "aktif") return false;
      if (statusTab === "dibatalkan" && c.status !== "dibatalkan") return false;

      // Jenjang filter
      if (jenjangFilter !== "all" && c.jenjang !== jenjangFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchMapel = c.mapelNama.toLowerCase().includes(q);
        const matchJenjang = c.jenjang.toLowerCase().includes(q);
        const matchTingkat = c.tingkat ? c.tingkat.toLowerCase().includes(q) : false;
        const matchRuangan = c.ruangan ? c.ruangan.toLowerCase().includes(q) : false;
        if (!matchMapel && !matchJenjang && !matchTingkat && !matchRuangan) return false;
      }

      return true;
    });
  }, [classes, statusTab, jenjangFilter, searchQuery]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      {/* 1. Header (Clean, zero gradients) */}
      <div className="pb-4 border-b border-slate-200">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950">
          Kelas Diampu
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-1">
          Daftar seluruh rombongan belajar dan jadwal pertemuan tatap muka semester ini.
        </p>
      </div>

      {/* 2. Top 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Kelas Aktif */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Kelas Berjalan
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">
              {stats.activeClasses}
            </span>
            <span className="text-xs text-slate-600">rombongan belajar</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Dari total {stats.totalClasses} kelas terdaftar
          </p>
        </div>

        {/* Metric 2: Total Siswa */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Total Siswa Aktif
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">
              {stats.totalStudents}
            </span>
            <span className="text-xs text-slate-600">murid</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Tersebar di seluruh rombel yang Anda bimbing
          </p>
        </div>

        {/* Metric 3: Jadwal Hari Ini */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Jadwal Mengajar Hari Ini
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-slate-950">
              {stats.todaySessionsCount}
            </span>
            <span className="text-xs text-slate-600">sesi ({todayDayLabel})</span>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            {stats.todaySessionsCount > 0 ? "Memerlukan presensi tatap muka" : "Tidak ada jadwal kelas hari ini"}
          </p>
        </div>
      </div>

      {/* 3. Propify Toolbar (Underline Tabs + Search & Filters) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200">
          {/* Status Tabs */}
          <nav className="flex space-x-6" aria-label="Tabs Status Kelas">
            <button
              type="button"
              onClick={() => setStatusTab("semua")}
              className={`flex items-center gap-2 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                statusTab === "semua"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-700 hover:text-slate-950 hover:border-slate-300"
              }`}
            >
              <span>Semua Kelas</span>
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                  statusTab === "semua"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {classes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab("aktif")}
              className={`flex items-center gap-2 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                statusTab === "aktif"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-700 hover:text-slate-950 hover:border-slate-300"
              }`}
            >
              <span>Aktif</span>
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                  statusTab === "aktif"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {stats.activeClasses}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab("dibatalkan")}
              className={`flex items-center gap-2 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                statusTab === "dibatalkan"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-700 hover:text-slate-950 hover:border-slate-300"
              }`}
            >
              <span>Dibatalkan</span>
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] font-bold ${
                  statusTab === "dibatalkan"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {classes.length - stats.activeClasses}
              </span>
            </button>
          </nav>

          {/* Search & Jenjang Filters */}
          <div className="flex flex-wrap items-center gap-2.5 pb-2 sm:pb-0">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari mata pelajaran, ruangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-64 rounded-md border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-500 focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            {/* Jenjang Dropdown */}
            <select
              value={jenjangFilter}
              onChange={(e) => setJenjangFilter(e.target.value)}
              className="rounded-md border border-slate-200 bg-white py-1.5 pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-800 focus:border-blue-600 focus:outline-hidden cursor-pointer"
            >
              <option value="all">Semua Jenjang</option>
              <option value="TK">TK</option>
              <option value="SD">SD</option>
              <option value="SMP">SMP</option>
              <option value="SMA">SMA</option>
            </select>
          </div>
        </div>

        {/* 4. Class Cards Grid */}
        {filteredClasses.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-2xs space-y-3">
            <div className="mx-auto grid size-12 place-items-center rounded-lg bg-slate-100 text-slate-500">
              <AlertCircle className="size-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950">
                Tidak ada kelas yang ditemukan
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                Coba sesuaikan kata kunci pencarian atau ganti filter status kelas.
              </p>
            </div>
            {(searchQuery || jenjangFilter !== "all" || statusTab !== "semua") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setJenjangFilter("all");
                  setStatusTab("semua");
                }}
                className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredClasses.map((c) => {
              const pct = Math.min(100, Math.round((c.kuotaTerisi / Math.max(c.kuotaMaksimum, 1)) * 100));
              const jenjangStyle = JENJANG_BADGES[c.jenjang] || "bg-slate-100 text-slate-700 border-slate-200";

              return (
                <div
                  key={c.id}
                  className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                >
                  {/* Top: Header Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-slate-950 tracking-tight line-clamp-1">
                          {c.mapelNama}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${jenjangStyle}`}>
                            {c.jenjang} {c.tingkat ? `· ${c.tingkat}` : ""}
                          </span>
                          {c.ruangan && (
                            <span className="text-xs text-slate-600">
                              Ruang: {c.ruangan}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status Tag */}
                      {c.status === "aktif" ? (
                        <span className="inline-flex items-center rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-800 shrink-0">
                          <span className="size-1.5 rounded-full bg-emerald-600 mr-1.5" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800 shrink-0">
                          <span className="size-1.5 rounded-full bg-amber-600 mr-1.5" />
                          Dibatalkan
                        </span>
                      )}
                    </div>

                    {c.periodeNama && (
                      <p className="text-xs text-slate-600">
                        Periode: <span className="font-medium text-slate-800">{c.periodeNama}</span>
                      </p>
                    )}
                  </div>

                  {/* Middle: Kapasitas Kuota */}
                  <div className="space-y-1.5 bg-slate-50/70 rounded-md border border-slate-100 p-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">Keterisian Kuota</span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-slate-950 tabular-nums">
                          {c.kuotaTerisi}
                        </span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-700 tabular-nums">{c.kuotaMaksimum} Siswa</span>
                        <span className="ml-1 text-[11px] font-semibold text-slate-600">({pct}%)</span>
                      </div>
                    </div>

                    <div
                      className="h-2 w-full overflow-hidden rounded bg-slate-200/80"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full rounded ${pct >= 90 ? "bg-amber-500" : "bg-blue-600"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Middle: Jadwal Pertemuan */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                      Jadwal Sesi Mingguan
                    </p>

                    {c.schedules.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Belum ada jadwal tatap muka</p>
                    ) : (
                      <div className="space-y-1.5">
                        {c.schedules.map((s) => (
                          <div
                            key={s.id}
                            className={`flex items-center justify-between rounded-md border px-3 py-2 text-xs transition-colors ${
                              s.isToday
                                ? "border-blue-200 bg-blue-50/60 text-blue-900"
                                : "border-slate-100 bg-slate-50/40 text-slate-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className={`size-3.5 ${s.isToday ? "text-blue-600" : "text-slate-500"}`} />
                              <span className="font-bold">{s.hari}</span>
                              <span className="text-slate-600">
                                {s.jamMulai.slice(0, 5)} - {s.jamSelesai.slice(0, 5)} WIB
                              </span>
                            </div>

                            {s.isToday && (
                              <span className="rounded bg-blue-600 text-white px-1.5 py-0.2 text-[10px] font-bold">
                                Hari Ini
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bottom: Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/teacher/classes/${c.id}`}
                        className="inline-flex items-center justify-center rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-colors"
                      >
                        <span>Buka Roster Siswa</span>
                      </Link>

                      <Link
                        href={`/teacher/grades?tab=murid&kelas=${c.id}`}
                        className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 hover:text-slate-950 transition-colors"
                      >
                        <span>Nilai Siswa</span>
                      </Link>
                    </div>

                    {c.hasSessionToday && c.status === "aktif" && (
                      <Link
                        href={`/teacher/classes/${c.id}/sessions/${todayStr}/attendance`}
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition-colors"
                      >
                        <span>Presensi Hari Ini</span>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
