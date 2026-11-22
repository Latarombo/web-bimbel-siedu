"use client";

import { useState, useMemo } from "react";
import { Link } from "@/i18n/navigation";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import {
  Search,
  AlertCircle,
  BookOpen,
  Calculator,
} from "lucide-react";

const JENJANG_OPTIONS = [
  { value: "all", label: "Semua Jenjang" },
  { value: "TK", label: "TK" },
  { value: "SD", label: "SD" },
  { value: "SMP", label: "SMP" },
  { value: "SMA", label: "SMA" },
] as const;

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

interface ThemeJenjang {
  bgLight: string;
  darkClass: string;
  aksenHex: string;
  aksenTextClass: string;
}

const JENJANG_THEMES: Record<string, ThemeJenjang> = {
  TK: {
    bgLight: "#fde7f0",
    darkClass: "dark:bg-pink-950/30 dark:border-pink-900/50",
    aksenHex: "#b82a63",
    aksenTextClass: "text-[#b82a63] dark:text-pink-300",
  },
  SD: {
    bgLight: "#e1ecfd",
    darkClass: "dark:bg-blue-950/30 dark:border-blue-900/50",
    aksenHex: "#1d4ed8",
    aksenTextClass: "text-[#1d4ed8] dark:text-blue-300",
  },
  SMP: {
    bgLight: "#ddf3e7",
    darkClass: "dark:bg-emerald-950/30 dark:border-emerald-900/50",
    aksenHex: "#0f7a48",
    aksenTextClass: "text-[#0f7a48] dark:text-emerald-300",
  },
  SMA: {
    bgLight: "#fdf0d4",
    darkClass: "dark:bg-amber-950/30 dark:border-amber-900/50",
    aksenHex: "#945700",
    aksenTextClass: "text-[#945700] dark:text-amber-300",
  },
};

const DEFAULT_THEME: ThemeJenjang = {
  bgLight: "#f1f5f9",
  darkClass: "dark:bg-slate-800/40 dark:border-slate-800",
  aksenHex: "#475569",
  aksenTextClass: "text-slate-700 dark:text-slate-300",
};

function formatJadwalRutin(schedules: ScheduleItem[]): string {
  if (!schedules || schedules.length === 0) return "Jadwal tatap muka belum diatur";

  const firstTime = `${schedules[0].jamMulai.slice(0, 5)} - ${schedules[0].jamSelesai.slice(0, 5)}`;
  const allSameTime = schedules.every(
    (s) => `${s.jamMulai.slice(0, 5)} - ${s.jamSelesai.slice(0, 5)}` === firstTime,
  );

  if (allSameTime) {
    const hariList = schedules.map((s) => s.hari).join(", ");
    return `${hariList} · ${firstTime} WIB`;
  }

  return schedules
    .map((s) => `${s.hari} (${s.jamMulai.slice(0, 5)} - ${s.jamSelesai.slice(0, 5)})`)
    .join(", ");
}

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Kelas Aktif */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kelas Berjalan
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
              {stats.activeClasses}
            </p>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 truncate">
            Rombongan belajar aktif diampu
          </p>
        </div>

        {/* Metric 2: Total Siswa */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Siswa Aktif
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
              {stats.totalStudents}
            </p>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 truncate">
            Tersebar di seluruh rombel yang Anda bimbing
          </p>
        </div>

        {/* Metric 3: Jadwal Hari Ini */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-2xs">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Jadwal Mengajar Hari Ini
            </p>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
              {stats.todaySessionsCount}
            </p>
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 truncate">
            {stats.todaySessionsCount > 0 ? "Memerlukan presensi tatap muka" : "Tidak ada jadwal kelas hari ini"}
          </p>
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
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <label htmlFor="search-classes" className="sr-only">
                Cari mata pelajaran atau ruangan
              </label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" aria-hidden="true" />
              <input
                id="search-classes"
                type="search"
                autoComplete="off"
                placeholder="Cari mata pelajaran, ruangan…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 sm:h-9 w-48 sm:w-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 pl-9 pr-3 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
              />
            </div>

            {/* Jenjang Dropdown */}
            <FilterDropdown
              value={jenjangFilter}
              onChange={setJenjangFilter}
              options={JENJANG_OPTIONS}
              ariaLabel="Filter jenjang kelas"
              size="sm"
            />
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
                className="inline-flex items-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((c) => {
              const pct = Math.min(100, Math.round((c.kuotaTerisi / Math.max(c.kuotaMaksimum, 1)) * 100));
              const theme = JENJANG_THEMES[c.jenjang] || DEFAULT_THEME;
              const todaySchedule = c.schedules.find((s) => s.isToday);
              const penuh = c.kuotaTerisi >= c.kuotaMaksimum;
              const hampirPenuh = !penuh && c.kuotaMaksimum > 0 && c.kuotaTerisi / c.kuotaMaksimum >= 0.85;

              return (
                <div
                  key={c.id}
                  className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow"
                >
                  {/* Blok Atas Berwarna Pastel Sesuai Jenjang */}
                  <div
                    className={`relative overflow-hidden p-5 border-b border-slate-200/60 dark:border-slate-800 ${theme.darkClass}`}
                    style={{ backgroundColor: theme.bgLight }}
                  >
                    <BookOpen
                      aria-hidden
                      className="pointer-events-none absolute -right-3 -top-3 size-24 opacity-25 dark:opacity-15 transition-transform duration-300 group-hover:scale-105"
                      style={{ color: theme.aksenHex }}
                      strokeWidth={1.75}
                    />
                    <Calculator
                      aria-hidden
                      className="pointer-events-none absolute bottom-1 right-12 size-14 opacity-20 dark:opacity-10 transition-transform duration-300 group-hover:scale-105"
                      style={{ color: theme.aksenHex }}
                      strokeWidth={1.75}
                    />

                    {/* Judul Mapel + Jenjang (Clean Typography, Tanpa Pill Badge) */}
                    <div className="relative">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg sm:text-[19px] font-extrabold leading-tight text-[#16213a] dark:text-white line-clamp-1">
                          <Link href={`/teacher/classes/${c.id}`} className="focus:outline-hidden hover:underline">
                            <span className="absolute inset-0 z-0" aria-hidden="true" />
                            {c.mapelNama}
                          </Link>
                        </h3>
                        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                          <span className="text-xs font-bold text-[#16213a] dark:text-slate-200">
                            Jenjang {c.jenjang}
                          </span>
                          {c.status !== "aktif" ? (
                            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                              Dibatalkan
                            </span>
                          ) : null}
                        </div>
                      </div>
                      {c.tingkat ? (
                        <p className={`mt-1 text-xs font-semibold ${theme.aksenTextClass}`}>{c.tingkat}</p>
                      ) : null}
                    </div>

                    <p className="relative mt-2 text-xs sm:text-[13px] leading-snug text-[#5b6472] dark:text-slate-300">
                      {c.ruangan ? `Ruang ${c.ruangan}` : "Tanpa Ruangan"} {c.periodeNama ? `· ${c.periodeNama}` : ""}
                    </p>
                  </div>

                  {/* Bagian Badan Kartu: Informasi Operasional Rombel (Clean Key-Value, Tanpa Centang) */}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="space-y-3 pb-5">
                      {/* 1. Jadwal Rutin */}
                      <div className="flex items-start justify-between gap-2 text-xs sm:text-sm">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">Jadwal Rutin</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-right tabular-nums">
                          {formatJadwalRutin(c.schedules)}
                        </span>
                      </div>

                      {/* 2. Sesi Hari Ini */}
                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">Sesi Hari Ini</span>
                        {c.hasSessionToday && todaySchedule ? (
                          <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums text-right">
                            {todaySchedule.jamMulai.slice(0, 5)} - {todaySchedule.jamSelesai.slice(0, 5)} WIB
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500 dark:text-slate-400 text-right">
                            Tidak ada jadwal hari ini
                          </span>
                        )}
                      </div>

                      {/* 3. Kapasitas */}
                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">Kapasitas</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums text-right">
                          {c.kuotaTerisi} / {c.kuotaMaksimum} Siswa {penuh ? "(Penuh)" : hampirPenuh ? "(Hampir Penuh)" : ""}
                        </span>
                      </div>

                      {/* 4. Ruangan */}
                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">Ruang Kelas</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-right">
                          {c.ruangan ? `Ruang ${c.ruangan}` : "Belum ditentukan"}
                        </span>
                      </div>

                      {/* 5. Periode */}
                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0">Periode</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[190px]">
                          {c.periodeNama ?? "Reguler"}
                        </span>
                      </div>
                    </div>

                    {/* Footer Kartu: Pemisah Garis Putus-putus & Aksi */}
                    <div className="mt-auto border-t border-dashed border-slate-200 dark:border-slate-800 pt-4">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500 dark:text-slate-400">
                          Kapasitas Rombel
                        </span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {c.kuotaTerisi} / {c.kuotaMaksimum} Siswa ({pct}%)
                        </span>
                      </div>

                      {/* Progress Bar Keterisian */}
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-amber-500" : "bg-blue-600"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      {/* Tombol CTA Dinamis */}
                      {c.hasSessionToday && c.status === "aktif" ? (
                        <Link
                          href={`/teacher/classes/${c.id}/sessions/${todayStr}/attendance`}
                          className="relative z-10 mt-4 flex min-h-12 w-full items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 py-3 text-sm font-bold text-white shadow-xs transition-colors"
                        >
                          <span>Catat Presensi Hari Ini</span>
                        </Link>
                      ) : (
                        <Link
                          href={`/teacher/classes/${c.id}`}
                          className="relative z-10 mt-4 flex min-h-12 w-full items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 py-3 text-sm font-bold text-white dark:text-slate-900 shadow-xs transition-colors"
                        >
                          <span>Buka Detail Kelas</span>
                        </Link>
                      )}

                      {/* Tautan Cepat Sekunder */}
                      <div className="relative z-10 mt-3 flex items-center justify-between text-xs px-1">
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
