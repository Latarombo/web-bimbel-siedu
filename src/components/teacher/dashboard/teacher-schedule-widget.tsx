'use client';

import { useState, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  ClipboardCheck,
  Calendar as CalendarIcon,
  BookOpen,
} from 'lucide-react';

export interface ScheduleSessionItem {
  id: number;
  kelasId: number;
  kelasNama: string;
  mapel: string;
  jenjang: 'TK' | 'SD' | 'SMP' | 'SMA';
  tingkat?: string | null;
  hari: string; // "Senin", "Selasa", dll
  jamMulai: string; // "16:00"
  jamSelesai: string; // "17:30"
  totalSiswa: number;
  terisiCount: number;
  periodeMulai: string; // "YYYY-MM-DD"
  periodeSelesai: string; // "YYYY-MM-DD"
}

interface TeacherScheduleWidgetProps {
  sessions: ScheduleSessionItem[];
  todayStr: string; // "YYYY-MM-DD"
  locale?: string;
}

const HARI_MAP: Record<number, string> = {
  0: 'Minggu',
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

const JENJANG_TEMA: Record<string, { badge: string; text: string; border: string }> = {
  TK: { badge: 'bg-pink-50 text-pink-700 border-pink-200', text: 'text-pink-600', border: 'border-l-pink-500' },
  SD: { badge: 'bg-blue-50 text-blue-700 border-blue-200', text: 'text-blue-600', border: 'border-l-blue-500' },
  SMP: { badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', text: 'text-emerald-600', border: 'border-l-emerald-500' },
  SMA: { badge: 'bg-amber-50 text-amber-800 border-amber-200', text: 'text-amber-600', border: 'border-l-amber-500' },
};

export function TeacherScheduleWidget({
  sessions,
  todayStr,
  locale = 'id',
}: TeacherScheduleWidgetProps) {
  // Selected date state, defaults to today
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Month navigation state
  const initialDate = useMemo(() => new Date(todayStr + 'T00:00:00'), [todayStr]);
  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth()); // 0 - 11

  // Month label
  const monthName = useMemo(() => {
    const d = new Date(currentYear, currentMonth, 1);
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', {
      month: 'long',
      year: 'numeric',
    });
  }, [currentYear, currentMonth, locale]);

  // Calendar grid calculations
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days: Array<{
      dateStr: string;
      dayNum: number;
      isCurrentMonth: boolean;
      hasSchedule: boolean;
    }> = [];

    // Preceding padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum,
        isCurrentMonth: false,
        hasSchedule: checkHasSchedule(dateStr, sessions),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: true,
        hasSchedule: checkHasSchedule(dateStr, sessions),
      });
    }

    // Trailing padding days to fill 35 or 42 grid slots
    const totalCells = days.length > 35 ? 42 : 35;
    const remaining = totalCells - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dateStr,
        dayNum: d,
        isCurrentMonth: false,
        hasSchedule: checkHasSchedule(dateStr, sessions),
      });
    }

    return days;
  }, [currentYear, currentMonth, sessions]);

  function checkHasSchedule(dateStr: string, sessionList: ScheduleSessionItem[]): boolean {
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
    const hariNama = HARI_MAP[dayOfWeek];
    return sessionList.some((s) => {
      if (s.hari !== hariNama) return false;
      return dateStr >= s.periodeMulai && dateStr <= s.periodeSelesai;
    });
  }

  // Prev / Next month handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Sessions for the currently selected date
  const activeSessionsForDate = useMemo(() => {
    const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay();
    const hariNama = HARI_MAP[dayOfWeek];
    return sessions
      .filter((s) => {
        if (s.hari !== hariNama) return false;
        return selectedDate >= s.periodeMulai && selectedDate <= s.periodeSelesai;
      })
      .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));
  }, [selectedDate, sessions]);

  // Selected date formatted for display
  const selectedDateLabel = useMemo(() => {
    if (selectedDate === todayStr) return 'Hari Ini';
    const d = new Date(selectedDate + 'T00:00:00');
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  }, [selectedDate, todayStr, locale]);

  return (
    <div className="space-y-5">
      {/* ========================================================= */}
      {/* 1. MINI CALENDAR MONTH WIDGET (Clean, Interactive)        */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        {/* Calendar Header: Month + Controls */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-extrabold capitalize text-slate-800 tracking-tight">
            {monthName}
          </h2>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Bulan sebelumnya"
              className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date(todayStr + 'T00:00:00');
                setCurrentYear(now.getFullYear());
                setCurrentMonth(now.getMonth());
                setSelectedDate(todayStr);
              }}
              className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title="Kembali ke hari ini"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Bulan berikutnya"
              className="grid size-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 pt-3 text-center">
          {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((day, idx) => (
            <div
              key={idx}
              className={`text-[11px] font-bold ${
                idx === 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1 pt-1.5">
          {calendarDays.map((item, idx) => {
            const isSelected = item.dateStr === selectedDate;
            const isToday = item.dateStr === todayStr;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedDate(item.dateStr)}
                className={`group relative flex h-8 w-full flex-col items-center justify-center rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/30 ring-2 ring-blue-600/20'
                    : isToday
                    ? 'bg-blue-50 text-blue-600 font-bold ring-1 ring-blue-200'
                    : item.isCurrentMonth
                    ? 'text-slate-700 hover:bg-slate-50'
                    : 'text-slate-300 hover:text-slate-400'
                }`}
              >
                <span>{item.dayNum}</span>

                {/* Schedule indicator dot */}
                {item.hasSchedule && (
                  <span
                    aria-hidden="true"
                    className={`absolute bottom-1 size-1 rounded-full ${
                      isSelected
                        ? 'bg-white'
                        : isToday
                        ? 'bg-blue-600'
                        : 'bg-blue-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. TIMELINE SESI MENGAJAR (Upcoming Lessons)               */}
      {/* ========================================================= */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-[0_2px_12px_rgba(0,0,0,0.03)] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="grid size-7 place-items-center rounded-lg bg-blue-50 text-blue-600">
              <Clock className="size-4 stroke-[2]" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              Sesi Mengajar
            </h3>
          </div>
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
            {selectedDateLabel}
          </span>
        </div>

        {/* Sessions list */}
        {activeSessionsForDate.length > 0 ? (
          <div className="space-y-3">
            {activeSessionsForDate.map((session) => {
              const tema = JENJANG_TEMA[session.jenjang] || JENJANG_TEMA.SD;
              const isPast = selectedDate < todayStr;
              const isToday = selectedDate === todayStr;
              const isAttendanceDone = session.terisiCount > 0 && session.terisiCount >= session.totalSiswa;

              return (
                <div
                  key={session.id}
                  className={`relative rounded-xl border border-slate-100 bg-slate-50/50 p-3.5 pl-4 border-l-4 ${tema.border} transition-all hover:bg-white hover:shadow-sm space-y-2.5`}
                >
                  {/* Time + Jenjang Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <Clock className="size-3.5 text-slate-400" />
                      {session.jamMulai} - {session.jamSelesai} WIB
                    </span>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${tema.badge}`}
                    >
                      {session.jenjang} {session.tingkat ? `· ${session.tingkat}` : ''}
                    </span>
                  </div>

                  {/* Class & Subject */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                      {session.mapel}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {session.kelasNama} · {session.totalSiswa} Siswa
                    </p>
                  </div>

                  {/* Action or Attendance Status */}
                  <div className="pt-1 flex items-center justify-between gap-2">
                    {isToday ? (
                      isAttendanceDone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-lg">
                          <Check className="size-3 stroke-[2.5]" />
                          Presensi Selesai ({session.terisiCount}/{session.totalSiswa})
                        </span>
                      ) : (
                        <Link
                          href={`/teacher/classes/${session.kelasId}/sessions/${selectedDate}/attendance`}
                          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#f26d0f] hover:bg-[#d95f09] px-3 py-1.5 text-xs font-bold text-white shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <ClipboardCheck className="size-3.5" />
                          <span>Catat Presensi</span>
                        </Link>
                      )
                    ) : isPast ? (
                      isAttendanceDone ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                          <Check className="size-3 stroke-[2.5]" />
                          Selesai ({session.terisiCount}/{session.totalSiswa})
                        </span>
                      ) : (
                        <Link
                          href={`/teacher/classes/${session.kelasId}/sessions/${selectedDate}/attendance`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg hover:bg-amber-100 transition-colors"
                        >
                          <ClipboardCheck className="size-3" />
                          Belum Presensi
                        </Link>
                      )
                    ) : (
                      <span className="text-[11px] font-semibold text-slate-400">
                        Terjadwal
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty state for selected date */
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="grid size-12 place-items-center rounded-2xl bg-slate-50 text-slate-400 mb-2">
              <CalendarIcon className="size-6 stroke-[1.5]" />
            </div>
            <p className="text-xs font-bold text-slate-700">
              Tidak ada jadwal
            </p>
            <p className="text-[11px] text-slate-400 max-w-[200px] mt-0.5">
              Pilih tanggal bertanda di kalender untuk melihat sesi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
