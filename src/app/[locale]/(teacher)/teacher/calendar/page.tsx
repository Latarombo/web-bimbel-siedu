import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { rencanakanSesi } from "@/lib/rencana-sesi";
import { tanggalWIB } from "@/lib/hari";
import { PageShell, PageHeader } from "@/components/admin/ui";
import { Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
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
      <PageShell wide={true}>
        <PageHeader
          title={t("calendarTitle")}
          desc={t("calendarDescription")}
        />
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-2xs">
          <p className="text-sm font-semibold text-slate-500">{t("noAssignedClasses")}</p>
        </div>
      </PageShell>
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
    <PageShell wide={true}>
      <div className="space-y-5">
        {/* STANDARDIZED PAGE HEADER */}
        <PageHeader
          title={t("calendarTitle")}
          desc={t("calendarDescription")}
          meta={`${kelasList.length} ${t("class")}`}
        />

        {/* 4 SLEEK KPI STAT CARDS */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {/* Card 1: Total Sesi */}
          <div className="group rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-slate-300 hover:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Sesi</span>
              <div className="grid size-9 place-items-center rounded-xl border border-blue-100/80 bg-blue-50 text-blue-600 transition-transform group-hover:scale-105">
                <Calendar className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-slate-900">
              {allSessions.length}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600">Semester ini</p>
          </div>

          {/* Card 2: Sesi Hari Ini */}
          <div className="group rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-blue-200 hover:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t("todaySessions")}</span>
              <div className="grid size-9 place-items-center rounded-xl border border-blue-200/80 bg-blue-500 text-white transition-transform group-hover:scale-105 shadow-2xs">
                <Clock className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-blue-600">
              {todayCount}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600">Jadwal aktif hari ini</p>
          </div>

          {/* Card 3: Perlu Presensi */}
          <div className="group rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-amber-200 hover:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Perlu Presensi</span>
              <div className="grid size-9 place-items-center rounded-xl border border-amber-100/80 bg-amber-50 text-amber-600 transition-transform group-hover:scale-105">
                <AlertCircle className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-amber-600">
              {pendingAttendanceCount}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600">Belum dicatat</p>
          </div>

          {/* Card 4: Presensi Selesai */}
          <div className="group rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-emerald-200 hover:shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Presensi Selesai</span>
              <div className="grid size-9 place-items-center rounded-xl border border-emerald-100/80 bg-emerald-50 text-emerald-600 transition-transform group-hover:scale-105">
                <CheckCircle2 className="size-4" />
              </div>
            </div>
            <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums text-emerald-600">
              {completedAttendanceCount}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-600">Telah lengkap</p>
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
    </PageShell>
  );
}
