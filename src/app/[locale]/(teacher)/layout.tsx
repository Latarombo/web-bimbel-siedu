import { getTranslations, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { rencanakanSesi } from "@/lib/rencana-sesi";
import { tanggalWIB } from "@/lib/format/hari";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import type { NotificationItem } from "@/components/teacher/teacher-header";
import type {
  QuickSearchClassItem,
  QuickSearchStudentItem,
} from "@/components/teacher/teacher-quick-search";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/dashboard", locale });
  // Tembok dalam: proxy cek role guru untuk /teacher/*; dicek lagi di sini (lapis kedua).
  if (session.user.role !== "guru") {
    return redirect({ href: session.user.role === "admin" ? "/admin/dashboard" : "/home", locale });
  }

  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("siedu_teacher_sidebar_collapsed")?.value === "true";
  const guruId = Number(session.user.id);

  // Search dataset: classes & active students
  const kelas = await collect(db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all());
  const kelasIdsArray = kelas.map((k) => k.id);
  const kelasIds = new Set(kelasIdsArray);

  const [pendaftaran, mapel, jadwal, periode, presensi, penilaian, hasilPenilaian] = await Promise.all([
    kelasIdsArray.length
      ? collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in(kelasIdsArray)).all())
      : Promise.resolve([]),
    collect(db.orm.public.MataPelajaran.all()),
    kelasIdsArray.length
      ? collect(db.orm.public.JadwalItem.where((j) => j.kelasId.in(kelasIdsArray)).all())
      : Promise.resolve([]),
    collect(db.orm.public.PeriodePendaftaran.all()),
    collect(db.orm.public.Presensi.where((p) => p.dicatatOleh.eq(guruId)).all()),
    kelasIdsArray.length
      ? collect(db.orm.public.Penilaian.where((p) => p.dibuatOleh.eq(guruId)).all())
      : Promise.resolve([]),
    collect(db.orm.public.HasilPenilaian.all()),
  ]);

  const mapelById = new Map(mapel.map((m) => [m.id, m.nama]));

  const siswaAktif = pendaftaran.filter(
    (p) => p.kelasId !== undefined && kelasIds.has(p.kelasId) && ["terdaftar", "tertunggak"].includes(p.status),
  );

  const searchClasses: QuickSearchClassItem[] = kelas.map((k) => ({
    id: k.id,
    name: mapelById.get(k.mataPelajaranId) ?? `Kelas #${k.id}`,
    jenjang: k.jenjang,
    tingkat: k.tingkat,
  }));

  const activeAnakIds = [...new Set(siswaAktif.map((s) => s.anakId))];
  const anakList = activeAnakIds.length
    ? await collect(db.orm.public.Anak.where((a) => a.id.in(activeAnakIds)).all())
    : [];
  const anakById = new Map(anakList.map((a) => [a.id, a.nama]));
  const kelasNamaById = new Map(
    kelas.map((k) => [k.id, mapelById.get(k.mataPelajaranId) ?? `Kelas #${k.id}`])
  );

  const searchStudents: QuickSearchStudentItem[] = siswaAktif.map((s) => ({
    id: s.id,
    nama: anakById.get(s.anakId) ?? `Siswa #${s.anakId}`,
    kelasNama: (s.kelasId ? kelasNamaById.get(s.kelasId) : undefined) ?? "Kelas",
  }));

  // Hitung notifikasi operasional guru secara nyata dari database
  const sekarang = new Date();
  const hariIni = tanggalWIB(sekarang);
  const tujuhHariLalu = new Date(sekarang.getTime() - 7 * 86_400_000);
  const batas7Hari = tanggalWIB(tujuhHariLalu);

  const periodeMap = new Map(periode.map((p) => [p.id, p]));
  const presKeys = new Set(presensi.map((p) => `${p.jadwalItemId}:${p.tanggalPertemuan}`));

  let unrecorded7HariCount = 0;
  let totalUnrecordedCount = 0;
  let todaySessionsCount = 0;

  for (const k of kelas) {
    if (k.status === "dibatalkan") continue;
    const p = periodeMap.get(k.periodeId);
    if (!p) continue;
    const slots = jadwal.filter((j) => j.kelasId === k.id);
    const planned = rencanakanSesi(p.tanggalMulai, p.tanggalSelesai, slots);
    for (const pl of planned) {
      if (pl.tanggalPertemuan === hariIni) {
        todaySessionsCount++;
      }
      if (pl.tanggalPertemuan <= hariIni && !presKeys.has(`${pl.jadwalItemId}:${pl.tanggalPertemuan}`)) {
        totalUnrecordedCount++;
        if (pl.tanggalPertemuan >= batas7Hari) {
          unrecorded7HariCount++;
        }
      }
    }
  }

  // Antrean penilaian tugas siswa yang belum dinilai
  const penilaianIds = new Set(penilaian.map((p) => p.id));
  const hasil = hasilPenilaian.filter((h) => penilaianIds.has(h.penilaianId));
  const sudahDinilaiKeys = new Set(
    hasil
      .filter((h) => h.statusHasil === "dinilai")
      .map((h) => `${h.penilaianId}:${h.pendaftaranId}`),
  );

  const siswaByKelas = new Map<number, typeof siswaAktif>();
  for (const p of siswaAktif) {
    const list = siswaByKelas.get(p.kelasId ?? 0) ?? [];
    list.push(p);
    siswaByKelas.set(p.kelasId ?? 0, list);
  }

  let pendingGradingCount = 0;
  for (const pen of penilaian) {
    const siswaKelas = siswaByKelas.get(pen.kelasId) ?? [];
    for (const s of siswaKelas) {
      if (!sudahDinilaiKeys.has(`${pen.id}:${s.id}`)) {
        pendingGradingCount++;
      }
    }
  }

  const notifications: NotificationItem[] = [];

  // 1. Notifikasi presensi belum lengkap (fokus 7 hari terakhir atau total jika ada)
  if (unrecorded7HariCount > 0) {
    notifications.push({
      id: "notif-attendance-unrecorded",
      title: "Presensi Belum Lengkap",
      description: `Terdapat ${unrecorded7HariCount} sesi pertemuan minggu ini belum presensi.`,
      time: "7 hari terakhir",
      unread: true,
      category: "attendance",
      href: "/teacher/attendance",
    });
  } else if (totalUnrecordedCount > 0) {
    notifications.push({
      id: "notif-attendance-unrecorded",
      title: "Presensi Belum Lengkap",
      description: `Terdapat ${totalUnrecordedCount} sesi pertemuan belum presensi.`,
      time: "Perlu ditinjau",
      unread: true,
      category: "attendance",
      href: "/teacher/attendance",
    });
  }

  // 2. Notifikasi antrean penilaian tugas
  if (pendingGradingCount > 0) {
    notifications.push({
      id: "notif-pending-grades",
      title: "Penilaian Menunggu",
      description: `Terdapat ${pendingGradingCount} tugas siswa menunggu penilaian.`,
      time: "Tugas aktif",
      unread: true,
      category: "task",
      href: "/teacher/grades",
    });
  }

  // 3. Notifikasi jadwal hari ini
  if (todaySessionsCount > 0) {
    notifications.push({
      id: "notif-today-classes",
      title: "Jadwal Hari Ini",
      description: `Hari ini Anda memiliki ${todaySessionsCount} sesi pembelajaran yang dijadwalkan.`,
      time: "Hari ini",
      unread: false,
      category: "class",
      href: "/teacher/calendar",
    });
  }

  return (
    <TeacherShell
      role={t("teacher")}
      userName={session.user.name ?? t("teacher")}
      userEmail={session.user.email ?? null}
      userImage={session.user.image ?? null}
      accountRole={session.user.role}
      initialCollapsed={initialCollapsed}
      searchClasses={searchClasses}
      searchStudents={searchStudents}
      notifications={notifications}
    >
      {children}
    </TeacherShell>
  );
}
