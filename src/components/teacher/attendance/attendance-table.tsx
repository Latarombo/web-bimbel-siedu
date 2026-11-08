'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useState, useMemo } from 'react';
import { savePresensi, type GuruState } from '@/app/actions/teacher';
import { StudentAvatar } from '@/components/parent/student-avatar';
import {
  Search,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
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
  anakId?: number;
  jenjangTerakhir?: string | null;
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
      <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
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
          className="flex items-center gap-2.5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800"
        >
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.ok && !state.error ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{t('attendanceSaved')}</span>
        </div>
      ) : null}

      {/* Spreadsheet Table Container with Integrated Toolbar & Footer */}
      <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        {/* Integrated Control Toolbar: Quick Actions + Search Bar */}
        <div className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white cursor-pointer"
            >
              <span>{t('markAllPresent')}</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white cursor-pointer"
            >
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
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 pl-9 pr-8 text-xs text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <th scope="col" className="w-12 px-4 py-3 text-center">
                  No
                </th>
                <th scope="col" className="px-4 py-3">
                  Siswa
                </th>
                <th scope="col" className="w-64 px-4 py-3 text-center">
                  Status Kehadiran
                </th>
                <th scope="col" className="px-4 py-3">
                  {t('notesOptional')}
                </th>
                <th scope="col" className="w-28 px-4 py-3 text-center">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredSiswa.map((s, idx) => {
                const currentStatus = statuses[s.pendaftaranId];

                return (
                  <tr
                    key={s.pendaftaranId}
                    className={`transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                      s.terkunci ? 'bg-slate-50/50 dark:bg-slate-800/30 opacity-85' : ''
                    }`}
                  >
                    {/* 1. Nomor */}
                    <td className="px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400 tabular-nums">
                      {idx + 1}
                    </td>

                    {/* 2. Nama Siswa */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <StudentAvatar
                          nama={s.nama}
                          jenjang={s.jenjangTerakhir}
                          size="xs"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-950 dark:text-slate-50 truncate">
                            {s.nama}
                          </p>
                          {s.terkunci && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                              <Lock className="size-3" />
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
                              className={`group relative flex size-8 cursor-pointer items-center justify-center rounded-md text-xs font-bold transition-all select-none active:scale-95 ${
                                s.terkunci
                                  ? 'cursor-not-allowed opacity-50'
                                  : ''
                              } ${
                                isSelected
                                  ? st.tone === 'emerald'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : st.tone === 'amber'
                                      ? 'bg-amber-500 text-white shadow-xs'
                                      : st.tone === 'blue'
                                        ? 'bg-blue-600 text-white shadow-xs'
                                        : 'bg-rose-600 text-white shadow-xs'
                                  : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white'
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
                        className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 transition-colors placeholder:text-slate-500 dark:placeholder:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* 5. Status Icon Indicator */}
                    <td className="px-4 py-3 text-center">
                      {s.terkunci ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-1.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                          <Lock className="size-3" />
                          Kunci
                        </span>
                      ) : currentStatus ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold capitalize text-slate-800 dark:text-slate-200">
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
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredSiswa.length === 0 && (
          <div className="p-8 text-center text-xs text-slate-600 dark:text-slate-400">
            Tidak ada siswa yang cocok dengan pencarian &quot;{search}&quot;.
          </div>
        )}

        {/* Integrated Form Footer (Embedded Footer, Replaces Sticky Floating Bar) */}
        <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 sm:p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            {counts.belumDiisi > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                {counts.belumDiisi} dari {siswa.length} siswa belum diisi presensi
              </span>
            ) : (
              <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                Semua siswa ({siswa.length}) telah terisi presensi
              </span>
            )}
            <span className="mx-2 text-slate-300 dark:text-slate-600 hidden sm:inline">·</span>
            <span className="text-slate-500 dark:text-slate-400 block sm:inline mt-0.5 sm:mt-0">
              Hadir: {counts.hadir} · Izin: {counts.izin} · Sakit: {counts.sakit} · Alpa: {counts.alpa}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex min-h-10 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  <span>{t('saving')}</span>
                </>
              ) : (
                <span>{t('saveAttendance')}</span>
              )}
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed px-1">
        {t('attendanceFormHelp')}
      </p>
    </form>
  );
}
