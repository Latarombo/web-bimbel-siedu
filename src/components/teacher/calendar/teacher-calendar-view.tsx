'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion, LayoutGroup, useReducedMotion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Link } from '@/i18n/navigation';

export interface CalendarTugasItem {
  id: number;
  nama: string;
  nilaiMaksimum: number;
  draf: boolean;
}

export interface TeacherCalendarSessionItem {
  kelasId: number;
  sesiPertemuanId?: number;
  jadwalItemId: number;
  tanggalPertemuan: string; // "YYYY-MM-DD"
  jamMulai: string; // "08:00"
  jamSelesai: string; // "09:30"
  kelasNama: string;
  kelasDisplayName: string;
  jenjang: string;
  tingkat?: string | null;
  statusSesi: string; // "terjadwal" | "selesai" | "dibatalkan"
  pesertaCount: number;
  presensiCount: number;
  isPast: boolean;
  isToday: boolean;
  catatanMateri?: string | null;
  catatanPr?: string | null;
  tugasList: CalendarTugasItem[];
}

export interface ClassOption {
  id: number;
  name: string;
  displayName: string;
  jenjang: string;
  tingkat?: string | null;
}

export type ViewMode = 'daily' | 'weekly' | 'monthly' | 'agenda';

export interface TeacherCalendarViewProps {
  sessions: TeacherCalendarSessionItem[];
  classes: ClassOption[];
  todayStr: string; // "YYYY-MM-DD"
  locale: string;
  hideClassFilter?: boolean;
  allowedViews?: ViewMode[];
  defaultView?: ViewMode;
}

type TimeScope = 'day' | 'week' | 'month' | 'all';

// Helper: Convert YYYY-MM-DD to local Date object
function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Helper: Format Date to YYYY-MM-DD
function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Helper: Get Sunday of the week for a given date (Google Classroom week starts on Sunday)
function getSunday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday
  const diff = date.getDate() - day;
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

// 3-letter Day abbreviations matching Google Classroom screenshot
const DAY_SHORT_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'] as const;

// Day name mappings
const DAY_KEYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

// Google Classroom solid card colors per jenjang (high-contrast white text)
const CLASSROOM_SOLID_COLORS: Record<string, string> = {
  TK: 'bg-pink-600 hover:bg-pink-700 active:bg-pink-800',
  SD: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
  SMP: 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900',
  SMA: 'bg-[#964000] hover:bg-[#853800] active:bg-[#743000]', // Google Classroom Terracotta
};
const DEFAULT_SOLID_COLOR = 'bg-[#964000] hover:bg-[#853800] active:bg-[#743000]';

// Classroom signature color palettes per jenjang/class theme
const CLASSROOM_THEMES: Record<string, {
  cardBorder: string;
  cardBg: string;
  dot: string;
  monthlyChip: string;
}> = {
  TK: {
    cardBorder: 'border-l-pink-500 dark:border-l-pink-400',
    cardBg: 'bg-pink-50/50 hover:bg-pink-50/80 dark:bg-pink-950/20 dark:hover:bg-pink-950/40',
    dot: 'bg-pink-500',
    monthlyChip: 'bg-pink-100/90 text-pink-900 border-pink-200 dark:bg-pink-950/60 dark:text-pink-200 dark:border-pink-900/50',
  },
  SD: {
    cardBorder: 'border-l-blue-600 dark:border-l-blue-500',
    cardBg: 'bg-blue-50/50 hover:bg-blue-50/80 dark:bg-blue-950/20 dark:hover:bg-blue-950/40',
    dot: 'bg-blue-600',
    monthlyChip: 'bg-blue-100/90 text-blue-900 border-blue-200 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-900/50',
  },
  SMP: {
    cardBorder: 'border-l-emerald-600 dark:border-l-emerald-500',
    cardBg: 'bg-emerald-50/50 hover:bg-emerald-50/80 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40',
    dot: 'bg-emerald-600',
    monthlyChip: 'bg-emerald-100/90 text-emerald-900 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-900/50',
  },
  SMA: {
    cardBorder: 'border-l-amber-600 dark:border-l-amber-500',
    cardBg: 'bg-amber-50/50 hover:bg-amber-50/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/40',
    dot: 'bg-amber-600',
    monthlyChip: 'bg-amber-100/90 text-amber-950 border-amber-200 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-900/50',
  },
};

const DEFAULT_CLASSROOM_THEME = {
  cardBorder: 'border-l-slate-500 dark:border-l-slate-400',
  cardBg: 'bg-slate-50/60 hover:bg-slate-100/70 dark:bg-slate-800/40 dark:hover:bg-slate-800/60',
  dot: 'bg-slate-500',
  monthlyChip: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

export function TeacherCalendarView({
  sessions,
  classes,
  todayStr,
  locale,
  hideClassFilter = false,
  allowedViews = ['daily', 'weekly', 'monthly'],
  defaultView = 'weekly',
}: TeacherCalendarViewProps) {
  const t = useTranslations('teacher');
  const shouldReduceMotion = useReducedMotion();

  // View state: 'daily' | 'weekly' | 'monthly' | 'agenda'
  const [viewMode, setViewMode] = useState<ViewMode>(defaultView);

  // Time scope: 'day' | 'week' | 'month' | 'all'
  const [timeScope, setTimeScope] = useState<TimeScope>(
    defaultView === 'daily' ? 'day' : defaultView === 'monthly' ? 'month' : defaultView === 'agenda' ? 'all' : 'week'
  );

  // Anchor date for navigation (defaults to today)
  const [anchorDateStr, setAnchorDateStr] = useState<string>(todayStr);

  // Classroom Class Filter (single select: all or specific class)
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Mobile selected day in weekly view
  const [mobileSelectedDate, setMobileSelectedDate] = useState<string>(todayStr);

  const anchorDate = useMemo(() => parseDate(anchorDateStr), [anchorDateStr]);

  // Current week days (Sunday - Saturday, Google Classroom style)
  const weekDays = useMemo(() => {
    const sunday = getSunday(anchorDate);
    const days: Array<{
      dateStr: string;
      dayNum: number;
      dayName: string;
      dayNameShort: string;
      fullDateFormatted: string;
      isToday: boolean;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i);
      const dateStr = formatDate(d);
      const dayIndex = d.getDay();
      const dayKey = DAY_KEYS[dayIndex];
      const dayName = t(`day_${dayKey}`);
      const dayNameShort = DAY_SHORT_NAMES[dayIndex];
      const fullDateFormatted = d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', {
        day: 'numeric',
        month: 'short',
      });

      days.push({
        dateStr,
        dayNum: d.getDate(),
        dayName,
        dayNameShort,
        fullDateFormatted,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [anchorDate, todayStr, locale, t]);

  // Month grid days (35 or 42 cells) for monthly view (Sunday - Saturday)
  const monthGridDays = useMemo(() => {
    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth(); // 0-indexed
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const adjustedFirstDay = firstDayIndex;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    // Preceding month padding
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = formatDate(prevDate);
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const curDate = new Date(year, month, d);
      const dateStr = formatDate(curDate);
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Trailing padding to fill 35 or 42 cells
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = formatDate(nextDate);
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return days;
  }, [anchorDate, todayStr]);

  // Dynamic range label for Google Classroom header
  const rangeLabel = useMemo(() => {
    if (viewMode === 'daily') {
      return anchorDate.toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    if (viewMode === 'monthly' || timeScope === 'month') {
      return anchorDate.toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', {
        month: 'long',
        year: 'numeric',
      });
    }

    if (viewMode === 'weekly' || timeScope === 'week') {
      const sunday = getSunday(anchorDate);
      const saturday = new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + 6);
      const formatOpt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      const startStr = sunday.toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', formatOpt);
      const endStr = saturday.toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', {
        ...formatOpt,
        year: 'numeric',
      });
      return `${startStr} – ${endStr}`;
    }

    return t('allPeriods') || 'Semua Jadwal';
  }, [viewMode, timeScope, anchorDate, locale, t]);

  // Stepper handlers
  const handlePrev = () => {
    if (viewMode === 'daily') {
      const d = parseDate(anchorDateStr);
      d.setDate(d.getDate() - 1);
      const newDateStr = formatDate(d);
      setAnchorDateStr(newDateStr);
      setMobileSelectedDate(newDateStr);
    } else if (viewMode === 'monthly' || timeScope === 'month') {
      const d = parseDate(anchorDateStr);
      d.setMonth(d.getMonth() - 1);
      const newDateStr = formatDate(d);
      setAnchorDateStr(newDateStr);
      setMobileSelectedDate(newDateStr);
    } else if (viewMode === 'weekly' || timeScope === 'week') {
      const d = parseDate(anchorDateStr);
      d.setDate(d.getDate() - 7);
      const newDateStr = formatDate(d);
      setAnchorDateStr(newDateStr);
      setMobileSelectedDate(newDateStr);
    }
  };

  const handleNext = () => {
    if (viewMode === 'daily') {
      const d = parseDate(anchorDateStr);
      d.setDate(d.getDate() + 1);
      const newDateStr = formatDate(d);
      setAnchorDateStr(newDateStr);
      setMobileSelectedDate(newDateStr);
    } else if (viewMode === 'monthly' || timeScope === 'month') {
      const d = parseDate(anchorDateStr);
      d.setMonth(d.getMonth() + 1);
      const newDateStr = formatDate(d);
      setAnchorDateStr(newDateStr);
      setMobileSelectedDate(newDateStr);
    } else if (viewMode === 'weekly' || timeScope === 'week') {
      const d = parseDate(anchorDateStr);
      d.setDate(d.getDate() + 7);
      const newDateStr = formatDate(d);
      setAnchorDateStr(newDateStr);
      setMobileSelectedDate(newDateStr);
    }
  };

  const handleToday = () => {
    setAnchorDateStr(todayStr);
    setMobileSelectedDate(todayStr);
  };

  // Base filter predicate (Class only, pure Classroom style)
  const matchesClass = (s: TeacherCalendarSessionItem) => {
    if (selectedClassId !== null && s.kelasId !== selectedClassId) {
      return false;
    }
    return true;
  };

  // Filter sessions based on timeScope and class
  const scopedSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (!matchesClass(s)) return false;

      if (viewMode === 'daily') {
        return s.tanggalPertemuan === anchorDateStr;
      }

      if (viewMode === 'monthly' || timeScope === 'month') {
        const ymPrefix = anchorDateStr.slice(0, 7); // "YYYY-MM"
        return s.tanggalPertemuan.startsWith(ymPrefix);
      }

      if (viewMode === 'weekly' || timeScope === 'week') {
        const sundayStr = formatDate(getSunday(anchorDate));
        const saturdayDate = new Date(getSunday(anchorDate));
        saturdayDate.setDate(saturdayDate.getDate() + 6);
        const saturdayStr = formatDate(saturdayDate);
        return s.tanggalPertemuan >= sundayStr && s.tanggalPertemuan <= saturdayStr;
      }

      return true;
    });
  }, [sessions, selectedClassId, viewMode, timeScope, anchorDateStr, anchorDate]);

  // Group scoped sessions by date for agenda view
  const sessionsByDate = useMemo(() => {
    const map = new Map<string, TeacherCalendarSessionItem[]>();
    for (const s of scopedSessions) {
      const list = map.get(s.tanggalPertemuan) ?? [];
      list.push(s);
      map.set(s.tanggalPertemuan, list);
    }
    return map;
  }, [scopedSessions]);

  // Map week days to sessions for weekly grid
  const sessionsByWeekDay = useMemo(() => {
    const map = new Map<string, TeacherCalendarSessionItem[]>();
    for (const d of weekDays) {
      const list = sessions.filter((s) => {
        if (!matchesClass(s)) return false;
        return s.tanggalPertemuan === d.dateStr;
      });
      list.sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
      map.set(d.dateStr, list);
    }
    return map;
  }, [weekDays, sessions, selectedClassId]);

  // Map all sessions by date for monthly calendar chips
  const sessionsByAnyDate = useMemo(() => {
    const map = new Map<string, TeacherCalendarSessionItem[]>();
    for (const s of sessions) {
      if (!matchesClass(s)) continue;
      const list = map.get(s.tanggalPertemuan) ?? [];
      list.push(s);
      map.set(s.tanggalPertemuan, list);
    }
    return map;
  }, [sessions, selectedClassId]);

  // Sessions for Daily View
  const dailySessions = useMemo(() => {
    return sessions
      .filter((s) => matchesClass(s) && s.tanggalPertemuan === anchorDateStr)
      .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
  }, [sessions, selectedClassId, anchorDateStr]);

  const dailyDayIndex = anchorDate.getDay();
  const dailyDayKey = DAY_KEYS[dailyDayIndex];
  const dailyDayName = t(`day_${dailyDayKey}`);
  const dailyFullDateFormatted = anchorDate.toLocaleDateString(
    locale === 'en' ? 'en-GB' : 'id-ID',
    {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }
  );
  const isDailyToday = anchorDateStr === todayStr;

  return (
    <>
      {/* ========================================================= */}
      {/* UNIFIED GOOGLE CLASSROOM CALENDAR CONTAINER (SINGLE CARD) */}
      {/* ========================================================= */}
      <div className="overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xs">
        {/* TOP BAR: Class Filter + Navigation Stepper (Centered) + View Switcher */}
        <div className="flex flex-col gap-3 border-b border-slate-300 dark:border-slate-700 p-3 sm:p-4 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center bg-white dark:bg-slate-900">
          {/* Left Side: Classroom Class Selector */}
          <div className="flex items-center justify-center md:justify-start">
            {!hideClassFilter && classes.length > 0 ? (
              <div className="w-full max-w-xs sm:w-56 md:w-64">
                <FilterDropdown
                  value={String(selectedClassId ?? '')}
                  onChange={(val) => setSelectedClassId(val ? Number(val) : null)}
                  options={[
                    { value: '', label: 'Semua kelas' },
                    ...classes.map((c) => ({
                      value: String(c.id),
                      label: c.displayName,
                    })),
                  ]}
                  size="sm"
                  ariaLabel="Pilih kelas"
                />
              </div>
            ) : null}
          </div>

          {/* Center: Navigation Stepper (Chevron Left + Date Range Label + Chevron Right) - ALWAYS CENTERED */}
          <div className="flex items-center justify-center">
            <div className="inline-flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={viewMode === 'agenda'}
                aria-label={t('prevPeriod') || 'Sebelumnya'}
                title={t('prevPeriod') || 'Sebelumnya'}
                className="grid size-8 place-items-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <ChevronLeft className="size-4" />
              </button>

              <h2 className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-base px-1 select-none whitespace-nowrap text-center">
                {rangeLabel}
              </h2>

              <button
                type="button"
                onClick={handleNext}
                disabled={viewMode === 'agenda'}
                aria-label={t('nextPeriod') || 'Berikutnya'}
                title={t('nextPeriod') || 'Berikutnya'}
                className="grid size-8 place-items-center rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>

          {/* Right Side: View Mode Tabs (Harian / Mingguan / Bulanan) with Glass Effect & Spring Animation */}
          <div className="flex items-center justify-center md:justify-end">
            <LayoutGroup id="teacher-calendar-view-mode-tabs">
              <div
                className="relative inline-flex items-center rounded-xl bg-slate-200/50 dark:bg-slate-900/60 p-1 border border-slate-300/60 dark:border-slate-800/80 backdrop-blur-md shadow-[inset_0_1px_2.5px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.4)] gap-1"
                role="group"
                aria-label="Mode tampilan kalender"
              >
                {([
                  { key: 'daily' as const, label: t('dailyView') || 'Harian', scope: 'day' as const },
                  { key: 'weekly' as const, label: t('weeklyGrid') || 'Mingguan', scope: 'week' as const },
                  { key: 'monthly' as const, label: t('monthlyGrid') || 'Bulanan', scope: 'month' as const },
                  ...(allowedViews.includes('agenda')
                    ? [{ key: 'agenda' as const, label: t('agendaView') || 'Agenda Kompak', scope: 'all' as const }]
                    : []),
                ] as const)
                  .filter((item) => allowedViews.includes(item.key))
                  .map((item) => {
                    const isActive = viewMode === item.key;
                    return (
                      <motion.button
                        key={item.key}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setViewMode(item.key);
                          setTimeScope(item.scope);
                        }}
                        aria-label={item.label}
                        title={item.label}
                        className={`relative inline-flex items-center justify-center rounded-lg px-3 py-1 text-xs font-semibold cursor-pointer select-none transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                          isActive
                            ? 'text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="teacher-calendar-view-pill"
                            className="absolute inset-0 rounded-lg bg-white/85 dark:bg-slate-800/90 backdrop-blur-sm shadow-[0_1.5px_4px_rgba(0,0,0,0.08),inset_0_1px_1px_rgba(255,255,255,0.7)] dark:shadow-[0_1.5px_4px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.1)] border border-white/60 dark:border-slate-700/60"
                            transition={
                              shouldReduceMotion
                                ? { duration: 0 }
                                : { type: 'spring', stiffness: 450, damping: 32 }
                            }
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                      </motion.button>
                    );
                  })}
              </div>
            </LayoutGroup>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 1. MODE A: DAILY SCHEDULE VIEW (COMPACT AGENDA STYLE)     */}
        {/* ========================================================= */}
        {viewMode === 'daily' && (
          <div>
            {dailySessions.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {t('noUpcomingSessions') || 'Tidak ada sesi pertemuan pada tanggal ini.'}
                </p>
                {anchorDateStr !== todayStr && (
                  <button
                    type="button"
                    onClick={handleToday}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Kembali ke Hari Ini
                  </button>
                )}
              </div>
            ) : (
              <div>
                {/* Date Header Ribbon */}
                <div
                  className={`flex items-center justify-between border-b border-slate-300 dark:border-slate-700 px-4 py-2.5 ${
                    isDailyToday
                      ? 'bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold'
                      : 'bg-slate-50/80 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-tight">
                      {dailyDayName}, {dailyFullDateFormatted}
                    </span>
                    {isDailyToday && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white">
                        {t('todayLabel') || 'HARI INI'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                    {dailySessions.length} Sesi
                  </span>
                </div>

                {/* Scannable Classroom Rows */}
                <div className="divide-y divide-slate-300 dark:divide-slate-700">
                  {dailySessions.map((session) => {
                    const theme = CLASSROOM_THEMES[session.jenjang] ?? DEFAULT_CLASSROOM_THEME;
                    const isCancelled = session.statusSesi === 'dibatalkan';
                    const sessionUrl = `/teacher/classes/${session.kelasId}/sessions/${session.tanggalPertemuan}/attendance?sesi=${session.jadwalItemId}`;

                    const content = (
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                          {session.jamMulai} – {session.jamSelesai}
                        </span>
                        <div className="min-w-0">
                          <p className="font-display text-sm font-bold text-slate-950 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                            {session.kelasDisplayName}
                          </p>
                        </div>
                      </div>
                    );

                    if (isCancelled) {
                      return (
                        <div
                          key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                          className={`group relative flex items-center justify-between gap-3 px-4 py-3.5 border-l-4 ${theme.cardBorder} opacity-60 line-through cursor-not-allowed`}
                        >
                          {content}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                        href={sessionUrl}
                        className={`group relative flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-l-4 ${theme.cardBorder}`}
                      >
                        {content}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. MODE B: GOOGLE CLASSROOM WEEKLY GRID (7-COLUMN CANVAS) */}
        {/* ========================================================= */}
        {viewMode === 'weekly' && (
          <div className="overflow-x-auto scrollbar-thin">
            <div className="grid grid-cols-7 min-w-[700px] divide-x divide-slate-300 dark:divide-slate-700 min-h-[520px] bg-white dark:bg-slate-900">
              {weekDays.map((d) => {
                const daySessions = sessionsByWeekDay.get(d.dateStr) ?? [];
                return (
                  <div
                    key={d.dateStr}
                    className={`flex flex-col transition-colors ${
                      d.isToday ? 'bg-blue-50/15 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Date Header: Abbreviated Day Name + Big Date Number (with Circle on Today) */}
                    <div className="pt-4 pb-3 px-2 flex flex-col items-center justify-center text-center select-none">
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        {d.dayNameShort}
                      </p>
                      <div className="mt-1 flex items-center justify-center min-h-[44px]">
                        {d.isToday ? (
                          <span className="flex size-10 sm:size-11 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-2xl sm:text-3xl tabular-nums shadow-sm ring-2 ring-blue-600/20">
                            {d.dayNum}
                          </span>
                        ) : (
                          <span className="text-3xl sm:text-4xl font-normal text-slate-800 dark:text-slate-100 tabular-nums">
                            {d.dayNum}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Column Content: Stacked Solid Color Cards (Empty if no sessions) */}
                    <div className="flex-1 p-2 space-y-2">
                      {daySessions.map((session) => {
                        const solidColor =
                          CLASSROOM_SOLID_COLORS[session.jenjang] ?? DEFAULT_SOLID_COLOR;
                        const isCancelled = session.statusSesi === 'dibatalkan';
                        const sessionUrl = `/teacher/classes/${session.kelasId}/sessions/${session.tanggalPertemuan}/attendance?sesi=${session.jadwalItemId}`;

                        const cardInner = (
                          <>
                            <h4 className="font-display text-xs font-semibold text-white leading-tight line-clamp-2">
                              {session.kelasDisplayName}
                            </h4>
                            <p className="mt-1 text-[11px] font-medium text-white/90 tabular-nums">
                              {session.jamMulai} – {session.jamSelesai}
                            </p>
                          </>
                        );

                        if (isCancelled) {
                          return (
                            <div
                              key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                              className={`w-full rounded-md p-2.5 text-left text-white shadow-2xs opacity-60 line-through cursor-not-allowed ${solidColor}`}
                            >
                              {cardInner}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                            href={sessionUrl}
                            className={`block w-full rounded-md p-2.5 text-left text-white shadow-2xs transition-all duration-150 cursor-pointer hover:brightness-105 active:scale-[0.98] ${solidColor}`}
                          >
                            {cardInner}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. MODE C: MONTHLY FULL-GRID (CLASSROOM / GOOGLE CALENDAR) */}
        {/* ========================================================= */}
        {viewMode === 'monthly' && (
          <div>
            {/* Day Headers (Sun - Sat) */}
            <div className="grid grid-cols-7 border-b border-slate-300 dark:border-slate-700 divide-x divide-slate-300 dark:divide-slate-700 bg-slate-50/90 dark:bg-slate-800/60 text-center">
              {['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'].map((day) => (
                <div key={day} className="py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                </div>
              ))}
            </div>

            {/* 35 / 42 Day Grid with Firm Borders */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-300 dark:divide-slate-700 bg-white dark:bg-slate-900">
              {monthGridDays.map((day, idx) => {
                const daySessions = sessionsByAnyDate.get(day.dateStr) ?? [];
                const hasSessions = daySessions.length > 0;

                return (
                  <div
                    key={`${day.dateStr}-${idx}`}
                    className={`min-h-[95px] sm:min-h-[120px] p-2 transition-colors flex flex-col justify-between ${
                      day.isCurrentMonth
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-slate-50/70 dark:bg-slate-950/60 text-slate-400 dark:text-slate-600'
                    } ${day.isToday ? 'bg-blue-50/30 dark:bg-blue-950/30' : ''}`}
                  >
                    {/* Top Bar: Date Number (Circle on Today) + Sesi Count */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`size-7 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${
                          day.isToday
                            ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-600/30'
                            : day.isCurrentMonth
                            ? 'text-slate-900 dark:text-slate-100'
                            : 'text-slate-400 dark:text-slate-600'
                        }`}
                      >
                        {day.dayNum}
                      </span>
                      {hasSessions && (
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 dark:text-slate-300 sm:hidden">
                          {daySessions.length}
                        </span>
                      )}
                    </div>

                    {/* Scheduled Sessions Chips: SOLID COLOR WITH WHITE TEXT */}
                    <div className="mt-1.5 space-y-1 overflow-hidden flex-1">
                      {daySessions.slice(0, 2).map((s) => {
                        const solidColor =
                          CLASSROOM_SOLID_COLORS[s.jenjang] ?? DEFAULT_SOLID_COLOR;
                        const isCancelled = s.statusSesi === 'dibatalkan';
                        const sessionUrl = `/teacher/classes/${s.kelasId}/sessions/${s.tanggalPertemuan}/attendance?sesi=${s.jadwalItemId}`;

                        const chipInner = (
                          <>
                            <span className="tabular-nums font-bold shrink-0">{s.jamMulai}</span>
                            <span className="truncate">{s.kelasDisplayName}</span>
                          </>
                        );

                        if (isCancelled) {
                          return (
                            <div
                              key={`${s.jadwalItemId}-${s.tanggalPertemuan}`}
                              title={`${s.jamMulai} ${s.kelasDisplayName} (Dibatalkan)`}
                              className={`hidden sm:flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold truncate opacity-60 line-through cursor-not-allowed text-white shadow-2xs ${solidColor}`}
                            >
                              {chipInner}
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={`${s.jadwalItemId}-${s.tanggalPertemuan}`}
                            href={sessionUrl}
                            title={`${s.jamMulai} ${s.kelasDisplayName}`}
                            className={`hidden sm:flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold truncate cursor-pointer hover:brightness-105 active:scale-[0.98] transition-all text-white shadow-2xs ${solidColor}`}
                          >
                            {chipInner}
                          </Link>
                        );
                      })}

                      {daySessions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            setAnchorDateStr(day.dateStr);
                            setMobileSelectedDate(day.dateStr);
                            setViewMode('weekly');
                          }}
                          className="hidden sm:inline-block text-[9px] font-bold text-blue-600 dark:text-blue-400 pl-1 hover:underline cursor-pointer"
                        >
                          +{daySessions.length - 2} lainnya
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. MODE D: COMPACT AGENDA LIST (CLASSROOM TO-DO/SCHEDULE)  */}
        {/* ========================================================= */}
        {viewMode === 'agenda' && (
          <div>
            {sessionsByDate.size === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {t('noUpcomingSessions') || 'Tidak ada sesi pertemuan untuk filter ini.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {[...sessionsByDate.entries()].map(([dateStr, items]) => {
                  const d = parseDate(dateStr);
                  const dayIndex = d.getDay();
                  const dayKey = DAY_KEYS[dayIndex];
                  const dayName = t(`day_${dayKey}`);
                  const fullDateFormatted = d.toLocaleDateString(
                    locale === 'en' ? 'en-GB' : 'id-ID',
                    {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    }
                  );
                  const isDateToday = dateStr === todayStr;

                  return (
                    <div key={dateStr}>
                      {/* Date Header Ribbon */}
                      <div
                        className={`flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-2.5 ${
                          isDateToday
                            ? 'bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-200 font-bold'
                            : 'bg-slate-50/80 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-tight">
                            {dayName}, {fullDateFormatted}
                          </span>
                          {isDateToday && (
                            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white">
                              {t('todayLabel') || 'HARI INI'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                          {items.length} Sesi
                        </span>
                      </div>

                      {/* Scannable Classroom Rows */}
                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {items.map((session) => {
                          const theme = CLASSROOM_THEMES[session.jenjang] ?? DEFAULT_CLASSROOM_THEME;
                          const isCancelled = session.statusSesi === 'dibatalkan';
                          const isFilled = session.presensiCount > 0;
                          const hasTasks = session.tugasList.length > 0;
                          const sessionUrl = `/teacher/classes/${session.kelasId}/sessions/${session.tanggalPertemuan}/attendance?sesi=${session.jadwalItemId}`;

                          const rowContent = (
                            <>
                              {/* Left: Time + Full Class Display Name (No Pill) */}
                              <div className="flex items-center gap-3 min-w-0">
                                <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400 shrink-0">
                                  {session.jamMulai} – {session.jamSelesai}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-display text-sm font-bold text-slate-950 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                    {session.kelasDisplayName}
                                  </p>
                                </div>
                                {hasTasks && (
                                  <span className="hidden md:inline-flex rounded bg-amber-100/90 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200 shrink-0">
                                    {session.tugasList.length} Tugas
                                  </span>
                                )}
                              </div>

                              {/* Right: Participant Count + Status + Action Link */}
                              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                                  {isCancelled
                                    ? 'Dibatalkan'
                                    : isFilled
                                    ? `${session.presensiCount}/${session.pesertaCount} hadir`
                                    : 'Belum presensi'}
                                </span>
                                {!isCancelled && (
                                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                                    Buka Sesi →
                                  </span>
                                )}
                              </div>
                            </>
                          );

                          if (isCancelled) {
                            return (
                              <div
                                key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                                className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 border-l-4 ${theme.cardBorder} opacity-60 line-through cursor-not-allowed`}
                              >
                                {rowContent}
                              </div>
                            );
                          }

                          return (
                            <Link
                              key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                              href={sessionUrl}
                              className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-l-4 ${theme.cardBorder}`}
                            >
                              {rowContent}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
