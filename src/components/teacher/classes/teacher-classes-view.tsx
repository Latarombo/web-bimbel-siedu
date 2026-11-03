"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import {
  Search,
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

const JENJANG_THEMES: Record<string, { plate: string; badge: string }> = {
  TK: {
    plate: "bg-pink-50/70 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900/40",
    badge: "bg-pink-100/80 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300 border-pink-200/80 dark:border-pink-800",
  },
  SD: {
    plate: "bg-blue-50/70 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40",
    badge: "bg-blue-100/80 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800",
  },
  SMP: {
    plate: "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40",
    badge: "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800",
  },
  SMA: {
    plate: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40",
    badge: "bg-amber-100/80 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800",
  },
};

const DEFAULT_THEME = {
  plate: "bg-slate-50/80 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800",
  badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
};

export function TeacherClassesView({
  classes,
  todayStr,
  todayDayLabel,
  stats,
}: TeacherClassesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [jenjangFilter, setJenjangFilter] = useState<string>("all");

  const filteredClasses = useMemo(() => {
    return classes.filter((c) => {
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
  }, [classes, jenjangFilter, searchQuery]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      {/* 1. Header (Clean, zero gradients) */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          Kelas Diampu
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          Daftar seluruh rombongan belajar dan jadwal pertemuan tatap muka semester ini.
        </p>
      </div>

      {/* 2. Top 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        {/* Metric 1: Kelas Aktif */}
        <div className="relative overflow-hidden rounded-lg border border-blue-200/70 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/80 via-blue-50/20 to-white dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-blue-600 dark:text-blue-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kelas Berjalan
                </p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-100/80 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                  Aktif
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {stats.activeClasses}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              Rombongan belajar aktif diampu
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

        {/* Metric 2: Total Siswa */}
        <div className="relative overflow-hidden rounded-lg border border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 via-emerald-50/20 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-emerald-600 dark:text-emerald-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Total Siswa Aktif
                </p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                  Terdaftar
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {stats.totalStudents}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              Tersebar di seluruh rombel yang Anda bimbing
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

        {/* Metric 3: Jadwal Hari Ini */}
        <div className="relative overflow-hidden rounded-lg border border-indigo-200/70 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/80 via-indigo-50/20 to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-indigo-600 dark:text-indigo-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Jadwal Mengajar Hari Ini
                </p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${stats.todaySessionsCount > 0 ? "bg-indigo-100/90 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800" : "bg-slate-100/90 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                  {stats.todaySessionsCount > 0 ? todayDayLabel : "Jadwal"}
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {stats.todaySessionsCount}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              {stats.todaySessionsCount > 0 ? "Memerlukan presensi tatap muka" : "Tidak ada jadwal kelas hari ini"}
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

      {/* 3. Toolbar (Search & Filters) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-slate-50 tracking-tight">
              Daftar Rombongan Belajar
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Kelola aktivitas kelas, presensi tatap muka, dan penilaian siswa.
            </p>
          </div>

          {/* Search & Jenjang Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari mata pelajaran, ruangan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 sm:w-64 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            {/* Jenjang Dropdown */}
            <select
              value={jenjangFilter}
              onChange={(e) => setJenjangFilter(e.target.value)}
              className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-3 pr-8 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 focus:border-blue-600 focus:outline-hidden cursor-pointer"
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
          <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center shadow-2xs space-y-3">
            <div className="mx-auto grid size-12 place-items-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              <AlertCircle className="size-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-950 dark:text-slate-50">
                Tidak ada kelas yang ditemukan
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Coba sesuaikan kata kunci pencarian atau ganti filter jenjang.
              </p>
            </div>
            {(searchQuery || jenjangFilter !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setJenjangFilter("all");
                }}
                className="inline-flex items-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
            {filteredClasses.map((c) => {
              const pct = Math.min(100, Math.round((c.kuotaTerisi / Math.max(c.kuotaMaksimum, 1)) * 100));
              const theme = JENJANG_THEMES[c.jenjang] || DEFAULT_THEME;
              const todaySchedule = c.schedules.find((s) => s.isToday);

              return (
                <div
                  key={c.id}
                  className="relative overflow-hidden rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  {/* 1. Thematic Header Plate */}
                  <div className={`p-4 sm:p-5 border-b ${theme.plate}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold border ${theme.badge}`}>
                        {c.jenjang} {c.tingkat ? `· ${c.tingkat}` : ""}
                      </span>
                      {c.status === "aktif" ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 shrink-0">
                          <span className="size-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mr-1.5" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100/80 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 shrink-0">
                          <span className="size-1.5 rounded-full bg-amber-600 dark:bg-amber-400 mr-1.5" />
                          Dibatalkan
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white tracking-tight line-clamp-1">
                        {c.mapelNama}
                      </h2>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-600 dark:text-slate-400">
                        {c.ruangan && <span>Ruang {c.ruangan}</span>}
                        {c.ruangan && c.periodeNama && <span>·</span>}
                        {c.periodeNama && <span>{c.periodeNama}</span>}
                      </div>
                    </div>
                  </div>

                  {/* 2. Middle Body: Clean Unboxed Metrics & Context */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                    {/* Grid 2 Kolom Ringkasan Data */}
                    <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                      {/* Kolom 1: Kuota & Keterisian */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          Kapasitas Siswa
                        </p>
                        <p className="mt-1 text-base sm:text-lg font-bold text-slate-950 dark:text-white tabular-nums tracking-tight">
                          {c.kuotaTerisi} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ {c.kuotaMaksimum}</span>
                        </p>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-amber-500" : "bg-blue-600"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Kolom 2: Status Sesi Hari Ini / Jadwal */}
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {c.hasSessionToday ? "Sesi Hari Ini" : "Jadwal Pertemuan"}
                        </p>
                        {c.hasSessionToday && todaySchedule ? (
                          <div>
                            <p className="mt-1 text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight">
                              {todaySchedule.jamMulai.slice(0, 5)} - {todaySchedule.jamSelesai.slice(0, 5)} <span className="text-xs font-normal">WIB</span>
                            </p>
                            <span className="inline-flex items-center text-[11px] font-bold text-blue-700 dark:text-blue-300 mt-1">
                              Perlu Presensi
                            </span>
                          </div>
                        ) : (
                          <div>
                            <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                              {c.schedules.length > 0 ? c.schedules.map((s) => s.hari).join(", ") : "Belum diatur"}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              {c.schedules.length > 0 ? `${c.schedules.length} sesi per minggu` : "Jadwal tatap muka"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 3. Bottom: Smart Contextual Action Area */}
                    <div className="space-y-2.5 pt-1">
                      {c.hasSessionToday && c.status === "aktif" ? (
                        /* Skenario 1: Ada sesi hari ini -> Primary CTA adalah Catat Presensi */
                        <Link
                          href={`/teacher/classes/${c.id}/sessions/${todayStr}/attendance`}
                          className="flex w-full items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-colors"
                        >
                          <span>Catat Presensi Hari Ini</span>
                        </Link>
                      ) : (
                        /* Skenario 2: Tidak ada sesi hari ini -> Primary CTA adalah Buka Detail & Roster */
                        <Link
                          href={`/teacher/classes/${c.id}`}
                          className="flex w-full items-center justify-center rounded-lg bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 px-4 py-2.5 text-xs font-bold text-white dark:text-slate-900 shadow-xs transition-colors"
                        >
                          <span>Buka Roster Kelas</span>
                        </Link>
                      )}

                      {/* Secondary Quick Links */}
                      <div className="flex items-center justify-between text-xs pt-1 px-1">
                        <Link
                          href={`/teacher/classes/${c.id}`}
                          className="font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
                        >
                          Roster Siswa ({c.kuotaTerisi})
                        </Link>
                        <span className="text-slate-300 dark:text-slate-700">·</span>
                        <Link
                          href={`/teacher/grades?tab=murid&kelas=${c.id}`}
                          className="font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
                        >
                          Nilai Siswa
                        </Link>
                      </div>
                    </div>
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
