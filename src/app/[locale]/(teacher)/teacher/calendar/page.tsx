import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { rencanakanSesi } from "@/lib/rencana-sesi";
import { tanggalWIB } from "@/lib/hari";
import {
  TeacherCalendarView,
  type TeacherCalendarSessionItem,
  type ClassOption,
} from "@/components/teacher/calendar/teacher-calendar-view";

export const dynamic = "force-dynamic";

/*
 * Jadwal mengajar guru: arsitektur kalender berbasis Weekly Grid, Monthly Grid,
 * dan Compact Agenda.
 */

export default async function TeacherCalendarPage() {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/calendar", locale });
  const guruId = Number(session.user.id);

  const kelasList = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all(),
  );
  const kelasIds = kelasList.map((k) => k.id);

  if (kelasList.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {t("calendarTitle")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t("calendarDescription")}
          </p>
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center shadow-2xs">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t("noAssignedClasses")}</p>
        </div>
      </div>
    );
  }

  const [periodeList, mapelList, jadwalList, pendaftaranList, presensiList] = await Promise.all([
    collect(db.orm.public.PeriodePendaftaran.where((p) => p.id.in(kelasList.map((k) => k.periodeId))).all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.JadwalItem.where((j) => j.kelasId.in(kelasIds)).all()),
    collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in(kelasIds)).all()),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
  ]);

  const slotIds = jadwalList.map((j) => j.id);
  const storedSessions = slotIds.length > 0
    ? await collect(db.orm.public.SesiPertemuan.where((s) => s.jadwalItemId.in(slotIds)).all())
    : [];

  const periodeMap = new Map(periodeList.map((p) => [p.id, p]));
  const mapelMap = new Map(mapelList.map((m) => [m.id, m.nama]));
  const storedBySlotAndDate = new Map(
    storedSessions.map((s) => [`${s.jadwalItemId}:${s.tanggalPertemuan}`, s]),
  );

  // Map attendance by slot + date
  const attendanceBySlotAndDate = new Map<string, number>();
  for (const pres of presensiList) {
    const key = `${pres.jadwalItemId}:${pres.tanggalPertemuan}`;
    attendanceBySlotAndDate.set(key, (attendanceBySlotAndDate.get(key) ?? 0) + 1);
  }

  // Count active students per class
  const activeStudentsPerClass = new Map<number, number>();
  for (const p of pendaftaranList) {
    if (p.kelasId !== undefined && ["terdaftar", "tertunggak"].includes(p.status)) {
      activeStudentsPerClass.set(p.kelasId, (activeStudentsPerClass.get(p.kelasId) ?? 0) + 1);
    }
  }

  const hariIni = tanggalWIB(new Date());

  // Generate sessions for all active classes
  const allSessions: TeacherCalendarSessionItem[] = [];

  for (const k of kelasList) {
    if (k.status === "dibatalkan") continue;

    const periode = periodeMap.get(k.periodeId);
    if (!periode) continue;

    const classSlots = jadwalList.filter((j) => j.kelasId === k.id);
    if (classSlots.length === 0) continue;

    const storedForClass = storedSessions.filter((s) => classSlots.some((slot) => slot.id === s.jadwalItemId));
    const planned = rencanakanSesi(
      periode.tanggalMulai,
      periode.tanggalSelesai,
      classSlots,
      storedForClass,
    );

    const merged = [
      ...storedForClass.map((s) => ({
        jadwalItemId: s.jadwalItemId,
        tanggalPertemuan: s.tanggalPertemuan,
        jamMulai: s.jamMulai,
        jamSelesai: s.jamSelesai,
        statusSesi: s.statusSesi,
      })),
      ...planned.map((p) => ({
        jadwalItemId: p.jadwalItemId,
        tanggalPertemuan: p.tanggalPertemuan,
        jamMulai: p.jamMulai,
        jamSelesai: p.jamSelesai,
        statusSesi: "terjadwal",
      })),
    ];

    const namaMapel = mapelMap.get(k.mataPelajaranId) ?? t("class");

    for (const sessionItem of merged) {
      const key = `${sessionItem.jadwalItemId}:${sessionItem.tanggalPertemuan}`;
      const stored = storedBySlotAndDate.get(key);
      const isPast = sessionItem.tanggalPertemuan < hariIni;
      const isToday = sessionItem.tanggalPertemuan === hariIni;

      allSessions.push({
        kelasId: k.id,
        jadwalItemId: sessionItem.jadwalItemId,
        tanggalPertemuan: sessionItem.tanggalPertemuan,
        jamMulai: (stored?.jamMulai ?? sessionItem.jamMulai).slice(0, 5),
        jamSelesai: (stored?.jamSelesai ?? sessionItem.jamSelesai).slice(0, 5),
        kelasNama: namaMapel,
        jenjang: k.jenjang,
        statusSesi: stored?.statusSesi ?? sessionItem.statusSesi,
        pesertaCount: activeStudentsPerClass.get(k.id) ?? 0,
        presensiCount: attendanceBySlotAndDate.get(key) ?? 0,
        isPast,
        isToday,
      });
    }
  }

  // Sort chronologically
  allSessions.sort((a, b) => {
    if (a.tanggalPertemuan !== b.tanggalPertemuan) {
      return a.tanggalPertemuan.localeCompare(b.tanggalPertemuan);
    }
    return a.jamMulai.localeCompare(b.jamMulai);
  });

  const todayCount = allSessions.filter((s) => s.isToday && s.statusSesi !== "dibatalkan").length;
  const pendingAttendanceCount = allSessions.filter((s) => s.presensiCount === 0 && s.statusSesi !== "dibatalkan").length;
  const completedAttendanceCount = allSessions.filter((s) => s.presensiCount > 0 && s.statusSesi !== "dibatalkan").length;

  const classOptions: ClassOption[] = kelasList.map((k) => ({
    id: k.id,
    name: mapelMap.get(k.mataPelajaranId) ?? t("class"),
    jenjang: k.jenjang,
  }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      {/* STANDARDIZED PAGE HEADER */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {t("calendarTitle")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t("calendarDescription")}
        </p>
      </div>

      {/* 4 SLEEK KPI STAT CARDS */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {/* Card 1: Total Sesi */}
          <div className="relative overflow-hidden rounded-lg border border-blue-200/70 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/80 via-blue-50/20 to-white dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-blue-600 dark:text-blue-400">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Total Sesi
                  </p>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-100/80 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                    Semester Ini
                  </span>
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-950 dark:text-white">
                  {allSessions.length}
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
                Total jadwal pertemuan
              </p>
            </div>
            <svg
              className="pointer-events-none absolute -right-4 -top-4 w-32 sm:w-36 opacity-[0.16] dark:opacity-[0.22]"
              viewBox="0 0 400 280"
              fill="none"
              aria-hidden="true"
            >
              <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="currentColor" fillOpacity="0.4" />
              <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="currentColor" fillOpacity="0.6" />
              <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="currentColor" fillOpacity="0.8" />
            </svg>
          </div>

          {/* Card 2: Sesi Hari Ini */}
          <div className="relative overflow-hidden rounded-lg border border-indigo-200/70 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/80 via-indigo-50/20 to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-indigo-600 dark:text-indigo-400">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("todaySessions")}
                  </p>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-indigo-100/90 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-300 border border-indigo-300/80 dark:border-indigo-800">
                    Hari Ini
                  </span>
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-950 dark:text-white">
                  {todayCount}
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
                Jadwal aktif hari ini
              </p>
            </div>
            <svg
              className="pointer-events-none absolute -right-4 -top-4 w-32 sm:w-36 opacity-[0.16] dark:opacity-[0.22]"
              viewBox="0 0 400 280"
              fill="none"
              aria-hidden="true"
            >
              <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="currentColor" fillOpacity="0.4" />
              <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="currentColor" fillOpacity="0.6" />
              <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="currentColor" fillOpacity="0.8" />
            </svg>
          </div>

          {/* Card 3: Perlu Presensi */}
          <div className="relative overflow-hidden rounded-lg border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 via-amber-50/20 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-amber-600 dark:text-amber-400">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Perlu Presensi
                  </p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                    pendingAttendanceCount > 0
                      ? "bg-amber-100/90 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 border-amber-300/80 dark:border-amber-800"
                      : "bg-slate-100/90 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                  }`}>
                    {pendingAttendanceCount > 0 ? "Perlu Aksi" : "Lengkap"}
                  </span>
                </div>
                <p className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                  pendingAttendanceCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-950 dark:text-white"
                }`}>
                  {pendingAttendanceCount}
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
                {pendingAttendanceCount > 0 ? "Sesi belum dicatat" : "Seluruh sesi tuntas dicatat"}
              </p>
            </div>
            <svg
              className="pointer-events-none absolute -right-4 -top-4 w-32 sm:w-36 opacity-[0.16] dark:opacity-[0.22]"
              viewBox="0 0 400 280"
              fill="none"
              aria-hidden="true"
            >
              <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="currentColor" fillOpacity="0.4" />
              <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="currentColor" fillOpacity="0.6" />
              <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="currentColor" fillOpacity="0.8" />
            </svg>
          </div>

          {/* Card 4: Presensi Selesai */}
          <div className="relative overflow-hidden rounded-lg border border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 via-emerald-50/20 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-emerald-600 dark:text-emerald-400">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Presensi Selesai
                  </p>
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                    Tuntas
                  </span>
                </div>
                <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-950 dark:text-white">
                  {completedAttendanceCount}
                </p>
              </div>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
                Kehadiran telah dicatat
              </p>
            </div>
            <svg
              className="pointer-events-none absolute -right-4 -top-4 w-32 sm:w-36 opacity-[0.16] dark:opacity-[0.22]"
              viewBox="0 0 400 280"
              fill="none"
              aria-hidden="true"
            >
              <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="currentColor" fillOpacity="0.4" />
              <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="currentColor" fillOpacity="0.6" />
              <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="currentColor" fillOpacity="0.8" />
            </svg>
          </div>
        </div>

        {/* FULL INTERACTIVE CALENDAR: WEEKLY / MONTHLY / AGENDA */}
        <TeacherCalendarView
          sessions={allSessions}
          classes={classOptions}
          todayStr={hariIni}
          locale={locale}
        />
    </div>
  );
}
