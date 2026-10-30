import { getLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { tanggalWIB } from "@/lib/hari";
import { rencanakanSesi } from "@/lib/rencana-sesi";
import {
  ClassDetailView,
  type StudentRosterItem,
  type ScheduleSlotItem,
} from "@/components/teacher/classes/class-detail-view";

export const dynamic = "force-dynamic";

export default async function TeacherClassDetail({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect("/login?next=/teacher/classes");
  const { classId } = await params;
  const kid = Number(classId);
  if (!Number.isInteger(kid)) notFound();
  const guruId = Number(session.user.id);

  const [kelas] = await collect(
    db.orm.public.Kelas.where((k) => k.id.eq(kid))
      .where((k) => k.guruId.eq(guruId))
      .all(),
  );
  if (!kelas) notFound();

  const [mapel, jadwal, pendaftaran, semuaAnak, nilaiByGuru, presensiByGuru] = await Promise.all([
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.JadwalItem.where((j) => j.kelasId.eq(kid)).all()),
    collect(
      db.orm.public.Pendaftaran.where((p) => p.kelasId.eq(kid))
        .where((p) => p.status.in(["terdaftar", "tertunggak"]))
        .all(),
    ),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.NilaiProgres.where((n) => n.dicatatOleh.eq(guruId)).all()),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
  ]);

  const m = mapel.find((x) => x.id === kelas.mataPelajaranId);
  const anakById = new Map(semuaAnak.map((a) => [a.id, a]));
  const sesiIds = new Set(jadwal.map((j) => j.id));
  const hariIniStr = tanggalWIB(new Date());

  const [periode] = await collect(
    db.orm.public.PeriodePendaftaran.where((p) => p.id.eq(kelas.periodeId)).all(),
  );

  const tersimpan = jadwal.length
    ? await collect(
        db.orm.public.SesiPertemuan.where((s) => s.jadwalItemId.in([...sesiIds]))
          .where((s) => s.tanggalPertemuan.gte(hariIniStr))
          .all(),
      )
    : [];

  const awal = periode && periode.tanggalMulai > hariIniStr ? periode.tanggalMulai : hariIniStr;
  const rencana =
    kelas.status === "aktif" && periode && awal <= periode.tanggalSelesai
      ? rencanakanSesi(awal, periode.tanggalSelesai, jadwal)
      : [];

  const byKey = new Map(tersimpan.map((s) => [`${s.jadwalItemId}:${s.tanggalPertemuan}`, s]));
  const berikutBySlot = new Map<number, (typeof rencana)[number]>();
  const kandidat =
    kelas.status === "aktif" && periode
      ? [
          ...tersimpan.filter(
            (s) => s.tanggalPertemuan >= awal && s.tanggalPertemuan <= periode.tanggalSelesai,
          ),
          ...rencana,
        ].sort(
          (a, b) =>
            a.tanggalPertemuan.localeCompare(b.tanggalPertemuan) ||
            a.jamMulai.localeCompare(b.jamMulai),
        )
      : [];

  for (const calon of kandidat) {
    if (berikutBySlot.has(calon.jadwalItemId)) continue;
    const sesi = byKey.get(`${calon.jadwalItemId}:${calon.tanggalPertemuan}`);
    if (sesi?.statusSesi === "dibatalkan") continue;
    berikutBySlot.set(calon.jadwalItemId, {
      ...calon,
      jamMulai: sesi?.jamMulai ?? calon.jamMulai,
      jamSelesai: sesi?.jamSelesai ?? calon.jamSelesai,
    });
  }

  const pertamaHariIni = [...berikutBySlot.values()]
    .filter((s) => s.tanggalPertemuan === hariIniStr)
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai))[0];

  const nHadir = new Map<number, number>();
  for (const x of presensiByGuru) {
    if (!sesiIds.has(x.jadwalItemId) || x.status !== "hadir") continue;
    nHadir.set(x.pendaftaranId, (nHadir.get(x.pendaftaranId) ?? 0) + 1);
  }

  const nSesiHadir = new Map<number, number>();
  for (const p of pendaftaran) {
    nSesiHadir.set(p.id, presensiByGuru.filter((x) => x.pendaftaranId === p.id).length);
  }

  const rows = pendaftaran.map((p) => {
    const nilai = nilaiByGuru.filter((n) => n.pendaftaranId === p.id);
    const num = nilai
      .filter((n) => n.nilaiKuantitatif != null)
      .map((n) => Number(n.nilaiKuantitatif));
    return {
      p,
      anak: anakById.get(p.anakId),
      nNilai: nilai.length,
      rata: num.length ? Math.round(num.reduce((s, v) => s + v, 0) / num.length) : null,
      hadir: nHadir.get(p.id) ?? 0,
      tercatat: nSesiHadir.get(p.id) ?? 0,
    };
  });
  rows.sort((a, b) => (a.anak?.nama ?? "").localeCompare(b.anak?.nama ?? ""));

  const sesi = jadwal.sort(
    (a, b) => a.hari.localeCompare(b.hari) || a.jamMulai.localeCompare(b.jamMulai),
  );

  const studentItems: StudentRosterItem[] = rows.map(
    ({ p, anak, nNilai, rata, hadir, tercatat }) => ({
      id: p.id,
      anakId: p.anakId,
      nama: anak?.nama ?? `Siswa #${p.anakId}`,
      status: p.status,
      nNilai,
      rata,
      hadir,
      tercatat,
      tingkat: anak?.tingkat ?? null,
    }),
  );

  const scheduleSlotItems: ScheduleSlotItem[] = sesi.map((j) => {
    const berikut = berikutBySlot.get(j.id);
    const nextSessionTime = berikut
      ? `${berikut.jamMulai.slice(0, 5)} - ${berikut.jamSelesai.slice(0, 5)} WIB`
      : undefined;

    return {
      id: j.id,
      hari: j.hari,
      jamMulai: j.jamMulai,
      jamSelesai: j.jamSelesai,
      nextSessionDate: berikut?.tanggalPertemuan,
      nextSessionTime,
    };
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ClassDetailView
        classId={kid}
        className={m?.nama ?? "Kelas"}
        jenjang={kelas.jenjang}
        tingkat={kelas.tingkat}
        classStatus={kelas.status}
        kuotaMaksimum={kelas.kuotaMaksimum}
        kuotaMinimum={kelas.kuotaMinimum}
        periodeNama={periode?.nama}
        students={studentItems}
        schedules={scheduleSlotItems}
        firstTodaySession={
          pertamaHariIni
            ? {
                jadwalItemId: pertamaHariIni.jadwalItemId,
                jamMulai: pertamaHariIni.jamMulai,
                jamSelesai: pertamaHariIni.jamSelesai,
              }
            : null
        }
        todayStr={hariIniStr}
        locale={locale}
        stats={{
          activeStudents: rows.length,
          totalGradeEntries: nilaiByGuru.filter((n) =>
            pendaftaran.some((p) => p.id === n.pendaftaranId),
          ).length,
          totalRecordedAttendance: presensiByGuru.filter((x) =>
            sesiIds.has(x.jadwalItemId),
          ).length,
        }}
      />
    </div>
  );
}
