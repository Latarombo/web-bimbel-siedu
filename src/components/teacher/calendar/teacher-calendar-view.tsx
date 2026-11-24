'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { CalendarSessionDrawer } from './calendar-session-drawer';

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

// Helper: Get Monday of the week for a given date
function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.getFullYear(), date.getMonth(), diff);
}

// Day name mappings
const DAY_KEYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

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
  allowedViews = ['daily', 'weekly', 'monthly', 'agenda'],
  defaultView = 'weekly',
}: TeacherCalendarViewProps) {
  const t = useTranslations('teacher');

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

  // Drawer state for selected session
  const [selectedSession, setSelectedSession] = useState<TeacherCalendarSessionItem | null>(null);

  const anchorDate = useMemo(() => parseDate(anchorDateStr), [anchorDateStr]);

  // Current week days (Monday - Sunday)
  const weekDays = useMemo(() => {
    const monday = getMonday(anchorDate);
    const days: Array<{
      dateStr: string;
      dayNum: number;
      dayName: string;
      fullDateFormatted: string;
      isToday: boolean;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      const dateStr = formatDate(d);
      const dayIndex = d.getDay();
      const dayKey = DAY_KEYS[dayIndex];
      const dayName = t(`day_${dayKey}`);
      const fullDateFormatted = d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', {
        day: 'numeric',
        month: 'short',
      });

      days.push({
        dateStr,
        dayNum: d.getDate(),
        dayName,
        fullDateFormatted,
        isToday: dateStr === todayStr,
      });
    }
    return days;
  }, [anchorDate, todayStr, locale, t]);

  // Month grid days (35 or 42 cells) for monthly view
  const monthGridDays = useMemo(() => {
    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth(); // 0-indexed
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
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
      const monday = getMonday(anchorDate);
      const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
      const formatOpt: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
      const startStr = monday.toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', formatOpt);
      const endStr = sunday.toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', {
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
        const mondayStr = formatDate(getMonday(anchorDate));
        const sundayDate = new Date(getMonday(anchorDate));
        sundayDate.setDate(sundayDate.getDate() + 6);
        const sundayStr = formatDate(sundayDate);
        return s.tanggalPertemuan >= mondayStr && s.tanggalPertemuan <= sundayStr;
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
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        {/* TOP BAR: Class Filter + Navigation Stepper & Date + View Switcher */}
        <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900">
          {/* Left Side: Classroom Class Selector + Navigation Stepper */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
            {/* Google Classroom Class Selector Dropdown (Hidden if hideClassFilter is true) */}
            {!hideClassFilter && classes.length > 0 && (
              <>
                <div className="w-56 sm:w-64">
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
                <div className="h-5 w-px bg-slate-200 dark:border-slate-700 hidden sm:block" />
              </>
            )}

            {/* Stepper: Today Button + Chevron Left + Date Range Label + Chevron Right */}
            <div className="inline-flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handleToday}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 shadow-2xs mr-0.5 sm:mr-1"
              >
                {t('todayLabel') || 'Hari ini'}
              </button>
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

              <h2 className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-base px-1 select-none whitespace-nowrap">
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

          {/* Right Side: View Mode Tabs (Harian / Kisi Mingguan / Kisi Bulanan / Agenda Kompak) */}
          <div
            className="inline-flex rounded-lg bg-slate-200/60 dark:bg-slate-950/70 p-1 border border-slate-300/80 dark:border-slate-800 shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.08)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.5)] self-start sm:self-auto gap-1"
            role="group"
            aria-label="Mode tampilan kalender"
          >
            {allowedViews.includes('daily') && (
              <button
                type="button"
                onClick={() => {
                  setViewMode('daily');
                  setTimeScope('day');
                }}
                aria-label="Tampilan Harian"
                title="Tampilan Harian"
                className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  viewMode === 'daily'
                    ? 'bg-slate-100 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 font-bold shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.6)] border border-slate-300/70 dark:border-slate-700/70'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <span>Harian</span>
              </button>
            )}

            {allowedViews.includes('weekly') && (
              <button
                type="button"
                onClick={() => {
                  setViewMode('weekly');
                  setTimeScope('week');
                }}
                aria-label={t('weeklyGrid') || 'Kisi Mingguan'}
                title={t('weeklyGrid') || 'Kisi Mingguan'}
                className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  viewMode === 'weekly'
                    ? 'bg-slate-100 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 font-bold shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.6)] border border-slate-300/70 dark:border-slate-700/70'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <span>{t('weeklyGrid') || 'Kisi Mingguan'}</span>
              </button>
            )}

            {allowedViews.includes('monthly') && (
              <button
                type="button"
                onClick={() => {
                  setViewMode('monthly');
                  setTimeScope('month');
                }}
                aria-label={t('monthlyGrid') || 'Kisi Bulanan'}
                title={t('monthlyGrid') || 'Kisi Bulanan'}
                className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  viewMode === 'monthly'
                    ? 'bg-slate-100 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 font-bold shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.6)] border border-slate-300/70 dark:border-slate-700/70'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <span>{t('monthlyGrid') || 'Kisi Bulanan'}</span>
              </button>
            )}

            {allowedViews.includes('agenda') && (
              <button
                type="button"
                onClick={() => {
                  setViewMode('agenda');
                  setTimeScope('all');
                }}
                aria-label={t('agendaView') || 'Agenda Kompak'}
                title={t('agendaView') || 'Agenda Kompak'}
                className={`inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  viewMode === 'agenda'
                    ? 'bg-slate-100 dark:bg-slate-800/90 text-blue-600 dark:text-blue-400 font-bold shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_1.5px_3px_rgba(0,0,0,0.6)] border border-slate-300/70 dark:border-slate-700/70'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/40 dark:hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <span>{t('agendaView') || 'Agenda Kompak'}</span>
              </button>
            )}
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
                  className={`flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-4 py-2.5 ${
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
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dailySessions.map((session) => {
                    const theme = CLASSROOM_THEMES[session.jenjang] ?? DEFAULT_CLASSROOM_THEME;
                    const isCancelled = session.statusSesi === 'dibatalkan';
                    const isFilled = session.presensiCount > 0;
                    const hasTasks = session.tugasList.length > 0;

                    return (
                      <div
                        key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                        onClick={() => setSelectedSession(session)}
                        className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-l-4 ${theme.cardBorder} ${
                          isCancelled ? 'opacity-70' : ''
                        }`}
                      >
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
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                            Rincian Sesi →
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. MODE B: WEEKLY TIMETABLE GRID (CLASSROOM SCHEDULE)     */}
        {/* ========================================================= */}
        {viewMode === 'weekly' && (
          <div>
            {/* Desktop 7-Column Timetable Grid (lg+) */}
            <div className="hidden lg:block">
              {/* Header: 7 Days (Senin - Minggu) */}
              <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800/70 bg-slate-50/80 dark:bg-slate-800/50">
                {weekDays.map((d) => (
                  <div
                    key={d.dateStr}
                    className={`p-3 text-center transition-colors ${
                      d.isToday ? 'bg-blue-50/80 dark:bg-blue-950/40' : ''
                    }`}
                  >
                    <p
                      className={`text-[11px] font-semibold uppercase tracking-wider ${
                        d.isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {d.dayName}
                    </p>
                    <div className="mt-1 flex items-center justify-center">
                      <span
                        className={`size-8 rounded-full flex items-center justify-center text-sm font-bold tabular-nums transition-all ${
                          d.isToday
                            ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/20'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {d.dayNum}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Body: 7 Day Columns */}
              <div className="grid grid-cols-7 divide-x divide-slate-100 dark:divide-slate-800/70 min-h-[480px] bg-slate-50/20 dark:bg-slate-950/20">
                {weekDays.map((d) => {
                  const daySessions = sessionsByWeekDay.get(d.dateStr) ?? [];
                  return (
                    <div
                      key={d.dateStr}
                      className={`p-2 space-y-2.5 transition-colors ${
                        d.isToday ? 'bg-blue-50/20 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      {daySessions.length === 0 ? (
                        <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200/80 dark:border-slate-800 p-2 text-center">
                          <span className="text-xs text-slate-400 dark:text-slate-600">-</span>
                        </div>
                      ) : (
                        daySessions.map((session) => {
                          const theme = CLASSROOM_THEMES[session.jenjang] ?? DEFAULT_CLASSROOM_THEME;
                          const isCancelled = session.statusSesi === 'dibatalkan';
                          const isFilled = session.presensiCount > 0;
                          const hasTasks = session.tugasList.length > 0;

                          return (
                            <div
                              key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                              onClick={() => setSelectedSession(session)}
                              className={`group relative flex flex-col justify-between rounded-xl border border-l-4 border-slate-200/80 dark:border-slate-800 p-3 shadow-2xs transition-all duration-150 hover:shadow-xs cursor-pointer ${theme.cardBorder} ${theme.cardBg} ${
                                session.isToday && !isCancelled ? 'ring-1 ring-blue-500/20 dark:ring-blue-500/30' : ''
                              } ${isCancelled ? 'opacity-70' : ''}`}
                            >
                              <div>
                                {/* Time without Pill Badge */}
                                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                  <span className="tabular-nums">
                                    {session.jamMulai} – {session.jamSelesai}
                                  </span>
                                </div>

                                {/* Class Title: Nama Mapel · Jenjang (Tingkat) */}
                                <h4 className="mt-1 font-display text-xs font-bold leading-snug text-slate-950 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                                  {session.kelasDisplayName}
                                </h4>

                                {/* Classroom Task indicator if present */}
                                {hasTasks && (
                                  <div className="mt-1.5 inline-flex items-center gap-1 rounded bg-amber-100/90 dark:bg-amber-950/60 px-1.5 py-0.5 text-[9px] font-bold text-amber-900 dark:text-amber-200">
                                    <span>{session.tugasList.length} Tugas Diberikan</span>
                                  </div>
                                )}
                              </div>

                              {/* Attendance status */}
                              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[10px]">
                                <span className="font-semibold text-slate-600 dark:text-slate-400">
                                  {isCancelled
                                    ? 'Dibatalkan'
                                    : isFilled
                                    ? `${session.presensiCount}/${session.pesertaCount} hadir`
                                    : 'Belum presensi'}
                                </span>
                                <span className="font-bold text-blue-600 dark:text-blue-400 opacity-90 group-hover:opacity-100">
                                  Buka →
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile / Tablet Day Carousel (<lg) */}
            <div className="lg:hidden p-3 sm:p-4 space-y-3">
              {/* Day Selector Tabs */}
              <div className="flex overflow-x-auto pb-1 gap-2 scrollbar-hide">
                {weekDays.map((d) => {
                  const daySessions = sessionsByWeekDay.get(d.dateStr) ?? [];
                  const isSelected = d.dateStr === mobileSelectedDate;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setMobileSelectedDate(d.dateStr)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center rounded-xl px-3 py-2 text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                          : d.isToday
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold">{d.dayName.slice(0, 3)}</span>
                      <span className="text-sm font-extrabold tabular-nums">{d.dayNum}</span>
                      {daySessions.length > 0 && (
                        <span
                          className={`mt-0.5 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300'
                          }`}
                        >
                          {daySessions.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Day Session Cards on Mobile */}
              <div className="space-y-3">
                {(() => {
                  const activeSessions = sessionsByWeekDay.get(mobileSelectedDate) ?? [];
                  if (activeSessions.length === 0) {
                    return (
                      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center shadow-2xs">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {t('noScheduleToday') || 'Tidak ada jadwal pada tanggal ini'}
                        </p>
                      </div>
                    );
                  }
                  return activeSessions.map((session) => {
                    const theme = CLASSROOM_THEMES[session.jenjang] ?? DEFAULT_CLASSROOM_THEME;
                    const isCancelled = session.statusSesi === 'dibatalkan';
                    const isFilled = session.presensiCount > 0;
                    const hasTasks = session.tugasList.length > 0;

                    return (
                      <div
                        key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                        onClick={() => setSelectedSession(session)}
                        className={`group relative flex flex-col justify-between rounded-2xl border border-l-4 border-slate-200/90 dark:border-slate-800 p-4 shadow-2xs transition-all hover:shadow-xs cursor-pointer ${theme.cardBorder} ${theme.cardBg} ${
                          session.isToday && !isCancelled ? 'ring-1 ring-blue-500/20 dark:ring-blue-500/30' : ''
                        } ${isCancelled ? 'opacity-70' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                              {session.jamMulai} – {session.jamSelesai}
                            </span>
                            <h4 className="mt-1 font-display text-sm font-bold text-slate-950 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {session.kelasDisplayName}
                            </h4>
                            {hasTasks && (
                              <div className="mt-2 inline-flex items-center gap-1 rounded bg-amber-100/90 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:text-amber-200">
                                <span>{session.tugasList.length} Tugas Diberikan</span>
                              </div>
                            )}
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-400">
                            {isCancelled
                              ? 'Batal'
                              : isFilled
                              ? `${session.presensiCount}/${session.pesertaCount} hadir`
                              : 'Belum presensi'}
                          </span>
                        </div>

                        <div className="mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">
                            {session.pesertaCount} siswa terdaftar
                          </span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            Buka Sesi →
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. MODE C: MONTHLY FULL-GRID (CLASSROOM / GOOGLE CALENDAR) */}
        {/* ========================================================= */}
        {viewMode === 'monthly' && (
          <div>
            {/* Day Headers (Mon - Sun) */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 divide-x divide-slate-100 dark:divide-slate-800/70 bg-slate-50/80 dark:bg-slate-800/50 text-center">
              {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => (
                <div key={day} className="py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                </div>
              ))}
            </div>

            {/* 35 / 42 Day Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/70 bg-slate-50/20 dark:bg-slate-950/20">
              {monthGridDays.map((day, idx) => {
                const daySessions = sessionsByAnyDate.get(day.dateStr) ?? [];
                const hasSessions = daySessions.length > 0;

                return (
                  <div
                    key={`${day.dateStr}-${idx}`}
                    className={`min-h-[95px] sm:min-h-[120px] p-2 transition-colors flex flex-col justify-between ${
                      day.isCurrentMonth ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/60 dark:bg-slate-950/50 text-slate-400 dark:text-slate-600'
                    } ${day.isToday ? 'bg-blue-50/30 dark:bg-blue-950/30' : ''}`}
                  >
                    {/* Top Bar: Date Number + Sesi Count */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`size-6 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${
                          day.isToday
                            ? 'bg-blue-600 text-white shadow-2xs'
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

                    {/* Scheduled Sessions Chips (Google Classroom signature chips) */}
                    <div className="mt-1.5 space-y-1 overflow-hidden flex-1">
                      {daySessions.slice(0, 2).map((s) => {
                        const theme = CLASSROOM_THEMES[s.jenjang] ?? DEFAULT_CLASSROOM_THEME;
                        const hasTasks = s.tugasList.length > 0;

                        return (
                          <div
                            key={`${s.jadwalItemId}-${s.tanggalPertemuan}`}
                            onClick={() => setSelectedSession(s)}
                            title={`${s.jamMulai} ${s.kelasDisplayName}${hasTasks ? ` (${s.tugasList.length} Tugas)` : ''}`}
                            className={`hidden sm:flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold truncate border cursor-pointer hover:shadow-2xs transition-all ${theme.monthlyChip}`}
                          >
                            <span className={`size-1.5 rounded-full shrink-0 ${theme.dot}`} />
                            <span className="tabular-nums font-bold shrink-0">{s.jamMulai}</span>
                            <span className="truncate">{s.kelasDisplayName}</span>
                            {hasTasks && (
                              <span className="text-[9px] font-bold text-amber-700 dark:text-amber-300 shrink-0">
                                • T
                              </span>
                            )}
                          </div>
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

                          return (
                            <div
                              key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                              onClick={() => setSelectedSession(session)}
                              className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer border-l-4 ${theme.cardBorder} ${
                                isCancelled ? 'opacity-70' : ''
                              }`}
                            >
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
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                                  Rincian Sesi →
                                </span>
                              </div>
                            </div>
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

      {/* ========================================================= */}
      {/* 5. SLIDE-OVER SESSION DETAIL DRAWER                       */}
      {/* ========================================================= */}
      <CalendarSessionDrawer
        isOpen={selectedSession !== null}
        onClose={() => setSelectedSession(null)}
        session={selectedSession}
        locale={locale}
      />
    </>
  );
}
