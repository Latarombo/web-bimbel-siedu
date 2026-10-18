'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  CalendarDays,
  List,
  ArrowRight,
} from 'lucide-react';

export interface TeacherCalendarSessionItem {
  kelasId: number;
  jadwalItemId: number;
  tanggalPertemuan: string; // "YYYY-MM-DD"
  jamMulai: string; // "08:00"
  jamSelesai: string; // "09:30"
  kelasNama: string;
  jenjang: string;
  statusSesi: string; // "terjadwal" | "selesai" | "dibatalkan"
  pesertaCount: number;
  presensiCount: number;
  isPast: boolean;
  isToday: boolean;
}

export interface ClassOption {
  id: number;
  name: string;
  jenjang: string;
}

interface TeacherCalendarViewProps {
  sessions: TeacherCalendarSessionItem[];
  classes: ClassOption[];
  todayStr: string; // "YYYY-MM-DD"
  locale: string;
}

type ViewMode = 'weekly' | 'monthly' | 'agenda';
type TimeScope = 'week' | 'month' | 'today' | 'all';

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

// Day name mappings: must match i18n keys: day_Minggu, day_Senin, ...
const DAY_KEYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'] as const;

export function TeacherCalendarView({
  sessions,
  classes,
  todayStr,
  locale,
}: TeacherCalendarViewProps) {
  const t = useTranslations('teacher');

  // View state: 'weekly' (default), 'monthly', or 'agenda'
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  // Time scope: 'week' (default) | 'month' | 'today' | 'all'
  const [timeScope, setTimeScope] = useState<TimeScope>('week');

  // Anchor date for navigation (defaults to today)
  const [anchorDateStr, setAnchorDateStr] = useState<string>(todayStr);

  // Class filter state
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  // Mobile selected day in weekly view
  const [mobileSelectedDate, setMobileSelectedDate] = useState<string>(todayStr);

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
    // Adjust so Monday is 0, Sunday is 6
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

  // Calculate dynamic date range label for toolbar
  const rangeLabel = useMemo(() => {
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

    if (timeScope === 'today') {
      const d = parseDate(anchorDateStr);
      return d.toLocaleDateString(locale === 'en' ? 'en-GB' : 'id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }

    return t('allPeriods') || 'Semua Jadwal';
  }, [viewMode, timeScope, anchorDateStr, anchorDate, locale, t]);

  // Stepper handlers
  const handlePrev = () => {
    if (viewMode === 'monthly' || timeScope === 'month') {
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
    } else if (timeScope === 'today') {
      const d = parseDate(anchorDateStr);
      d.setDate(d.getDate() - 1);
      const newDateStr = formatDate(d);
      setAnchorDateStr(newDateStr);
      setMobileSelectedDate(newDateStr);
    }
  };

  const handleNext = () => {
    if (viewMode === 'monthly' || timeScope === 'month') {
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
    } else if (timeScope === 'today') {
      const d = parseDate(anchorDateStr);
      d.setDate(d.getDate() + 1);
      const newDateStr = formatDate(d);
      setAnchorDateStr(newDateStr);
      setMobileSelectedDate(newDateStr);
    }
  };

  const handleToday = () => {
    setAnchorDateStr(todayStr);
    setMobileSelectedDate(todayStr);
  };

  // Filter sessions based on timeScope and selectedClassId
  const scopedSessions = useMemo(() => {
    return sessions.filter((s) => {
      // Class filter
      if (selectedClassId !== null && s.kelasId !== selectedClassId) {
        return false;
      }

      // Time scope filter
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

      if (timeScope === 'today') {
        return s.tanggalPertemuan === anchorDateStr;
      }

      // 'all'
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
        if (selectedClassId !== null && s.kelasId !== selectedClassId) return false;
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
      if (selectedClassId !== null && s.kelasId !== selectedClassId) continue;
      const list = map.get(s.tanggalPertemuan) ?? [];
      list.push(s);
      map.set(s.tanggalPertemuan, list);
    }
    return map;
  }, [sessions, selectedClassId]);

  return (
    <div className="space-y-4">
      {/* ========================================================= */}
      {/* 1. UNIFIED CALENDAR TOOLBAR (Cal.com / Google Calendar)    */}
      {/* ========================================================= */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Stepper + Date Range Label */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50/80 p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={handlePrev}
              disabled={timeScope === 'all' && viewMode === 'agenda'}
              aria-label={t('prevPeriod') || 'Sebelumnya'}
              title={t('prevPeriod') || 'Sebelumnya'}
              className="grid size-8 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 hover:shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-blue-600 transition-colors hover:bg-white hover:shadow-2xs rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {t('todayLabel') || 'Hari Ini'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={timeScope === 'all' && viewMode === 'agenda'}
              aria-label={t('nextPeriod') || 'Berikutnya'}
              title={t('nextPeriod') || 'Berikutnya'}
              className="grid size-8 place-items-center rounded-lg text-slate-600 transition-colors hover:bg-white hover:text-slate-900 hover:shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <h2 className="text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
            {rangeLabel}
          </h2>
        </div>

        {/* Center / Right: Filter & View Switcher */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {/* Class Filter Dropdown */}
          {classes.length > 1 && (
            <div className="relative">
              <select
                value={selectedClassId ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedClassId(val ? Number(val) : null);
                }}
                aria-label={t('filterClass')}
                className="h-8.5 rounded-xl border border-slate-200 bg-white pl-2.5 pr-7 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-slate-300 focus-visible:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/20 cursor-pointer"
              >
                <option value="">{t('allClasses') || 'Semua Kelas'}</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.jenjang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Scope Segmented Pill (Desktop) */}
          <div className="hidden sm:inline-flex rounded-xl bg-slate-100/90 p-0.5" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={timeScope === 'week' && viewMode === 'weekly'}
              onClick={() => {
                setTimeScope('week');
                setViewMode('weekly');
              }}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                timeScope === 'week' && viewMode === 'weekly'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('thisWeek') || 'Minggu Ini'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={timeScope === 'month' && viewMode === 'monthly'}
              onClick={() => {
                setTimeScope('month');
                setViewMode('monthly');
              }}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                viewMode === 'monthly'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('thisMonth') || 'Bulan Ini'}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={timeScope === 'all' && viewMode === 'agenda'}
              onClick={() => {
                setTimeScope('all');
                setViewMode('agenda');
              }}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                timeScope === 'all' && viewMode === 'agenda'
                  ? 'bg-white text-blue-600 shadow-2xs font-extrabold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('all') || 'Semua'}
            </button>
          </div>

          {/* View Mode Toggle: Weekly vs Monthly vs Agenda */}
          <div className="inline-flex rounded-xl bg-slate-100/90 p-0.5 shadow-2xs" role="group">
            <button
              type="button"
              onClick={() => {
                setViewMode('weekly');
                if (timeScope === 'month') setTimeScope('week');
              }}
              aria-label={t('weeklyGrid') || 'Kisi Mingguan'}
              title={t('weeklyGrid') || 'Kisi Mingguan'}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                viewMode === 'weekly'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden md:inline">{t('weeklyGrid') || 'Mingguan'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode('monthly');
                setTimeScope('month');
              }}
              aria-label={t('monthlyGrid') || 'Kisi Bulanan'}
              title={t('monthlyGrid') || 'Kisi Bulanan'}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                viewMode === 'monthly'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarDays className="size-3.5" />
              <span className="hidden md:inline">{t('monthlyGrid') || 'Bulanan'}</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              aria-label={t('agendaView') || 'Agenda Kompak'}
              title={t('agendaView') || 'Agenda Kompak'}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                viewMode === 'agenda'
                  ? 'bg-white text-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="size-3.5" />
              <span className="hidden md:inline">{t('agendaView') || 'Agenda'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MODE A: WEEKLY TIMETABLE GRID (7 Columns)              */}
      {/* ========================================================= */}
      {viewMode === 'weekly' && (
        <div className="space-y-4">
          {/* Desktop 7-Column Timetable Grid (lg+) */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
            {/* Header: 7 Days */}
            <div className="grid grid-cols-7 border-b border-slate-200 divide-x divide-slate-100 bg-slate-50/70">
              {weekDays.map((d) => (
                <div
                  key={d.dateStr}
                  className={`p-3 text-center transition-colors ${
                    d.isToday ? 'bg-blue-50/90' : ''
                  }`}
                >
                  <p
                    className={`text-[11px] font-extrabold uppercase tracking-wider ${
                      d.isToday ? 'text-blue-700' : 'text-slate-500'
                    }`}
                  >
                    {d.dayName}
                  </p>
                  <div className="mt-1 flex items-center justify-center">
                    <span
                      className={`size-7 rounded-full flex items-center justify-center text-xs font-bold tabular-nums transition-all ${
                        d.isToday
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-600/30'
                          : 'text-slate-800'
                      }`}
                    >
                      {d.dayNum}
                    </span>
                  </div>
                  {d.isToday && (
                    <span className="mt-1 inline-block text-[9px] font-extrabold uppercase tracking-tight text-blue-600">
                      {t('todayLabel') || 'HARI INI'}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Body: 7 Day Columns */}
            <div className="grid grid-cols-7 divide-x divide-slate-100 min-h-[420px] bg-slate-50/20">
              {weekDays.map((d) => {
                const daySessions = sessionsByWeekDay.get(d.dateStr) ?? [];
                return (
                  <div
                    key={d.dateStr}
                    className={`p-2 space-y-2.5 transition-colors ${
                      d.isToday ? 'bg-blue-50/20' : ''
                    }`}
                  >
                    {daySessions.length === 0 ? (
                      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-slate-200/80 p-2 text-center">
                        <span className="text-xs font-medium text-slate-600">-</span>
                      </div>
                    ) : (
                      daySessions.map((session) => {
                        const isCancelled = session.statusSesi === 'dibatalkan';
                        const isFilled = session.presensiCount > 0;
                        const attendanceUrl = `/teacher/classes/${session.kelasId}/sessions/${session.tanggalPertemuan}/attendance?sesi=${session.jadwalItemId}`;

                        const statusConfig = isCancelled
                          ? {
                              bar: 'bg-rose-500',
                              badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80',
                              badgeText: 'Batal',
                              actionText: t('sessionCancelled'),
                              actionStyle: 'text-rose-600',
                            }
                          : isFilled
                          ? {
                              bar: 'bg-emerald-500',
                              badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
                              badgeText: `${session.presensiCount}/${session.pesertaCount}`,
                              actionText: t('viewSession'),
                              actionStyle: 'text-slate-600 group-hover:text-blue-600',
                            }
                          : {
                              bar: session.isToday ? 'bg-blue-600' : 'bg-amber-500',
                              badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
                              badgeText: 'Belum',
                              actionText: t('recordAttendance'),
                              actionStyle: 'text-blue-600 font-bold',
                            };

                        return (
                          <Link
                            key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                            href={isCancelled ? '#' : attendanceUrl}
                            className={`group relative flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-2.5 shadow-2xs transition-all duration-150 hover:border-blue-400 hover:shadow-md cursor-pointer ${
                              isCancelled ? 'opacity-70 pointer-events-none' : ''
                            }`}
                          >
                            {/* Left vertical accent indicator */}
                            <span
                              className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all group-hover:w-1.5 ${statusConfig.bar}`}
                              aria-hidden="true"
                            />

                            <div className="pl-1">
                              {/* Top Row: Time & Mini Status Badge */}
                              <div className="flex items-center justify-between gap-1">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold tabular-nums text-slate-700">
                                  <Clock className="size-2.5 text-slate-600" />
                                  {session.jamMulai} - {session.jamSelesai}
                                </span>
                                <span
                                  className={`inline-flex items-center rounded-full border px-1.5 py-0.2 text-[9px] font-bold ${statusConfig.badgeBg}`}
                                >
                                  {statusConfig.badgeText}
                                </span>
                              </div>

                              {/* Class Name (Subject) */}
                              <h4 className="mt-1.5 text-xs font-bold leading-snug text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                {session.kelasNama}
                              </h4>

                              {/* Level / Jenjang */}
                              <p className="mt-0.5 text-[10px] font-semibold text-slate-500">
                                {session.jenjang}
                              </p>
                            </div>

                            {/* Bottom Action Strip */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 pl-1 flex items-center justify-between">
                              <span
                                className={`text-[11px] inline-flex items-center gap-1 transition-all ${statusConfig.actionStyle}`}
                              >
                                <span>{statusConfig.actionText}</span>
                                {!isCancelled && (
                                  <ArrowRight className="size-2.5 transition-transform group-hover:translate-x-0.5" />
                                )}
                              </span>
                              {!isCancelled && (
                                <span className="text-[10px] font-semibold tabular-nums text-slate-600">
                                  {session.pesertaCount} siswa
                                </span>
                              )}
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile / Tablet Day Carousel (<lg) */}
          <div className="lg:hidden space-y-3">
            {/* Day Selector Tabs */}
            <div className="flex overflow-x-auto pb-1 gap-1.5 scrollbar-hide">
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
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-white text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold">{d.dayName.slice(0, 3)}</span>
                    <span className="text-sm font-extrabold tabular-nums">{d.dayNum}</span>
                    {daySessions.length > 0 && (
                      <span
                        className={`mt-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-bold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {daySessions.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Sessi Cards on Mobile */}
            <div className="space-y-2.5">
              {(() => {
                const activeSessions = sessionsByWeekDay.get(mobileSelectedDate) ?? [];
                if (activeSessions.length === 0) {
                  return (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-2xs">
                      <p className="text-xs font-semibold text-slate-500">
                        {t('noScheduleToday') || 'Tidak ada jadwal pada tanggal ini'}
                      </p>
                    </div>
                  );
                }
                return activeSessions.map((session) => {
                  const isCancelled = session.statusSesi === 'dibatalkan';
                  const isFilled = session.presensiCount > 0;
                  const attendanceUrl = `/teacher/classes/${session.kelasId}/sessions/${session.tanggalPertemuan}/attendance?sesi=${session.jadwalItemId}`;

                  const statusConfig = isCancelled
                    ? {
                        bar: 'bg-rose-500',
                        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80',
                        badgeText: 'Batal',
                        actionText: t('sessionCancelled'),
                        actionStyle: 'text-rose-600',
                      }
                    : isFilled
                    ? {
                        bar: 'bg-emerald-500',
                        badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
                        badgeText: `${session.presensiCount}/${session.pesertaCount} Hadir`,
                        actionText: t('viewSession'),
                        actionStyle: 'text-slate-600 group-hover:text-blue-600',
                      }
                    : {
                        bar: session.isToday ? 'bg-blue-600' : 'bg-amber-500',
                        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
                        badgeText: 'Belum Presensi',
                        actionText: t('recordAttendance'),
                        actionStyle: 'text-blue-600 font-bold',
                      };

                  return (
                    <Link
                      key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                      href={isCancelled ? '#' : attendanceUrl}
                      className={`group relative flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs transition-all hover:border-blue-400 hover:shadow-md cursor-pointer ${
                        isCancelled ? 'opacity-70 pointer-events-none' : ''
                      }`}
                    >
                      {/* Left vertical accent indicator */}
                      <span
                        className={`absolute left-0 top-3.5 bottom-3.5 w-1.5 rounded-r-full ${statusConfig.bar}`}
                        aria-hidden="true"
                      />

                      <div className="pl-1.5 flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-700">
                              <Clock className="size-3.5 text-slate-500" />
                              {session.jamMulai} - {session.jamSelesai}
                            </span>
                            <span className="text-xs font-semibold text-slate-500">{session.jenjang}</span>
                          </div>
                          <h4 className="mt-2 text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {session.kelasNama}
                          </h4>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusConfig.badgeBg}`}>
                          {statusConfig.badgeText}
                        </span>
                      </div>

                      <div className="mt-3.5 pt-3 border-t border-slate-100 pl-1.5 flex items-center justify-between">
                        <span className="text-xs text-slate-500 tabular-nums">
                          {session.presensiCount}/{session.pesertaCount} {t('present')}
                        </span>
                        <span className={`text-xs font-bold inline-flex items-center gap-1.5 ${statusConfig.actionStyle}`}>
                          <span>{statusConfig.actionText}</span>
                          {!isCancelled && (
                            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                          )}
                        </span>
                      </div>
                    </Link>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. MODE B: MONTHLY FULL-GRID (Google Calendar / Notion)    */}
      {/* ========================================================= */}
      {viewMode === 'monthly' && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          {/* Day Headers (Mon - Sun) */}
          <div className="grid grid-cols-7 border-b border-slate-200 divide-x divide-slate-100 bg-slate-50/80 text-center">
            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => (
              <div key={day} className="py-2.5 text-xs font-extrabold uppercase tracking-wider text-slate-600">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 3)}</span>
              </div>
            ))}
          </div>

          {/* 35 / 42 Day Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 bg-slate-50/20">
            {monthGridDays.map((day, idx) => {
              const daySessions = sessionsByAnyDate.get(day.dateStr) ?? [];
              const hasSessions = daySessions.length > 0;

              return (
                <div
                  key={`${day.dateStr}-${idx}`}
                  onClick={() => {
                    if (hasSessions) {
                      setAnchorDateStr(day.dateStr);
                      setMobileSelectedDate(day.dateStr);
                      setViewMode('weekly');
                    }
                  }}
                  className={`min-h-[90px] sm:min-h-[115px] p-1.5 transition-colors flex flex-col justify-between ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-slate-50/60 text-slate-600'
                  } ${day.isToday ? 'bg-blue-50/30' : ''} ${
                    hasSessions ? 'cursor-pointer hover:bg-blue-50/20' : ''
                  }`}
                >
                  {/* Top Bar: Date Number + Pill */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`size-6 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${
                        day.isToday
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : day.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-600'
                      }`}
                    >
                      {day.dayNum}
                    </span>
                    {hasSessions && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[9px] font-extrabold text-slate-600 sm:hidden">
                        {daySessions.length}
                      </span>
                    )}
                  </div>

                  {/* Scheduled Sessions Chips */}
                  <div className="mt-1 space-y-1 overflow-hidden flex-1">
                    {daySessions.slice(0, 2).map((s) => {
                      const isFilled = s.presensiCount > 0;
                      const isCancelled = s.statusSesi === 'dibatalkan';

                      return (
                        <div
                          key={`${s.jadwalItemId}-${s.tanggalPertemuan}`}
                          title={`${s.jamMulai} ${s.kelasNama}`}
                          className={`hidden sm:flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold truncate border ${
                            isCancelled
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : isFilled
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          <span
                            className={`size-1.5 rounded-full shrink-0 ${
                              isCancelled
                                ? 'bg-rose-500'
                                : isFilled
                                ? 'bg-emerald-500'
                                : 'bg-blue-600'
                            }`}
                          />
                          <span className="tabular-nums font-bold shrink-0">{s.jamMulai}</span>
                          <span className="truncate">{s.kelasNama}</span>
                        </div>
                      );
                    })}

                    {daySessions.length > 2 && (
                      <span className="hidden sm:inline-block text-[9px] font-bold text-slate-500 pl-1">
                        +{daySessions.length - 2} lainnya
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. MODE C: COMPACT AGENDA LIST (High-Density List)        */}
      {/* ========================================================= */}
      {viewMode === 'agenda' && (
        <div className="space-y-4">
          {sessionsByDate.size === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-2xs">
              <p className="text-sm font-semibold text-slate-500">
                {t('noUpcomingSessions') || 'Tidak ada sesi pertemuan untuk filter ini.'}
              </p>
            </div>
          ) : (
            [...sessionsByDate.entries()].map(([dateStr, items]) => {
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
                <div
                  key={dateStr}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs"
                >
                  {/* Date Header */}
                  <div
                    className={`flex items-center justify-between border-b border-slate-100 px-4 py-2.5 ${
                      isDateToday ? 'bg-blue-50/80 text-blue-900 font-bold' : 'bg-slate-50/80 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-tight">
                        {dayName}, {fullDateFormatted}
                      </span>
                      {isDateToday && (
                        <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[9px] font-bold text-white">
                          {t('todayLabel') || 'HARI INI'}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 tabular-nums">
                      {items.length} Sesi
                    </span>
                  </div>

                  {/* Scannable Compact Rows */}
                  <div className="divide-y divide-slate-100">
                    {items.map((session) => {
                      const isCancelled = session.statusSesi === 'dibatalkan';
                      const isFilled = session.presensiCount > 0;
                      const attendanceUrl = `/teacher/classes/${session.kelasId}/sessions/${session.tanggalPertemuan}/attendance?sesi=${session.jadwalItemId}`;

                      const statusConfig = isCancelled
                        ? {
                            bar: 'bg-rose-500',
                            badgeBg: 'bg-rose-50 text-rose-700 border-rose-200/80',
                            badgeText: 'Batal',
                            actionText: t('sessionCancelled'),
                            actionStyle: 'text-rose-600',
                          }
                        : isFilled
                        ? {
                            bar: 'bg-emerald-500',
                            badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
                            badgeText: `${session.presensiCount}/${session.pesertaCount} Hadir`,
                            actionText: t('viewSession'),
                            actionStyle: 'text-slate-600 group-hover:text-blue-600',
                          }
                        : {
                            bar: session.isToday ? 'bg-blue-600' : 'bg-amber-500',
                            badgeBg: 'bg-amber-50 text-amber-800 border-amber-200/80',
                            badgeText: 'Belum Presensi',
                            actionText: t('recordAttendance'),
                            actionStyle: 'text-blue-600 font-bold',
                          };

                      return (
                        <Link
                          key={`${session.jadwalItemId}-${session.tanggalPertemuan}`}
                          href={isCancelled ? '#' : attendanceUrl}
                          className={`group relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer ${
                            isCancelled ? 'opacity-70 pointer-events-none' : ''
                          }`}
                        >
                          {/* Left vertical accent line */}
                          <span
                            className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition-all group-hover:w-1.5 ${statusConfig.bar}`}
                            aria-hidden="true"
                          />

                          {/* Left: Time + Class Name + Jenjang */}
                          <div className="flex items-center gap-3.5 min-w-0 pl-1">
                            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold tabular-nums text-slate-700">
                              <Clock className="size-3.5 text-slate-500" />
                              {session.jamMulai} - {session.jamSelesai}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                {session.kelasNama}
                              </p>
                              <p className="text-[11px] font-semibold text-slate-500">
                                {session.jenjang} • {session.pesertaCount} siswa
                              </p>
                            </div>
                          </div>

                          {/* Right: Status Pill + Action Link */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-1 sm:pl-0">
                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusConfig.badgeBg}`}>
                              {statusConfig.badgeText}
                            </span>

                            <span className={`text-xs font-bold inline-flex items-center gap-1.5 ${statusConfig.actionStyle}`}>
                              <span>{statusConfig.actionText}</span>
                              {!isCancelled && (
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                              )}
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
