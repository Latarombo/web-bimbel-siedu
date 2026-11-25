import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { tanggalWIB, hariDariTanggal } from "@/lib/format/hari";
import { rencanakanSesi } from "@/lib/rencana-sesi";
import {
  TeacherAttendanceOverview,
  type StudentAttendanceRow,
  type SessionAttendanceRow,
  type AttendanceKPIStats,
  type ClassFilterOption,
} from "@/components/teacher/attendance/teacher-attendance-overview";

export const dynamic = "force-dynamic";

export default async function TeacherAttendancePage() {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({ href: "/login?next=/teacher/attendance", locale });
  }

  const guruId = Number(session.user.id);
  const todayStr = tanggalWIB();

  // 1. Fetch teacher classes
  const kelas = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all(),
  );
  const kelasIds = new Set(kelas.map((k) => k.id));

  // 2. Fetch parallel data
  const [mapel, semuaPeriode, semuaPendaftaran, semuaAnak, semuaJadwal, semuaPresensi] = await Promise.all([
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.PeriodePendaftaran.all()),
    kelas.length
      ? collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in([...kelasIds])).all())
      : Promise.resolve([]),
    collect(db.orm.public.Anak.all()),
    kelas.length
      ? collect(db.orm.public.JadwalItem.where((j) => j.kelasId.in([...kelasIds])).all())
      : Promise.resolve([]),
    collect(db.orm.public.Presensi.where((p) => p.dicatatOleh.eq(guruId)).all()),
  ]);

  const jadwalIds = new Set(semuaJadwal.map((j) => j.id));
  const semuaSesi = semuaJadwal.length
    ? await collect(
        db.orm.public.SesiPertemuan.where((s) => s.jadwalItemId.in([...jadwalIds])).all(),
      )
    : [];

  // 3. Mappings
  const mapelById = new Map(mapel.map((m) => [m.id, m]));
  const periodeById = new Map(semuaPeriode.map((p) => [p.id, p]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));
  const anakById = new Map(semuaAnak.map((a) => [a.id, a]));
  const jadwalById = new Map(semuaJadwal.map((j) => [j.id, j]));

  // Active students only
  const activePendaftaran = semuaPendaftaran.filter(
    (p) => p.status === "terdaftar" || p.status === "tertunggak",
  );

  // Group enrollments by classId
  const studentsByClass = new Map<number, typeof activePendaftaran>();
  for (const p of activePendaftaran) {
    const list = studentsByClass.get(p.kelasId) ?? [];
    list.push(p);
    studentsByClass.set(p.kelasId, list);
  }

  // Group presensi by pendaftaranId
  const presensiByStudent = new Map<number, typeof semuaPresensi>();
  for (const pres of semuaPresensi) {
    const list = presensiByStudent.get(pres.pendaftaranId) ?? [];
    list.push(pres);
    presensiByStudent.set(pres.pendaftaranId, list);
  }

  // 4. Construct StudentAttendanceRows
  const studentRows: StudentAttendanceRow[] = activePendaftaran.map((p) => {
    const anak = anakById.get(p.anakId);
    const k = kelasById.get(p.kelasId);
    const m = k ? mapelById.get(k.mataPelajaranId) : undefined;
    const kelasNama = m?.nama ?? `Kelas #${p.kelasId}`;

    const presList = presensiByStudent.get(p.id) ?? [];
    let hadir = 0;
    let izin = 0;
    let sakit = 0;
    let alpa = 0;

    for (const pr of presList) {
      if (pr.status === "hadir") hadir++;
      else if (pr.status === "izin") izin++;
      else if (pr.status === "sakit") sakit++;
      else if (pr.status === "alpa") alpa++;
    }

    const totalPertemuan = hadir + izin + sakit + alpa;
    const persentase = totalPertemuan > 0 ? Math.round((hadir / totalPertemuan) * 100) : 100;
    const statusKehadiran: StudentAttendanceRow["statusKehadiran"] =
      persentase >= 90 ? "sangat_baik" : persentase >= 75 ? "cukup" : "perlu_perhatian";

    return {
      pendaftaranId: p.id,
      anakId: p.anakId,
      nama: anak?.nama ?? `Murid #${p.anakId}`,
      kelasId: p.kelasId,
      kelasNama,
      jenjang: k?.jenjang ?? p.jenjangSaatDaftar,
      tingkat: k?.tingkat ?? null,
      hadir,
      izin,
      sakit,
      alpa,
      totalPertemuan,
      persentase,
      statusKehadiran,
    };
  });

  // Sort students: lowest attendance percentage first (to highlight those who need attention)
  studentRows.sort((a, b) => a.persentase - b.persentase || a.nama.localeCompare(b.nama));

  // 5. Construct SessionAttendanceRows
  // Presensi by slot + date
  const presensiBySlotAndDate = new Map<string, typeof semuaPresensi>();
  for (const pr of semuaPresensi) {
    const key = `${pr.jadwalItemId}:${pr.tanggalPertemuan}`;
    const list = presensiBySlotAndDate.get(key) ?? [];
    list.push(pr);
    presensiBySlotAndDate.set(key, list);
  }

  // Stored sessions by slot + date
  const storedSessionBySlotAndDate = new Map(
    semuaSesi.map((s) => [`${s.jadwalItemId}:${s.tanggalPertemuan}`, s]),
  );

  const sessionRows: SessionAttendanceRow[] = [];
  let unrecordedSessionsCount = 0;

  for (const k of kelas) {
    const m = mapelById.get(k.mataPelajaranId);
    const kelasNama = m ? `${m.nama} (${k.jenjang})` : `Kelas #${k.id}`;
    const kelasJadwal = semuaJadwal.filter((j) => j.kelasId === k.id);
    const periode = periodeById.get(k.periodeId);
    const classStudents = studentsByClass.get(k.id) ?? [];
    const totalSiswaKelas = classStudents.length;

    const kelasSesiTersimpan = semuaSesi.filter((s) =>
      kelasJadwal.some((j) => j.id === s.jadwalItemId),
    );

    let allClassSessions: {
      jadwalItemId: number;
      tanggalPertemuan: string;
      jamMulai: string;
      jamSelesai: string;
      statusSesi: "terjadwal" | "selesai" | "dibatalkan";
    }[] = [];

    if (periode && kelasJadwal.length > 0) {
      try {
        const planned = rencanakanSesi(
          periode.tanggalMulai,
          periode.tanggalSelesai,
          kelasJadwal,
          kelasSesiTersimpan,
        );

        allClassSessions = [
          ...kelasSesiTersimpan.map((s) => ({
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
            statusSesi: "terjadwal" as const,
          })),
        ];
      } catch {
        allClassSessions = kelasSesiTersimpan.map((s) => ({
          jadwalItemId: s.jadwalItemId,
          tanggalPertemuan: s.tanggalPertemuan,
          jamMulai: s.jamMulai,
          jamSelesai: s.jamSelesai,
          statusSesi: s.statusSesi,
        }));
      }
    } else {
      allClassSessions = kelasSesiTersimpan.map((s) => ({
        jadwalItemId: s.jadwalItemId,
        tanggalPertemuan: s.tanggalPertemuan,
        jamMulai: s.jamMulai,
        jamSelesai: s.jamSelesai,
        statusSesi: s.statusSesi,
      }));
    }

    for (const sess of allClassSessions) {
      const slotKey = `${sess.jadwalItemId}:${sess.tanggalPertemuan}`;
      const presList = presensiBySlotAndDate.get(slotKey) ?? [];
      const hadirCount = presList.filter((x) => x.status === "hadir").length;
      const terisiCount = presList.length;

      const isPastOrToday = sess.tanggalPertemuan <= todayStr;
      if (isPastOrToday && sess.statusSesi !== "dibatalkan" && terisiCount === 0) {
        unrecordedSessionsCount++;
      }

      sessionRows.push({
        id: `${k.id}-${sess.jadwalItemId}-${sess.tanggalPertemuan}`,
        kelasId: k.id,
        kelasNama,
        jadwalItemId: sess.jadwalItemId,
        tanggal: sess.tanggalPertemuan,
        hari: hariDariTanggal(sess.tanggalPertemuan),
        jamMulai: sess.jamMulai,
        jamSelesai: sess.jamSelesai,
        totalSiswa: totalSiswaKelas,
        hadirCount,
        terisiCount,
        statusSesi: sess.statusSesi,
        attendanceUrl: `/teacher/classes/${k.id}/sessions/${sess.tanggalPertemuan}/attendance?sesi=${sess.jadwalItemId}`,
      });
    }
  }

  // Sort sessions: latest dates first
  sessionRows.sort((a, b) => b.tanggal.localeCompare(a.tanggal) || a.jamMulai.localeCompare(b.jamMulai));

  // 6. Overall Stats
  const totalPresensiDicatat = semuaPresensi.length;
  const totalHadir = semuaPresensi.filter((p) => p.status === "hadir").length;
  const totalIzinSakit = semuaPresensi.filter(
    (p) => p.status === "izin" || p.status === "sakit",
  ).length;
  const totalAlpa = semuaPresensi.filter((p) => p.status === "alpa").length;
  const rataRataKehadiran =
    totalPresensiDicatat > 0 ? Math.round((totalHadir / totalPresensiDicatat) * 100) : 100;

  const stats: AttendanceKPIStats = {
    totalPresensiDicatat,
    rataRataKehadiran,
    totalHadir,
    totalIzinSakit,
    totalAlpa,
    totalSiswaAktif: activePendaftaran.length,
    unrecordedSessionsCount,
  };

  // 7. Class filter options
  const classFilterOptions: ClassFilterOption[] = kelas.map((k) => {
    const m = mapelById.get(k.mataPelajaranId);
    return {
      id: k.id,
      nama: m?.nama ?? `Kelas #${k.id}`,
      jenjang: k.jenjang,
      tingkat: k.tingkat ?? null,
    };
  });

  return (
    <TeacherAttendanceOverview
      stats={stats}
      students={studentRows}
      sessions={sessionRows}
      classes={classFilterOptions}
      locale={locale}
    />
  );
}
