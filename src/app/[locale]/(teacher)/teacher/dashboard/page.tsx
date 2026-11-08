import { getTranslations, getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { tanggalWIB, hariDariTanggal } from "@/lib/hari";
import { TeacherScheduleWidget, type ScheduleSessionItem } from "@/components/teacher/dashboard/teacher-schedule-widget";
import { TeacherAnalyticsSection } from "@/components/teacher/dashboard-charts";
import {
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Check,
  ClipboardCheck,
  FileCheck,
  BookOpen,
  CalendarDays,
} from "lucide-react";

export const dynamic = "force-dynamic";

const WIB = "Asia/Jakarta";

const JENJANG_BADGE: Record<string, { badge: string; text: string; bar: string }> = {
  TK: { badge: "bg-pink-50 text-pink-700 border-pink-200", text: "text-pink-700", bar: "bg-pink-500" },
  SD: { badge: "bg-blue-50 text-blue-700 border-blue-200", text: "text-blue-700", bar: "bg-blue-500" },
  SMP: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700", bar: "bg-emerald-500" },
  SMA: { badge: "bg-amber-50 text-amber-800 border-amber-200", text: "text-amber-800", bar: "bg-amber-500" },
};

const AVATAR_COLORS = [
  "bg-slate-700 text-white",
  "bg-blue-700 text-white",
  "bg-emerald-700 text-white",
  "bg-amber-700 text-white",
  "bg-indigo-700 text-white",
];

export default async function TeacherDashboard() {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/dashboard", locale });
  const guruId = Number(session.user.id);
  const teacherName = session.user.name ?? t("teacher");

  // 1. Fetch Classes taught by this teacher
  const kelas = await collect(db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all());
  const kelasIds = kelas.map((k) => k.id);
  const sekarang = new Date();
  const hariIniStr = tanggalWIB(sekarang);
  const hari = hariDariTanggal(hariIniStr);

  // 2. Fetch dependent data
  const [mapel, jadwal, pendaftaran, penilaian, hasilAll, presensiSesi, periode] = await Promise.all([
    kelas.length ? collect(db.orm.public.MataPelajaran.all()) : Promise.resolve([]),
    kelas.length ? collect(db.orm.public.JadwalItem.where((j) => j.kelasId.in(kelasIds)).all()) : Promise.resolve([]),
    kelas.length
      ? collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in(kelasIds)).all())
      : Promise.resolve([]),
    kelas.length ? collect(db.orm.public.Penilaian.where((p) => p.dibuatOleh.eq(guruId)).all()) : Promise.resolve([]),
    kelas.length ? collect(db.orm.public.HasilPenilaian.all()) : Promise.resolve([]),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
    kelas.length
      ? collect(db.orm.public.PeriodePendaftaran.where((p) => p.id.in(kelas.map((k) => k.periodeId))).all())
      : Promise.resolve([]),
  ]);

  const mapelById = new Map(mapel.map((m) => [m.id, m]));
  const periodeById = new Map(periode.map((p) => [p.id, p]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));

  // 3. Students by enrollment
  const anakById = new Map((await collect(db.orm.public.Anak.all())).map((a) => [a.id, a]));
  const siswaAktif = pendaftaran.filter((p) => ["terdaftar", "tertunggak"].includes(p.status));

  const siswaByKelas = new Map<number, typeof siswaAktif>();
  for (const p of siswaAktif) {
    const list = siswaByKelas.get(p.kelasId ?? 0) ?? [];
    list.push(p);
    siswaByKelas.set(p.kelasId ?? 0, list);
  }

  // 4. Grading Queue
  const penilaianIds = new Set(penilaian.map((p) => p.id));
  const hasil = hasilAll.filter((h) => penilaianIds.has(h.penilaianId));

  const sudahDinilaiKeys = new Set(
    hasil
      .filter((h) => h.statusHasil === "dinilai")
      .map((h) => `${h.penilaianId}:${h.pendaftaranId}`),
  );

  type AntreanItem = {
    key: string;
    pendaftaranId: number;
    anakNama: string;
    kelasNama: string;
    jenjang: string;
    penilaianJudul: string;
  };

  const antreanPenilaian: AntreanItem[] = [];
  for (const pen of penilaian) {
    const siswaKelas = siswaByKelas.get(pen.kelasId) ?? [];
    const k = kelasById.get(pen.kelasId);
    const m = k ? mapelById.get(k.mataPelajaranId)?.nama : "Kelas";

    for (const s of siswaKelas) {
      const key = `${pen.id}:${s.id}`;
      if (!sudahDinilaiKeys.has(key)) {
        const anak = anakById.get(s.anakId);
        antreanPenilaian.push({
          key,
          pendaftaranId: s.id,
          anakNama: anak?.nama ?? "Siswa",
          kelasNama: m ?? "Kelas",
          jenjang: k?.jenjang ?? "SD",
          penilaianJudul: pen.nama,
        });
      }
    }
  }

  // 5. Presensi sesi hari ini
  const presensiHariIni = presensiSesi.filter((x) => x.tanggalPertemuan === hariIniStr);
  const terisiByItem = new Map<number, number>();
  for (const x of presensiHariIni) {
    terisiByItem.set(x.jadwalItemId, (terisiByItem.get(x.jadwalItemId) ?? 0) + 1);
  }

  // 6. Build schedule session list for widget
  const scheduleSessions: ScheduleSessionItem[] = [];
  for (const j of jadwal) {
    const k = kelasById.get(j.kelasId);
    if (!k || k.status !== "aktif") continue;
    const p = periodeById.get(k.periodeId);
    if (!p) continue;
    const m = mapelById.get(k.mataPelajaranId);
    const nSiswa = (siswaByKelas.get(k.id) ?? []).length;
    const nTerisi = terisiByItem.get(j.id) ?? 0;

    scheduleSessions.push({
      id: j.id,
      kelasId: k.id,
      kelasNama: m?.nama ?? "Kelas",
      mapel: m?.nama ?? "Mata Pelajaran",
      jenjang: k.jenjang,
      tingkat: k.tingkat,
      hari: j.hari,
      jamMulai: j.jamMulai,
      jamSelesai: j.jamSelesai,
      totalSiswa: nSiswa,
      terisiCount: nTerisi,
      periodeMulai: p.tanggalMulai,
      periodeSelesai: p.tanggalSelesai,
    });
  }

  const sesiHariIni = scheduleSessions.filter(
    (s) => s.hari === hari && hariIniStr >= s.periodeMulai && hariIniStr <= s.periodeSelesai
  );
  const totalSiswaHariIni = sesiHariIni.reduce((acc, s) => acc + s.totalSiswa, 0);
  const totalTerisiHariIni = sesiHariIni.reduce((acc, s) => acc + Math.min(s.terisiCount, s.totalSiswa), 0);

  // 7. Overall attendance calculations & 7-day trend
  const hadirCount = presensiSesi.filter((p) => p.status === "hadir").length;
  const izinCount = presensiSesi.filter((p) => p.status === "izin").length;
  const sakitCount = presensiSesi.filter((p) => p.status === "sakit").length;
  const alpaCount = presensiSesi.filter((p) => p.status === "alpa").length;
  const totalPresensiAll = hadirCount + izinCount + sakitCount + alpaCount;
  const overallAttendanceRate = totalPresensiAll > 0 ? Math.round((hadirCount / totalPresensiAll) * 100) : 100;

  const hariAktivitasData: { label: string; fullLabel: string; hadir: number; fill: string }[] = [];
  let totalAktivitasHadir = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(sekarang);
    d.setDate(d.getDate() - i);
    const dStr = tanggalWIB(d);
    const dayName = d.toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
      weekday: "short",
      timeZone: WIB,
    });
    const fullDayName = d.toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone: WIB,
    });
    const hadirDay = presensiSesi.filter(
      (p) => p.tanggalPertemuan === dStr && p.status === "hadir"
    ).length;
    totalAktivitasHadir += hadirDay;
    const isToday = i === 0;
    const todaySuffix = locale === "en" ? " (Today)" : " (Hari Ini)";
    hariAktivitasData.push({
      label: dayName,
      fullLabel: isToday ? `${fullDayName}${todaySuffix}` : fullDayName,
      hadir: hadirDay,
      fill: isToday ? "#2563eb" : "#94a3b8",
    });
  }

  const rekapPresensiData = [
    { key: "hadir", label: t("statusHadir") || "Hadir", value: hadirCount, color: "#10b981" },
    { key: "izin", label: t("statusIzin") || "Izin", value: izinCount, color: "#f59e0b" },
    { key: "sakit", label: t("statusSakit") || "Sakit", value: sakitCount, color: "#0ea5e9" },
    { key: "alpa", label: t("statusAlpa") || "Alpa", value: alpaCount, color: "#f43f5e" },
  ];

  const firstUnfinishedSession = sesiHariIni.find((s) => s.terisiCount < s.totalSiswa || s.totalSiswa === 0);
  const kelasAktif = kelas.filter((k) => k.status === "aktif");
  const uniqueStudentsCount = new Set(siswaAktif.map((s) => s.anakId)).size;

  const tanggalLengkap = sekarang.toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: WIB,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      
      {/* 1. Header Bersih Tanpa Gradient */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {t("welcomeTeacher", { name: teacherName })}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          {tanggalLengkap} · Waktu Indonesia Barat
        </p>
      </div>

      {/* 2. Ringkasan 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Kelas Diampu */}
        <div className="relative overflow-hidden rounded-lg border border-blue-200/70 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/80 via-blue-50/20 to-white dark:from-blue-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-blue-600 dark:text-blue-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("taughtClasses")}
                </p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-blue-100/80 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                  Aktif
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {kelasAktif.length}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              {t("totalClassesCount", { count: kelas.length })}
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

        {/* Card 2: Total Murid */}
        <div className="relative overflow-hidden rounded-lg border border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-50/80 via-emerald-50/20 to-white dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-emerald-600 dark:text-emerald-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("totalStudents")}
                </p>
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                  Terdaftar
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {uniqueStudentsCount}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              {t("enrollmentsCount", { count: siswaAktif.length })}
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

        {/* Card 3: Perlu Dinilai */}
        <div className="relative overflow-hidden rounded-lg border border-amber-200/70 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/80 via-amber-50/20 to-white dark:from-amber-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-amber-600 dark:text-amber-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("needsGrading")}
                </p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${antreanPenilaian.length > 0 ? "bg-amber-100/90 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 border-amber-300/80 dark:border-amber-800" : "bg-slate-100/90 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                  {antreanPenilaian.length > 0 ? "Perlu Aksi" : "Lengkap"}
                </span>
              </div>
              <p className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${antreanPenilaian.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-950 dark:text-white"}`}>
                {antreanPenilaian.length}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              {antreanPenilaian.length > 0 ? "Menunggu penilaian" : t("statusDone")}
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

        {/* Card 4: Sesi Hari Ini */}
        <div className="relative overflow-hidden rounded-lg border border-indigo-200/70 dark:border-indigo-900/40 bg-gradient-to-br from-indigo-50/80 via-indigo-50/20 to-white dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 p-4 shadow-xs text-indigo-600 dark:text-indigo-400">
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("todaySessions")}
                </p>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${sesiHariIni.length > 0 ? "bg-indigo-100/90 text-indigo-800 dark:bg-indigo-900/70 dark:text-indigo-300 border-indigo-300/80 dark:border-indigo-800" : "bg-slate-100/90 text-slate-600 dark:bg-slate-800/80 dark:text-slate-400 border-slate-200 dark:border-slate-700"}`}>
                  {sesiHariIni.length > 0 ? "Hari Ini" : "Jadwal"}
                </span>
              </div>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
                {sesiHariIni.length}
              </p>
            </div>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 truncate">
              {sesiHariIni.length > 0
                ? t("studentsRatio", { filled: totalTerisiHariIni, total: totalSiswaHariIni })
                : t("noTeachingToday")}
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

      {/* 4. Konten Utama Terbagi dalam Grid 12 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Kolom Kiri: Alur Operasional & Analitik */}
        <div className="lg:col-span-8 order-1 space-y-6">
          {/* Analitik Kehadiran */}
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
              <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50 tracking-tight">
                {t("analyticsSectionTitle")}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Ringkasan data kehadiran siswa pada seluruh kelas yang Anda ampu.
              </p>
            </div>

            <TeacherAnalyticsSection
              rekapData={rekapPresensiData}
              totalPresensi={totalPresensiAll}
              aktivitasData={hariAktivitasData}
              totalAktivitasHadir={totalAktivitasHadir}
              overallAttendanceRate={overallAttendanceRate}
              labels={{
                distributionTitle: t("attendanceDistributionTitle"),
                weeklyTrendTitle: t("weeklyAttendanceTrendTitle"),
                weeklyTrendSubtitle: t("weeklyTrendSubtitle"),
                totalAttendance: t("attendanceTotalRecorded"),
                noAttendanceYet: t("noAttendanceDataYet"),
                noAttendanceDesc: t("noAttendanceDataDesc"),
                overallAttendanceRate: t("overallAttendanceRate"),
              }}
            />
          </div>

          {/* Sesi Mengajar Hari Ini */}
          {sesiHariIni.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50 tracking-tight">
                  {t("todayFocusTitle")}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{t("todayFocusDesc")}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {sesiHariIni.map((session) => {
                  const tema = JENJANG_BADGE[session.jenjang] || JENJANG_BADGE.SD;
                  const isDone = session.totalSiswa > 0 && session.terisiCount >= session.totalSiswa;

                  return (
                    <div
                      key={session.id}
                      className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 hover:border-slate-300 shadow-2xs transition-all space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            {session.jamMulai} - {session.jamSelesai} WIB
                          </span>
                          <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${tema.badge}`}>
                            {session.jenjang} {session.tingkat ? `· ${session.tingkat}` : ""}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-950 line-clamp-1">
                            {session.mapel}
                          </h3>
                          <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                            {session.kelasNama}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        {isDone ? (
                          <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            <Check className="size-3.5 stroke-[2.5]" />
                            <span>{t("attendanceRecordedBadge", { filled: session.terisiCount, total: session.totalSiswa })}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            <AlertCircle className="size-3.5" />
                            <span>{t("attendancePendingBadge")}</span>
                          </span>
                        )}

                        <Link
                          href={`/teacher/classes/${session.kelasId}/sessions/${hariIniStr}/attendance`}
                          className={`inline-flex items-center justify-center rounded-md px-3.5 py-2 text-xs font-semibold min-h-[38px] transition-colors cursor-pointer ${
                            isDone
                              ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                              : "bg-blue-600 text-white hover:bg-blue-700"
                          }`}
                        >
                          <span>{isDone ? t("attendance") : t("fillAttendance")}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Antrean Penilaian Siswa */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="font-display text-base font-bold text-slate-950 tracking-tight">
                  {t("gradingQueue")}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {antreanPenilaian.length > 0
                    ? t("pendingAssessmentsCount", { count: antreanPenilaian.length })
                    : t("allTasksGraded")}
                </p>
              </div>
              <Link
                href="/teacher/grades"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <span>{t("gradesPage")}</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {antreanPenilaian.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {antreanPenilaian.slice(0, 6).map((item, idx) => {
                  const initial = (item.anakNama?.[0] || "S").toUpperCase();
                  const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                  return (
                    <div
                      key={item.key}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 hover:bg-slate-50/80 px-2 rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${colorClass}`}>
                          {initial}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {item.anakNama}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{item.penilaianJudul}</span>
                            <span>·</span>
                            <span>{item.kelasNama}</span>
                            <span>·</span>
                            <span className="font-medium text-amber-700 bg-amber-50 rounded px-1.5 py-0.5 border border-amber-200">
                              {t("notYetGraded")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/teacher/grades/${item.pendaftaranId}`}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors cursor-pointer min-h-[38px] shrink-0"
                      >
                        <span>{t("giveGrade")}</span>
                      </Link>
                    </div>
                  );
                })}

                {antreanPenilaian.length > 6 && (
                  <div className="pt-3 text-center">
                    <Link
                      href="/teacher/grades"
                      className="text-xs font-semibold text-blue-600 hover:underline"
                    >
                      {t("viewAllGradingQueue", { count: antreanPenilaian.length })}
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-6 text-center space-y-1">
                <CheckCircle2 className="size-6 text-emerald-600 mx-auto" />
                <p className="text-sm font-semibold text-slate-950">{t("allTasksGraded")}</p>
                <p className="text-xs text-slate-600">{t("noNewAssessments")}</p>
              </div>
            )}
          </div>

          {/* Pintasan Aksi Cepat */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-3.5">
            {/* 1. Catat Presensi */}
            <Link
              href={firstUnfinishedSession ? `/teacher/classes/${firstUnfinishedSession.kelasId}/sessions/${hariIniStr}/attendance` : "/teacher/classes"}
              className="group relative flex flex-col items-center justify-center text-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all shadow-2xs min-h-[104px]"
            >
              <ArrowUpRight className="absolute top-2.5 right-2.5 size-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
              <ClipboardCheck className="size-7 sm:size-8 text-blue-600 dark:text-blue-400 stroke-[1.75] transition-transform duration-200 group-hover:scale-110" />
              <p className="mt-2 text-xs font-bold text-slate-950 dark:text-slate-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {t("quickAttendance")}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {sesiHariIni.length > 0 ? `${sesiHariIni.length} sesi hari ini` : "Presensi kelas"}
              </p>
            </Link>

            {/* 2. Buat Penilaian */}
            <Link
              href="/teacher/grades/new"
              className="group relative flex flex-col items-center justify-center text-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 hover:border-amber-300 dark:hover:border-amber-800 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all shadow-2xs min-h-[104px]"
            >
              <ArrowUpRight className="absolute top-2.5 right-2.5 size-3.5 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 transition-colors" />
              <FileCheck className="size-7 sm:size-8 text-amber-600 dark:text-amber-400 stroke-[1.75] transition-transform duration-200 group-hover:scale-110" />
              <p className="mt-2 text-xs font-bold text-slate-950 dark:text-slate-50 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {t("quickNewAssessment")}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                Input nilai tugas
              </p>
            </Link>

            {/* 3. Jurnal Pembelajaran */}
            <Link
              href="/teacher/status"
              className="group relative flex flex-col items-center justify-center text-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all shadow-2xs min-h-[104px]"
            >
              <ArrowUpRight className="absolute top-2.5 right-2.5 size-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
              <BookOpen className="size-7 sm:size-8 text-emerald-600 dark:text-emerald-400 stroke-[1.75] transition-transform duration-200 group-hover:scale-110" />
              <p className="mt-2 text-xs font-bold text-slate-950 dark:text-slate-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {t("quickLearningJournal")}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                Catatan belajar
              </p>
            </Link>

            {/* 4. Kalender Jadwal */}
            <Link
              href="/teacher/calendar"
              className="group relative flex flex-col items-center justify-center text-center rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all shadow-2xs min-h-[104px]"
            >
              <ArrowUpRight className="absolute top-2.5 right-2.5 size-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
              <CalendarDays className="size-7 sm:size-8 text-indigo-600 dark:text-indigo-400 stroke-[1.75] transition-transform duration-200 group-hover:scale-110" />
              <p className="mt-2 text-xs font-bold text-slate-950 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {t("quickFullCalendar")}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                Jadwal tatap muka
              </p>
            </Link>
          </div>
        </div>

        {/* Kolom Kanan: Jadwal Kalender Sesi */}
        <div className="lg:col-span-4 order-2 space-y-6">
          <TeacherScheduleWidget
            sessions={scheduleSessions}
            todayStr={hariIniStr}
            locale={locale}
          />
        </div>

      </div>
    </div>
  );
}
