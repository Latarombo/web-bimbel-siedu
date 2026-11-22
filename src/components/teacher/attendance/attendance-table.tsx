'use client';

import { useTranslations } from 'next-intl';
import { useActionState, useState, useMemo } from 'react';
import { Link } from '@/i18n/navigation';
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
  presensiId?: number;
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
  const [notes, setNotes] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const s of siswa) {
      map[s.pendaftaranId] = s.catatan ?? '';
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

      {/* Hidden inputs to guarantee single source of truth when submitting form */}
      {siswa.map((s) => (
        <div key={s.pendaftaranId} className="hidden">
          <input
            type="hidden"
            name={`presensi_${s.pendaftaranId}`}
            value={statuses[s.pendaftaranId] ?? ''}
          />
          <input
            type="hidden"
            name={`catatan_${s.pendaftaranId}`}
            value={notes[s.pendaftaranId] ?? ''}
          />
        </div>
      ))}

      {/* State Feedback Alerts */}
      {state.error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-800"
        >
          <AlertCircle className="size-4 shrink-0 text-rose-600" />
          <span>{state.error}</span>
        </div>
      ) : null}

      {state.ok && !state.error ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-800"
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
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white cursor-pointer"
            >
              <span>{t('markAllPresent')}</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-950 dark:hover:text-white cursor-pointer"
            >
              <span>{t('clearAll')}</span>
            </button>
          </div>

          {/* Live Search Input */}
          <div className="relative w-full sm:w-64">
            <label htmlFor="search-student" className="sr-only">
              Cari siswa
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              id="search-student"
              type="search"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa…"
              className="h-10 sm:h-9 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-8 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Hapus filter nama siswa"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Table View (>= md) */}
        <div
          tabIndex={0}
          role="region"
          aria-label="Tabel presensi pertemuan siswa"
          className="hidden md:block overflow-x-auto overscroll-x-contain focus:outline-hidden focus:ring-1 focus:ring-brand/30"
        >
          <table className="w-full min-w-[700px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                <th scope="col" className="sticky left-0 z-20 w-12 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center">
                  No
                </th>
                <th scope="col" className="sticky left-12 z-20 min-w-[150px] max-w-[220px] bg-slate-50 dark:bg-slate-800 px-4 py-3 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                  Siswa
                </th>
                <th scope="col" className="w-64 px-4 py-3 text-center">
                  Status Kehadiran
                </th>
                <th scope="col" className="min-w-[200px] px-4 py-3">
                  {t('notesOptional')}
                </th>
                <th scope="col" className="sticky right-0 z-20 w-32 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-center border-l border-slate-200/80 dark:border-slate-800/80 shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredSiswa.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    Tidak ada siswa yang cocok dengan pencarian &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                filteredSiswa.map((s, idx) => {
                  const currentStatus = statuses[s.pendaftaranId];

                  return (
                    <tr
                      key={s.pendaftaranId}
                      className={`group/row relative transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 ${
                        s.terkunci ? 'bg-slate-50/50 dark:bg-slate-800/30 opacity-85' : ''
                      }`}
                    >
                      {/* 1. Nomor (Sticky Left 0) */}
                      <td className="sticky left-0 z-10 w-12 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center font-medium text-slate-600 dark:text-slate-400 tabular-nums transition-colors">
                        {idx + 1}
                      </td>

                      {/* 2. Nama Siswa (Sticky Left 12) */}
                      <td className="sticky left-12 z-10 min-w-[150px] max-w-[220px] bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 border-r border-slate-200/80 dark:border-slate-800/80 shadow-[2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                        <span className="font-semibold text-slate-950 dark:text-slate-50 truncate block" title={s.nama}>
                          {s.nama}
                        </span>
                      </td>

                    {/* 3. Segmented Status Button Toggles (H, I, S, A) */}
                    <td className="px-4 py-3">
                      <fieldset
                        disabled={s.terkunci}
                        className="flex items-center justify-center gap-2"
                      >
                        <legend className="sr-only">
                          {t('attendanceStudentLabel', { name: s.nama })}
                        </legend>
                        {STATUS_LIST.map((st) => {
                          const isSelected = currentStatus === st.key;
                          return (
                            <button
                              key={st.key}
                              type="button"
                              disabled={s.terkunci}
                              onClick={() => handleStatusChange(s.pendaftaranId, st.key)}
                              title={`${s.nama}: ${st.fullLabel}`}
                              className={`group relative flex size-9 cursor-pointer items-center justify-center rounded-md text-xs font-bold transition-all select-none active:scale-95 ${
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
                              <span>{st.label}</span>
                            </button>
                          );
                        })}
                      </fieldset>
                    </td>

                    {/* 4. Inline Catatan Khusus Input */}
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        maxLength={255}
                        aria-label={`Catatan presensi untuk ${s.nama}`}
                        value={notes[s.pendaftaranId] ?? ''}
                        onChange={(e) =>
                          setNotes((prev) => ({
                            ...prev,
                            [s.pendaftaranId]: e.target.value,
                          }))
                        }
                        disabled={s.terkunci}
                        placeholder={t('notesPlaceholder')}
                        className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base sm:text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
                      />
                    </td>

                    {/* 5. Status Indicator (Sticky Right 0) */}
                    <td className="sticky right-0 z-10 w-32 bg-white dark:bg-slate-900 group-hover/row:bg-slate-50/90 dark:group-hover/row:bg-slate-800/50 px-4 py-3 text-center border-l border-slate-200/80 dark:border-slate-800/80 shadow-[-2px_0_5px_-2px_rgba(15,23,42,0.06)] transition-colors">
                      {s.terkunci ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                            <Lock className="size-3" />
                            Kunci
                          </span>
                          {s.presensiId ? (
                            <div className="opacity-70 group-hover/row:opacity-100 focus-within:opacity-100 transition-opacity max-sm:opacity-100">
                              <Link
                                href={`/teacher/corrections?entitas=presensi&id=${s.presensiId}`}
                                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                Ajukan Koreksi
                              </Link>
                            </div>
                          ) : null}
                        </div>
                      ) : currentStatus ? (
                        <span className="inline-flex items-center gap-2 text-xs font-semibold capitalize text-slate-800 dark:text-slate-200">
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
              })
            )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View (< md) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredSiswa.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400 px-4">
              Tidak ada siswa yang cocok dengan pencarian &quot;{search}&quot;.
            </div>
          ) : (
            filteredSiswa.map((s, idx) => {
            const currentStatus = statuses[s.pendaftaranId];

            return (
              <div
                key={s.pendaftaranId}
                className={`p-4 space-y-3 transition-colors ${
                  s.terkunci
                    ? 'bg-slate-50/50 dark:bg-slate-800/30'
                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'
                }`}
              >
                {/* Header: Student Info + Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="size-6 shrink-0 grid place-items-center rounded bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 tabular-nums">
                      {idx + 1}
                    </span>
                    <StudentAvatar
                      nama={s.nama}
                      jenjang={s.jenjangTerakhir}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-950 dark:text-slate-50 text-sm truncate">
                        {s.nama}
                      </p>
                      {s.jenjangTerakhir && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {s.jenjangTerakhir}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {s.terkunci ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <Lock className="size-3" />
                        Terkunci
                      </span>
                    ) : currentStatus ? (
                      <span className="inline-flex items-center gap-2 text-xs font-semibold capitalize text-slate-800 dark:text-slate-200">
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
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        Belum diisi
                      </span>
                    )}
                  </div>
                </div>

                {/* Tactile Segmented Status Buttons (Thumb friendly) */}
                <fieldset disabled={s.terkunci} className="w-full">
                  <legend className="sr-only">
                    {t('attendanceStudentLabel', { name: s.nama })}
                  </legend>
                  <div className="grid grid-cols-4 gap-2">
                    {STATUS_LIST.map((st) => {
                      const isSelected = currentStatus === st.key;
                      return (
                        <button
                          key={st.key}
                          type="button"
                          disabled={s.terkunci}
                          onClick={() => handleStatusChange(s.pendaftaranId, st.key)}
                          className={`h-11 rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all select-none active:scale-95 cursor-pointer ${
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
                          <span className="text-sm font-extrabold">{st.label}</span>
                          <span className="text-[10px] font-normal opacity-90">{st.fullLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {/* Note Field */}
                <div className="pt-1">
                  <input
                    type="text"
                    maxLength={255}
                    aria-label={`Catatan presensi untuk ${s.nama}`}
                    value={notes[s.pendaftaranId] ?? ''}
                    onChange={(e) =>
                      setNotes((prev) => ({
                        ...prev,
                        [s.pendaftaranId]: e.target.value,
                      }))
                    }
                    disabled={s.terkunci}
                    placeholder={t('notesPlaceholder')}
                    className="w-full h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base sm:text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed transition-colors"
                  />
                </div>

                {s.terkunci && s.presensiId ? (
                  <div className="pt-1 text-right">
                    <Link
                      href={`/teacher/corrections?entitas=presensi&id=${s.presensiId}`}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Ajukan Koreksi Presensi →
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
        </div>

        {/* Integrated Form Footer (Embedded Footer, Replaces Sticky Floating Bar) */}
        <div className="flex flex-col gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 sm:flex-row sm:items-center sm:justify-between">
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
