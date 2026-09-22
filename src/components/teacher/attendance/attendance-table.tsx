'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useState, useMemo } from 'react';
import { savePresensi, type GuruState } from '@/app/actions/teacher';
import { AttendanceStickyBar } from './attendance-sticky-bar';
import {
  Search,
  Check,
  RotateCcw,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';

const initial: GuruState = {};
const STATUS_LIST = [
  { key: 'hadir', label: 'H', fullLabel: 'Hadir', tone: 'emerald' },
  { key: 'izin', label: 'I', fullLabel: 'Izin', tone: 'amber' },
  { key: 'sakit', label: 'S', fullLabel: 'Sakit', tone: 'blue' },
  { key: 'alpa', label: 'A', fullLabel: 'Alpa', tone: 'rose' },
] as const;

export type SiswaPresensi = {
  pendaftaranId: number;
  nama: string;
  status?: string;
  catatan?: string;
  terkunci: boolean;
};

interface AttendanceTableProps {
  kelasId: number;
  jadwalItemId: number;
  tanggal: string;
  siswa: SiswaPresensi[];
}

export function AttendanceTable({
  kelasId,
  jadwalItemId,
  tanggal,
  siswa,
}: AttendanceTableProps) {
  const t = useTranslations('teacher');
  const [state, formAction, pending] = useActionState(savePresensi, initial);

  const [search, setSearch] = useState('');
  const [statuses, setStatuses] = useState<Record<number, string | undefined>>(() => {
    const map: Record<number, string | undefined> = {};
    for (const s of siswa) {
      map[s.pendaftaranId] = s.status;
    }
    return map;
  });

  const counts = useMemo(() => {
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;
    let belumDiisi = 0;
    for (const s of siswa) {
      const st = statuses[s.pendaftaranId];
      if (st === 'hadir') hadir++;
      else if (st === 'izin') izin++;
      else if (st === 'sakit') sakit++;
      else if (st === 'alpa') alpa++;
      else belumDiisi++;
    }
    return { hadir, izin, sakit, alpa, belumDiisi };
  }, [siswa, statuses]);

  const filteredSiswa = useMemo(() => {
    if (!search.trim()) return siswa;
    const q = search.toLowerCase().trim();
    return siswa.filter((s) => s.nama.toLowerCase().includes(q));
  }, [siswa, search]);

  const handleMarkAllPresent = () => {
    setStatuses((prev) => {
      const next = { ...prev };
      for (const s of siswa) {
        if (!s.terkunci) {
          next[s.pendaftaranId] = 'hadir';
        }
      }
      return next;
    });
  };

  const handleClearAll = () => {
    setStatuses((prev) => {
      const next = { ...prev };
      for (const s of siswa) {
        if (!s.terkunci) {
          next[s.pendaftaranId] = undefined;
        }
      }
      return next;
    });
  };

  const handleStatusChange = (pendaftaranId: number, status: string) => {
    setStatuses((prev) => ({
      ...prev,
      [pendaftaranId]: status,
    }));
  };

  if (siswa.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-10 text-center">
        <p className="text-sm font-medium text-slate-500">{t('noSessionStudents')}</p>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="space-y-4">
      <input type="hidden" name="kelas_id" value={kelasId} />
      <input type="hidden" name="jadwal_item_id" value={jadwalItemId} />
      <input type="hidden" name="tanggal" value={tanggal} />

      {/* State Feedback Alerts */}
      {state.error ? (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
        >
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.ok && !state.error ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{t('attendanceSaved')}</span>
        </div>
      ) : null}

      {/* Control Toolbar: Quick Actions + Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllPresent}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100/80 active:scale-95 cursor-pointer"
          >
            <Check className="size-3.5 stroke-[2.5]" />
            <span>{t('markAllPresent')}</span>
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>{t('clearAll')}</span>
          </button>
        </div>

        {/* Live Search Input */}
        <div className="relative w-full sm:w-64">
          <label htmlFor="search-student" className="sr-only">
            Cari siswa
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            id="search-student"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama siswa..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-1.5 pl-9 pr-8 text-xs text-slate-900 transition-colors placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Spreadsheet Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th scope="col" className="w-12 px-4 py-3.5 text-center">
                  No
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Siswa
                </th>
                <th scope="col" className="w-64 px-4 py-3.5 text-center">
                  Status Kehadiran
                </th>
                <th scope="col" className="px-4 py-3.5">
                  {t('notesOptional')}
                </th>
                <th scope="col" className="w-24 px-4 py-3.5 text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSiswa.map((s, idx) => {
                const currentStatus = statuses[s.pendaftaranId];
                const initials = s.nama
                  .split(' ')
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase();

                return (
                  <tr
                    key={s.pendaftaranId}
                    className={`transition-colors hover:bg-slate-50/70 ${
                      s.terkunci ? 'bg-slate-50/40 opacity-85' : ''
                    }`}
                  >
                    {/* 1. Nomor */}
                    <td className="px-4 py-3 text-center font-medium text-slate-400 tabular-nums">
                      {idx + 1}
                    </td>

                    {/* 2. Nama Siswa */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-100/70 text-xs font-bold text-blue-700">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {s.nama}
                          </p>
                          {s.terkunci && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700">
                              <Lock className="size-2.5" />
                              {t('lockedAdminRule')}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* 3. Segmented Status Button Toggles (H, I, S, A) */}
                    <td className="px-4 py-3">
                      <fieldset
                        disabled={s.terkunci}
                        className="flex items-center justify-center gap-1.5"
                      >
                        <legend className="sr-only">
                          {t('attendanceStudentLabel', { name: s.nama })}
                        </legend>
                        {STATUS_LIST.map((st) => {
                          const isSelected = currentStatus === st.key;
                          return (
                            <label
                              key={st.key}
                              title={`${s.nama}: ${st.fullLabel}`}
                              className={`group relative flex size-9 cursor-pointer items-center justify-center rounded-xl text-xs font-extrabold transition-all select-none active:scale-95 ${
                                s.terkunci
                                  ? 'cursor-not-allowed opacity-50'
                                  : ''
                              } ${
                                isSelected
                                  ? st.tone === 'emerald'
                                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/30'
                                    : st.tone === 'amber'
                                      ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-500/30'
                                      : st.tone === 'blue'
                                        ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-500/30'
                                        : 'bg-rose-600 text-white shadow-xs ring-2 ring-rose-500/30'
                                  : st.tone === 'emerald'
                                    ? 'border border-emerald-200/80 bg-emerald-50/50 text-emerald-700 hover:bg-emerald-100/70'
                                    : st.tone === 'amber'
                                      ? 'border border-amber-200/80 bg-amber-50/50 text-amber-700 hover:bg-amber-100/70'
                                      : st.tone === 'blue'
                                        ? 'border border-blue-200/80 bg-blue-50/50 text-blue-700 hover:bg-blue-100/70'
                                        : 'border border-rose-200/80 bg-rose-50/50 text-rose-700 hover:bg-rose-100/70'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`presensi_${s.pendaftaranId}`}
                                value={st.key}
                                checked={isSelected}
                                onChange={() =>
                                  handleStatusChange(s.pendaftaranId, st.key)
                                }
                                disabled={s.terkunci}
                                className="sr-only"
                              />
                              <span>{st.label}</span>
                            </label>
                          );
                        })}
                      </fieldset>
                    </td>

                    {/* 4. Inline Catatan Khusus Input */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        name={`catatan_${s.pendaftaranId}`}
                        defaultValue={s.catatan ?? ''}
                        disabled={s.terkunci}
                        placeholder={t('notesPlaceholder')}
                        className="w-full rounded-lg border border-slate-200/90 bg-slate-50/40 px-3 py-1.5 text-xs text-slate-800 transition-colors placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/20 disabled:bg-slate-100/60 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* 5. Status Icon Indicator */}
                    <td className="px-4 py-3 text-center">
                      {s.terkunci ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          <Lock className="size-2.5" />
                          Kunci
                        </span>
                      ) : currentStatus ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold capitalize text-slate-700">
                          <span
                            className={`size-2 rounded-full ${
                              currentStatus === 'hadir'
                                ? 'bg-emerald-500'
                                : currentStatus === 'izin'
                                  ? 'bg-amber-500'
                                  : currentStatus === 'sakit'
                                    ? 'bg-blue-500'
                                    : 'bg-rose-500'
                            }`}
                          />
                          {t(`status_${currentStatus}`)}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-sm font-semibold">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSiswa.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-500">
            Tidak ada siswa yang cocok dengan pencarian "{search}".
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 leading-relaxed px-1">
        {t('attendanceFormHelp')}
      </p>

      {/* Floating Bottom Sticky Action Bar */}
      <AttendanceStickyBar counts={counts} pending={pending} />
    </form>
  );
}
