"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";
import { NativeDialog } from "@/components/common/native-dialog";
import type { TeacherCalendarSessionItem } from "./teacher-calendar-view";

interface CalendarSessionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  session: TeacherCalendarSessionItem | null;
  locale: string;
}

const JENJANG_BADGES: Record<string, string> = {
  TK: "bg-pink-100/90 text-pink-700 dark:bg-pink-900/60 dark:text-pink-300 border-pink-200/80 dark:border-pink-800",
  SD: "bg-blue-100/90 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border-blue-200/80 dark:border-blue-800",
  SMP: "bg-emerald-100/90 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800",
  SMA: "bg-amber-100/90 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800",
};

export function CalendarSessionDrawer({
  isOpen,
  onClose,
  session,
  locale,
}: CalendarSessionDrawerProps) {
  const t = useTranslations("teacher");

  const formattedDate = useMemo(() => {
    if (!session) return "";
    const [y, m, d] = session.tanggalPertemuan.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [session, locale]);

  if (!isOpen || !session) return null;

  const isCancelled = session.statusSesi === "dibatalkan";
  const isFilled = session.presensiCount > 0;
  const jenjangBadgeStyle =
    JENJANG_BADGES[session.jenjang] ??
    "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";

  const attendancePct =
    session.pesertaCount > 0
      ? Math.min(100, Math.round((session.presensiCount / session.pesertaCount) * 100))
      : 0;

  const attendanceUrl = `/teacher/classes/${session.kelasId}/sessions/${session.tanggalPertemuan}/attendance?sesi=${session.jadwalItemId}`;
  const classUrl = `/teacher/classes/${session.kelasId}`;

  return (
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="session-drawer-title"
      className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md sm:max-w-lg flex-col bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 p-0 overscroll-contain animate-in slide-in-from-right duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div>
          <h2
            id="session-drawer-title"
            className="text-base font-bold text-slate-950 dark:text-slate-50 font-display"
          >
            Rincian Sesi Mengajar
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {formattedDate}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup rincian sesi"
          className="grid size-8 place-items-center rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors cursor-pointer"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {/* Body Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Kelas & Waktu Highlight */}
        <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-block rounded-md border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${jenjangBadgeStyle}`}
            >
              {session.jenjang}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                isCancelled
                  ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900/60"
                  : isFilled
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900/60"
                  : session.isToday
                  ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/60"
                  : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
              }`}
            >
              {isCancelled
                ? "Dibatalkan"
                : isFilled
                ? "Presensi Lengkap"
                : session.isToday
                ? "Sesi Hari Ini"
                : "Terjadwal"}
            </span>
          </div>

          <div>
            <h3 className="font-display text-lg font-bold text-slate-950 dark:text-slate-50">
              {session.kelasDisplayName || session.kelasNama}
            </h3>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1 tabular-nums">
              Pukul {session.jamMulai} – {session.jamSelesai} WIB
            </p>
          </div>
        </div>

        {/* Status Presensi Kelas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-700 dark:text-slate-300">
              Rekap Presensi Siswa
            </span>
            <span className="tabular-nums text-slate-950 dark:text-slate-100">
              {session.presensiCount} / {session.pesertaCount} siswa hadir
            </span>
          </div>

          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                isCancelled
                  ? "bg-rose-500"
                  : isFilled
                  ? "bg-emerald-600"
                  : "bg-blue-600"
              }`}
              style={{ width: `${session.pesertaCount > 0 ? attendancePct : 0}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {isCancelled
              ? "Sesi ini telah dibatalkan."
              : isFilled
              ? "Seluruh data absensi telah tersimpan di sistem."
              : "Presensi belum dicatat untuk pertemuan ini."}
          </p>
        </div>

        {/* Jurnal / Catatan Materi Pertemuan (Google Classroom Style) */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Jurnal & Materi Pembelajaran
          </h4>
          {session.catatanMateri || session.catatanPr ? (
            <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
              {session.catatanMateri ? (
                <div>
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                    Materi Sesi:
                  </p>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">
                    {session.catatanMateri}
                  </p>
                </div>
              ) : null}

              {session.catatanPr ? (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2.5">
                  <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">
                    Catatan PR / Rumah:
                  </p>
                  <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">
                    {session.catatanPr}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Belum ada jurnal atau catatan materi yang disimpan untuk sesi ini.
              </p>
            </div>
          )}
        </div>

        {/* Tugas & Asesmen Terkait (Google Classroom Style) */}
        {(() => {
          const tugasList = session.tugasList ?? [];
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Tugas & Asesmen Terhubung
                </h4>
                {tugasList.length > 0 ? (
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
                    {tugasList.length} tugas
                  </span>
                ) : null}
              </div>

              {tugasList.length > 0 ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                  {tugasList.map((tugas) => (
                    <div
                      key={tugas.id}
                      className="flex items-center justify-between gap-3 p-3.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {tugas.nama}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums font-semibold">
                            Maks. {tugas.nilaiMaksimum} poin
                          </span>
                          <span>·</span>
                          <span
                            className={`text-[10px] font-bold ${
                              tugas.draf
                                ? "text-amber-700 dark:text-amber-400"
                                : "text-emerald-700 dark:text-emerald-400"
                            }`}
                          >
                            {tugas.draf ? "Draf" : "Diterbitkan"}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/teacher/grades/assessment/${tugas.id}`}
                        className="shrink-0 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Buku Nilai →
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tidak ada tugas atau asesmen yang dikaitkan ke sesi pertemuan ini.
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col sm:flex-row items-center gap-3">
        {isCancelled ? (
          <button
            type="button"
            disabled
            className="w-full sm:flex-1 rounded-xl bg-slate-200 dark:bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-400 dark:text-slate-500 cursor-not-allowed text-center"
          >
            Sesi Telah Dibatalkan
          </button>
        ) : (
          <Link
            href={attendanceUrl}
            className="w-full sm:flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 px-4 py-2.5 text-xs font-bold text-white text-center shadow-xs transition-colors cursor-pointer"
          >
            {isFilled ? "Perbarui Presensi Siswa" : "Catat Presensi Siswa"}
          </Link>
        )}

        <Link
          href={classUrl}
          className="w-full sm:w-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-center transition-colors cursor-pointer"
        >
          Lihat Roster Kelas
        </Link>
      </div>
    </NativeDialog>
  );
}
