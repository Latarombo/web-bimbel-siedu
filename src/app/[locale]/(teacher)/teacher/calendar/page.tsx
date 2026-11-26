import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { rencanakanSesi } from "@/lib/rencana-sesi";
import { tanggalWIB } from "@/lib/format/hari";
import {
  TeacherCalendarView,
  type TeacherCalendarSessionItem,
  type ClassOption,
} from "@/components/teacher/calendar/teacher-calendar-view";

export const dynamic = "force-dynamic";

/*
 * Jadwal mengajar guru: kanvas penuh gaya Google Classroom
 * dengan filter kelas terpadu dan penamaan kelas tipografis (tanpa pill jenjang redundan).
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

  const [periodeList, jadwalList, pendaftaranList, presensiList, penilaianList] = await Promise.all([
    collect(db.orm.public.PeriodePendaftaran.where((p) => p.id.in(kelasList.map((k) => k.periodeId))).all()),
    collect(db.orm.public.JadwalItem.where((j) => j.kelasId.in(kelasIds)).all()),
    collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in(kelasIds)).all()),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
    kelasIds.length > 0
      ? collect(db.orm.public.Penilaian.where((p) => p.kelasId.in(kelasIds)).all())
      : Promise.resolve([]),
  ]);

  const slotIds = jadwalList.map((j) => j.id);
  const storedSessions = slotIds.length > 0
    ? await collect(db.orm.public.SesiPertemuan.where((s) => s.jadwalItemId.in(slotIds)).all())
    : [];

  const periodeMap = new Map(periodeList.map((p) => [p.id, p]));
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

    const namaMapel = k.mapel || k.nama || t("class");
    const formatTingkat = k.tingkat
      ? (k.tingkat.toLowerCase().startsWith("kelas") ? k.tingkat : `Kelas ${k.tingkat}`)
      : null;
    const kelasDisplayName = `${namaMapel} · ${k.jenjang}${formatTingkat ? ` (${formatTingkat})` : ""}`;

    for (const sessionItem of merged) {
      const key = `${sessionItem.jadwalItemId}:${sessionItem.tanggalPertemuan}`;
      const stored = storedBySlotAndDate.get(key);
      const isPast = sessionItem.tanggalPertemuan < hariIni;
      const isToday = sessionItem.tanggalPertemuan === hariIni;

      const relatedPenilaian = penilaianList.filter((p) =>
        (stored?.id !== undefined && p.sesiPertemuanId === stored.id) ||
        (p.kelasId === k.id && p.tanggal === sessionItem.tanggalPertemuan)
      );

      const tugasList = relatedPenilaian.map((p) => ({
        id: p.id,
        nama: p.nama,
        nilaiMaksimum: Number(p.nilaiMaksimum),
        draf: p.draf,
      }));

      allSessions.push({
        kelasId: k.id,
        sesiPertemuanId: stored?.id,
        jadwalItemId: sessionItem.jadwalItemId,
        tanggalPertemuan: sessionItem.tanggalPertemuan,
        jamMulai: (stored?.jamMulai ?? sessionItem.jamMulai).slice(0, 5),
        jamSelesai: (stored?.jamSelesai ?? sessionItem.jamSelesai).slice(0, 5),
        kelasNama: namaMapel,
        kelasDisplayName,
        jenjang: k.jenjang,
        tingkat: k.tingkat,
        statusSesi: stored?.statusSesi ?? sessionItem.statusSesi,
        pesertaCount: activeStudentsPerClass.get(k.id) ?? 0,
        presensiCount: attendanceBySlotAndDate.get(key) ?? 0,
        isPast,
        isToday,
        catatanMateri: stored?.catatanMateri ?? null,
        catatanPr: stored?.catatanPr ?? null,
        tugasList,
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

  const classOptions: ClassOption[] = kelasList.map((k) => {
    const namaMapel = k.mapel || k.nama || t("class");
    const formatTingkat = k.tingkat
      ? (k.tingkat.toLowerCase().startsWith("kelas") ? k.tingkat : `Kelas ${k.tingkat}`)
      : null;
    return {
      id: k.id,
      name: namaMapel,
      displayName: `${namaMapel} · ${k.jenjang}${formatTingkat ? ` (${formatTingkat})` : ""}`,
      jenjang: k.jenjang,
      tingkat: k.tingkat,
    };
  });

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

      {/* GOOGLE CLASSROOM CALENDAR CANVAS */}
      <TeacherCalendarView
        sessions={allSessions}
        classes={classOptions}
        todayStr={hariIni}
        locale={locale}
        allowedViews={["daily", "weekly", "monthly"]}
      />
    </div>
  );
}
