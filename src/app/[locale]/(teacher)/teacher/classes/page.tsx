import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { tanggalWIB, hariDariTanggal } from "@/lib/hari";
import {
  TeacherClassesView,
  type ClassCardItem,
  type ScheduleItem,
} from "@/components/teacher/classes/teacher-classes-view";

export const dynamic = "force-dynamic";

export default async function TeacherClasses() {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/classes", locale });
  const guruId = Number(session.user.id);

  // 1. Fetch teacher classes
  const kelas = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all(),
  );
  const kelasIds = kelas.map((k) => k.id);
  const kelasIdsSet = new Set(kelasIds);

  // 2. Fetch subjects, schedules, enrollments, periods
  const [mapel, jadwal, pendaftaran, periode] = await Promise.all([
    collect(db.orm.public.MataPelajaran.all()),
    kelasIds.length
      ? collect(db.orm.public.JadwalItem.where((j) => j.kelasId.in(kelasIds)).all())
      : Promise.resolve([]),
    kelasIds.length
      ? collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in(kelasIds)).all())
      : Promise.resolve([]),
    collect(db.orm.public.PeriodePendaftaran.all()),
  ]);

  const mapelById = new Map(mapel.map((m) => [m.id, m.nama]));
  const periodeById = new Map(periode.map((p) => [p.id, p.nama]));

  // 3. Date & Today's Day in WIB
  const hariIniStr = tanggalWIB(new Date());
  const hariIni = hariDariTanggal(hariIniStr);

  // 4. Map active students count per class
  const activeStudentsPerClass = new Map<number, number>();
  for (const p of pendaftaran) {
    if (p.kelasId !== undefined && kelasIdsSet.has(p.kelasId) && ["terdaftar", "tertunggak"].includes(p.status)) {
      activeStudentsPerClass.set(p.kelasId, (activeStudentsPerClass.get(p.kelasId) ?? 0) + 1);
    }
  }

  // 5. Build Class Card Items
  const classCards: ClassCardItem[] = kelas.map((k) => {
    const classSchedules = jadwal
      .filter((j) => j.kelasId === k.id)
      .sort((a, b) => a.hari.localeCompare(b.hari) || a.jamMulai.localeCompare(b.jamMulai));

    const schedulesMapped: ScheduleItem[] = classSchedules.map((j) => {
      const isToday = j.hari === hariIni;
      return {
        id: j.id,
        hari: j.hari,
        jamMulai: j.jamMulai,
        jamSelesai: j.jamSelesai,
        isToday,
      };
    });

    const hasSessionToday = schedulesMapped.some((s) => s.isToday);
    const nAktif = activeStudentsPerClass.get(k.id) ?? 0;

    return {
      id: k.id,
      mapelNama: mapelById.get(k.mataPelajaranId) ?? `Kelas #${k.id}`,
      jenjang: k.jenjang,
      tingkat: k.tingkat,
      ruangan: k.ruangan,
      periodeNama: periodeById.get(k.periodeId) ?? null,
      kuotaMaksimum: k.kuotaMaksimum,
      kuotaMinimum: k.kuotaMinimum,
      kuotaTerisi: nAktif,
      status: k.status,
      schedules: schedulesMapped,
      hasSessionToday,
    };
  });

  // Sort: active classes first, then highest enrolled
  classCards.sort((a, b) => {
    if (a.status === "aktif" && b.status !== "aktif") return -1;
    if (a.status !== "aktif" && b.status === "aktif") return 1;
    return b.kuotaTerisi - a.kuotaTerisi;
  });

  const activeCount = classCards.filter((c) => c.status === "aktif").length;
  const totalStudents = Array.from(activeStudentsPerClass.values()).reduce((sum, n) => sum + n, 0);
  const todaySessionsTotal = classCards
    .filter((c) => c.status === "aktif")
    .reduce((sum, c) => sum + c.schedules.filter((s) => s.isToday).length, 0);

  const stats = {
    totalClasses: classCards.length,
    activeClasses: activeCount,
    totalStudents,
    todaySessionsCount: todaySessionsTotal,
  };

  return (
    <TeacherClassesView
      classes={classCards}
      todayStr={hariIniStr}
      todayDayLabel={hariIni}
      locale={locale}
      stats={stats}
    />
  );
}
