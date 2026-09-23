'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsUpDown, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DatePickerProps {
    id?: string;
    name?: string;
    value?: string; // Format: YYYY-MM-DD
    defaultValue?: string;
    onChange?: (date: string) => void;
    min?: string; // Format: YYYY-MM-DD
    max?: string; // Format: YYYY-MM-DD
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    ariaInvalid?: boolean;
    ariaDescribedby?: string;
    className?: string;
    locale?: string;
}

const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MONTHS_EN = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAYS_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function parseISODate(isoString?: string): { year: number; month: number; day: number } | null {
    if (!isoString) return null;
    const parts = isoString.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed
    const day = parseInt(parts[2], 10);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    return { year, month, day };
}

function formatDisplayDate(isoString: string, isEn: boolean): string {
    const parsed = parseISODate(isoString);
    if (!parsed) return '';
    const months = isEn ? MONTHS_EN : MONTHS_ID;
    const monthName = months[parsed.month];
    if (isEn) {
        return `${monthName} ${parsed.day}, ${parsed.year}`;
    }
    return `${parsed.day} ${monthName} ${parsed.year}`;
}

export function DatePicker({
    id,
    name,
    value: controlledValue,
    defaultValue,
    onChange,
    min,
    max,
    placeholder,
    required = false,
    disabled = false,
    ariaInvalid,
    ariaDescribedby,
    className,
    locale = 'id',
}: DatePickerProps) {
    const generatedId = useId();
    const inputId = id || generatedId;
    const isControlled = controlledValue !== undefined;

    const [internalValue, setInternalValue] = useState<string>(
        controlledValue ?? defaultValue ?? ''
    );

    const selectedValue = isControlled ? (controlledValue ?? '') : internalValue;

    // Mode tampilan: 'calendar' atau 'years'
    const [viewMode, setViewMode] = useState<'calendar' | 'years'>('calendar');
    const [isOpen, setIsOpen] = useState(false);

    // Initial calendar page view
    const initialParsed = parseISODate(selectedValue);
    const today = new Date();
    const [currentYear, setCurrentYear] = useState<number>(
        initialParsed?.year ?? today.getFullYear()
    );
    const [currentMonth, setCurrentMonth] = useState<number>(
        initialParsed?.month ?? today.getMonth()
    );

    // Sinkronisasi view saat selectedValue berubah
    useEffect(() => {
        if (selectedValue) {
            const parsed = parseISODate(selectedValue);
            if (parsed) {
                setCurrentYear(parsed.year);
                setCurrentMonth(parsed.month);
            }
        }
    }, [selectedValue]);

    const isEn = locale.toLowerCase().startsWith('en');
    const months = isEn ? MONTHS_EN : MONTHS_ID;
    const daysHeader = isEn ? DAYS_EN : DAYS_ID;
    const defaultPlaceholder = placeholder || (isEn ? 'Pick a date' : 'Pilih tanggal');

    const containerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const yearListRef = useRef<HTMLDivElement>(null);

    // Auto-scroll ke tahun yang sedang aktif saat mode pemilihan tahun dibuka (hanya internal container agar window tidak melompat)
    useEffect(() => {
        if (viewMode === 'years' && yearListRef.current) {
            const listEl = yearListRef.current;
            const activeBtn = listEl.querySelector<HTMLElement>('[data-selected="true"]');
            if (activeBtn) {
                const activeOffset = activeBtn.offsetTop - listEl.offsetTop;
                const targetScroll = activeOffset - (listEl.clientHeight - activeBtn.clientHeight) / 2;
                listEl.scrollTop = Math.max(0, targetScroll);
            }
        }
    }, [viewMode]);

    // Handle wheel scrolling over popover agar kursor di atas kalender maupun daftar tahun tidak memicu scroll window
    useEffect(() => {
        const popoverEl = popoverRef.current;
        if (!isOpen || !popoverEl) return;

        const onWheel = (e: WheelEvent) => {
            const listEl = yearListRef.current;
            if (viewMode === 'years' && listEl) {
                const canScrollUp = listEl.scrollTop > 0;
                const canScrollDown = listEl.scrollTop < listEl.scrollHeight - listEl.clientHeight - 1;

                if (e.deltaY < 0 && canScrollUp) {
                    listEl.scrollTop += e.deltaY;
                } else if (e.deltaY > 0 && canScrollDown) {
                    listEl.scrollTop += e.deltaY;
                }
            }
            // Selalu hentikan dan cegah scroll tembus ke body / window
            e.preventDefault();
            e.stopPropagation();
        };

        popoverEl.addEventListener('wheel', onWheel, { passive: false });
        return () => {
            popoverEl.removeEventListener('wheel', onWheel);
        };
    }, [isOpen, viewMode]);

    // Tutup saat klik di luar
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
                setViewMode('calendar');
            }
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setIsOpen(false);
                setViewMode('calendar');
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    const handleSelectDate = (year: number, month: number, day: number) => {
        const formatted = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (!isControlled) {
            setInternalValue(formatted);
        }
        onChange?.(formatted);
        setIsOpen(false);
        setViewMode('calendar');
    };

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear((prev) => prev - 1);
        } else {
            setCurrentMonth((prev) => prev - 1);
        }
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear((prev) => prev + 1);
        } else {
            setCurrentMonth((prev) => prev + 1);
        }
    };

    // Hari ini
    const todayDate = today.getDate();
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();

    // Validasi min & max
    const minParsed = parseISODate(min);
    const maxParsed = parseISODate(max);

    const isDateDisabled = (year: number, month: number, day: number) => {
        const d = new Date(year, month, day);
        if (maxParsed) {
            const maxDate = new Date(maxParsed.year, maxParsed.month, maxParsed.day);
            if (d > maxDate) return true;
        }
        if (minParsed) {
            const minDate = new Date(minParsed.year, minParsed.month, minParsed.day);
            if (d < minDate) return true;
        }
        return false;
    };

    // Generate grid tanggal untuk bulan aktif
    const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Minggu

    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    // 42 cells (6 minggu x 7 hari) agar tinggi stabil persis referensi
    const totalCells = 42;
    const calendarDays = [];

    // Hari dari bulan sebelumnya
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        calendarDays.push({
            day,
            month: prevMonth,
            year: prevYear,
            isCurrentMonth: false,
            disabled: isDateDisabled(prevYear, prevMonth, day),
        });
    }

    // Hari bulan saat ini
    for (let i = 1; i <= daysInCurrentMonth; i++) {
        calendarDays.push({
            day: i,
            month: currentMonth,
            year: currentYear,
            isCurrentMonth: true,
            disabled: isDateDisabled(currentYear, currentMonth, i),
        });
    }

    // Hari bulan berikutnya untuk melengkapi 42 sel
    const remainingCells = totalCells - calendarDays.length;
    for (let i = 1; i <= remainingCells; i++) {
        const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
        const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
        calendarDays.push({
            day: i,
            month: nextMonth,
            year: nextYear,
            isCurrentMonth: false,
            disabled: isDateDisabled(nextYear, nextMonth, i),
        });
    }

    const selectedParsed = parseISODate(selectedValue);

    // List rentang tahun untuk navigasi cepat (usia 0 s.d 40 tahun)
    const currentSystemYear = today.getFullYear();
    const availableYears: number[] = [];
    for (let y = currentSystemYear; y >= currentSystemYear - 40; y--) {
        availableYears.push(y);
    }

    return (
        <div ref={containerRef} className={cn('relative w-full', className)}>
            {/* Hidden input untuk integrasi formulir native / Server Action */}
            {name && (
                <input
                    type="hidden"
                    name={name}
                    value={selectedValue}
                    required={required}
                />
            )}

            {/* Input Trigger Button (Desain persis screenshot) */}
            <button
                id={inputId}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (!disabled) {
                        setIsOpen((prev) => !prev);
                        setViewMode('calendar');
                    }
                }}
                aria-haspopup="dialog"
                aria-expanded={isOpen}
                aria-invalid={ariaInvalid}
                aria-describedby={ariaDescribedby}
                className={cn(
                    'w-full flex items-center justify-between px-3.5 py-3 text-base text-left rounded-xl transition-all duration-200 cursor-pointer select-none bg-white',
                    'border border-slate-200 hover:border-slate-300',
                    isOpen
                        ? 'border-blue-400 ring-4 ring-blue-100 shadow-xs'
                        : 'focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100',
                    disabled && 'bg-slate-50 opacity-60 cursor-not-allowed pointer-events-none',
                    ariaInvalid && 'border-rose-400 focus:ring-rose-100'
                )}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <CalendarIcon className="w-5 h-5 text-slate-400 shrink-0" aria-hidden="true" />
                    <span
                        className={cn(
                            'truncate',
                            selectedValue ? 'text-slate-800 font-medium' : 'text-slate-400'
                        )}
                    >
                        {selectedValue
                            ? formatDisplayDate(selectedValue, isEn)
                            : defaultPlaceholder}
                    </span>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-slate-400 shrink-0 ml-2" aria-hidden="true" />
            </button>

            {/* Popover Card & Mobile Bottom Sheet */}
            {isOpen && (
                <>
                    {/* Mobile Backdrop (< 640px) */}
                    <div
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 sm:hidden transition-opacity"
                        onClick={() => {
                            setIsOpen(false);
                            setViewMode('calendar');
                        }}
                    />

                    {/* Popover / Sheet Content */}
                    <div
                        ref={popoverRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Pilih Tanggal"
                        data-lenis-prevent
                        className={cn(
                            // Base styling
                            'bg-white z-50 transition-all overscroll-contain',
                            // Mobile (<640px): Bottom Sheet Modal
                            'fixed inset-x-0 bottom-0 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto sm:max-h-none sm:overflow-visible shadow-2xl',
                            // Desktop (>=640px): Popover Dropdown
                            'sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-2 sm:w-[328px] sm:rounded-2xl sm:p-4 sm:border sm:border-slate-200 sm:shadow-xl sm:shadow-slate-950/20'
                        )}
                    >
                        {/* Mobile Handle & Close Bar */}
                        <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 sm:hidden">
                            <span className="font-semibold text-slate-800 text-base">
                                {isEn ? 'Pick a Date' : 'Pilih Tanggal'}
                            </span>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Calendar Header (Prev, Month Year Button, Next) */}
                        <div className="flex items-center justify-between mb-4">
                            <button
                                type="button"
                                onClick={handlePrevMonth}
                                disabled={viewMode !== 'calendar'}
                                aria-label="Bulan sebelumnya"
                                className={cn(
                                    'w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer',
                                    viewMode !== 'calendar' && 'opacity-0 pointer-events-none'
                                )}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            {/* Klik teks Bulan Tahun untuk membuka pemilih cepat tahun */}
                            <button
                                type="button"
                                onClick={() => {
                                    setViewMode((prev) => (prev === 'calendar' ? 'years' : 'calendar'));
                                }}
                                className="text-base font-semibold text-slate-900 px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer group"
                            >
                                <span>
                                    {months[currentMonth]} {currentYear}
                                </span>
                                <ChevronDown
                                    className={cn(
                                        'w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform duration-200',
                                        viewMode === 'years' && 'rotate-180 text-blue-600'
                                    )}
                                    aria-hidden="true"
                                />
                            </button>

                            <button
                                type="button"
                                onClick={handleNextMonth}
                                disabled={viewMode !== 'calendar'}
                                aria-label="Bulan berikutnya"
                                className={cn(
                                    'w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer',
                                    viewMode !== 'calendar' && 'opacity-0 pointer-events-none'
                                )}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        {/* View 1: Calendar Day Grid (Tampilan Utama Persis Screenshot) */}
                        {viewMode === 'calendar' && (
                            <>
                                {/* Weekdays Header (Su, Mo, Tu, We, Th, Fr, Sa) */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {daysHeader.map((d, index) => (
                                        <div
                                            key={index}
                                            className="text-center text-xs font-semibold text-slate-400 py-1"
                                        >
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                {/* Days Grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarDays.map((cell, idx) => {
                                        const isSelected =
                                            selectedParsed &&
                                            selectedParsed.year === cell.year &&
                                            selectedParsed.month === cell.month &&
                                            selectedParsed.day === cell.day;

                                        const isToday =
                                            cell.year === todayYear &&
                                            cell.month === todayMonth &&
                                            cell.day === todayDate;

                                        return (
                                            <button
                                                key={idx}
                                                type="button"
                                                disabled={cell.disabled}
                                                onClick={() =>
                                                    handleSelectDate(cell.year, cell.month, cell.day)
                                                }
                                                className={cn(
                                                    'relative h-10 w-full rounded-xl flex flex-col items-center justify-center text-sm transition-all duration-150 cursor-pointer select-none',
                                                    // Bulan lain (faded)
                                                    !cell.isCurrentMonth &&
                                                        'text-slate-300 font-normal',
                                                    // Bulan ini
                                                    cell.isCurrentMonth &&
                                                        !isSelected &&
                                                        !isToday &&
                                                        'text-slate-800 font-medium hover:bg-slate-100',
                                                    // Hari ini (Today) — persis tanggal 4 di screenshot: pill abu-abu lembut + aksen dot
                                                    isToday &&
                                                        !isSelected &&
                                                        'bg-slate-100 font-semibold text-slate-900',
                                                    // Terpilih (Selected) — persis tanggal 8 di screenshot: rounded rectangle biru cerah
                                                    isSelected &&
                                                        'bg-blue-600 text-white font-semibold rounded-xl shadow-sm hover:bg-blue-700',
                                                    // Tanggal dinonaktifkan (misal masa depan)
                                                    cell.disabled &&
                                                        'opacity-30 cursor-not-allowed hover:bg-transparent pointer-events-none'
                                                )}
                                            >
                                                <span>{cell.day}</span>
                                                {/* Dot indicator untuk Today */}
                                                {isToday && !isSelected && (
                                                    <span className="w-1 h-1 rounded-full bg-slate-400 -mt-0.5" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        {/* View 2: Quick Year Selector */}
                        {viewMode === 'years' && (
                            <div className="flex flex-col h-[288px]">
                                <div className="flex items-center justify-between mb-2.5 px-1 shrink-0">
                                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        {isEn ? 'Select Year' : 'Pilih Tahun'}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {availableYears[availableYears.length - 1]} – {availableYears[0]}
                                    </span>
                                </div>
                                <div
                                    ref={yearListRef}
                                    data-lenis-prevent
                                    className="relative grid grid-cols-4 gap-2 grow min-h-0 overflow-y-auto overscroll-contain pr-1.5 pb-2 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
                                >
                                    {availableYears.map((yr) => {
                                        const isSelectedYear = yr === currentYear;
                                        return (
                                            <button
                                                key={yr}
                                                type="button"
                                                data-selected={isSelectedYear ? 'true' : undefined}
                                                onClick={() => {
                                                    setCurrentYear(yr);
                                                    setViewMode('calendar');
                                                }}
                                                className={cn(
                                                    'py-2 text-sm font-medium rounded-xl text-center transition-all cursor-pointer select-none',
                                                    isSelectedYear
                                                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                                                        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200'
                                                )}
                                            >
                                                {yr}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
