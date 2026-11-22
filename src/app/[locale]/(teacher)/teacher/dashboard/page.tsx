import { getTranslations, getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { tanggalWIB, hariDariTanggal } from "@/lib/format/hari";
import { TeacherScheduleWidget, type ScheduleSessionItem } from "@/components/teacher/dashboard/teacher-schedule-widget";
import { TrenKehadiranCard } from "@/components/teacher/dashboard-charts";
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
  const [wibYear, wibMonth, wibDay] = hariIniStr.split("-").map(Number);
  const baseWibDate = new Date(Date.UTC(wibYear, wibMonth - 1, wibDay, 12, 0, 0));

  const hariAktivitasData: {
    label: string;
    fullLabel: string;
    hadir: number;
    izin: number;
    sakit: number;
    alpa: number;
    total: number;
    rate: number;
    isToday: boolean;
    fill: string;
  }[] = [];

  let total7HariHadir = 0;
  let total7HariIzin = 0;
  let total7HariSakit = 0;
  let total7HariAlpa = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(baseWibDate.getTime() - i * 86_400_000);
    const dStr = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
      weekday: "short",
      timeZone: "UTC",
    });
    const fullDayName = d.toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });

    const records = presensiSesi.filter((p) => p.tanggalPertemuan === dStr);
    const hadir = records.filter((p) => p.status === "hadir").length;
    const izin = records.filter((p) => p.status === "izin").length;
    const sakit = records.filter((p) => p.status === "sakit").length;
    const alpa = records.filter((p) => p.status === "alpa").length;
    const total = records.length;
    const rate = total > 0 ? Math.round((hadir / total) * 100) : 100;

    total7HariHadir += hadir;
    total7HariIzin += izin;
    total7HariSakit += sakit;
    total7HariAlpa += alpa;

    const isToday = i === 0;
    const todaySuffix = locale === "en" ? " (Today)" : " (Hari Ini)";

    hariAktivitasData.push({
      label: dayName,
      fullLabel: isToday ? `${fullDayName}${todaySuffix}` : fullDayName,
      hadir,
      izin,
      sakit,
      alpa,
      total,
      rate,
      isToday,
      fill: isToday ? "#2563eb" : "#94a3b8",
    });
  }

  const total7HariPresensi = total7HariHadir + total7HariIzin + total7HariSakit + total7HariAlpa;
  const overallAttendanceRate =
    total7HariPresensi > 0 ? Math.round((total7HariHadir / total7HariPresensi) * 100) : 100;

  const firstUnfinishedSession = sesiHariIni.find((s) => s.terisiCount < s.totalSiswa || s.totalSiswa === 0);
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
      
      {/* 1. Header Bersih Tanpa Gradient & Basa-basi Sapaan */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {sesiHariIni.length > 0
            ? t("sessionsTodayHeading", { count: sesiHariIni.length })
            : t("teachingAgenda")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          {tanggalLengkap}
        </p>
      </div>

      {/* 2. Hero Section: Tren Hadir 7 Hari Terakhir (Kiri) & 3 Kartu Metrik Vertikal (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Sisi Kiri: Tren Hadir 7 Hari Terakhir (8 Kolom di Desktop) */}
        <div className="lg:col-span-8 flex flex-col">
          <TrenKehadiranCard
            aktivitasData={hariAktivitasData}
            title={t("weeklyAttendanceTrendTitle")}
            subtitle={t("weeklyTrendSubtitle")}
            overallAttendanceRate={overallAttendanceRate}
            totalAktivitasHadir={total7HariHadir}
            totalAktivitasIzinSakit={total7HariIzin + total7HariSakit}
            totalAktivitasAlpa={total7HariAlpa}
            totalPresensi7Hari={total7HariPresensi}
            emptyTitle={t("noAttendanceDataYet")}
            emptyDesc={t("noAttendanceDataDesc")}
          />
        </div>

        {/* Sisi Kanan: 3 Kartu Metrik Berbaris ke Bawah (4 Kolom di Desktop, Sejajar Tinggi) */}
        <div className="lg:col-span-4 grid grid-cols-2 lg:flex lg:flex-col lg:justify-between gap-4 h-full">
          {/* Card 1: Sesi Hari Ini (Full width pada mobile 2-cols) */}
          <div className="col-span-2 lg:col-span-1 flex flex-col justify-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xs lg:flex-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("todaySessions")}
            </span>
            <span className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
              {sesiHariIni.length}
            </span>
          </div>

          {/* Card 2: Total Murid */}
          <div className="col-span-1 flex flex-col justify-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xs lg:flex-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("totalStudents")}
            </span>
            <span className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums">
              {uniqueStudentsCount}
            </span>
          </div>

          {/* Card 3: Perlu Dinilai */}
          <div className="col-span-1 flex flex-col justify-center rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xs lg:flex-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t("needsGrading")}
            </span>
            <span className={`mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${antreanPenilaian.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-950 dark:text-white"}`}>
              {antreanPenilaian.length}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Konten Utama Terbagi dalam Grid 12 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Kolom Kiri: Alur Operasional */}
        <div className="lg:col-span-8 order-1 space-y-6">

          {/* Sesi Mengajar Hari Ini */}
          {sesiHariIni.length > 0 ? (
            <div className="space-y-4">
              <div>
                <h2 className="font-display text-base font-bold text-slate-950 dark:text-slate-50 tracking-tight">
                  {t("todayFocusTitle")}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{t("todayFocusDesc")}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sesiHariIni.map((session) => {
                  const tema = JENJANG_BADGE[session.jenjang] || JENJANG_BADGE.SD;
                  const isDone = session.totalSiswa > 0 && session.terisiCount >= session.totalSiswa;

                  return (
                    <div
                      key={session.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 shadow-2xs transition-all space-y-4"
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
                          <p className="text-xs text-slate-600 line-clamp-1 mt-1">
                            {session.kelasNama}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        {isDone ? (
                          <span className="inline-flex items-center gap-2 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            <Check className="size-4 stroke-[2.5]" />
                            <span>{t("attendanceRecordedBadge", { filled: session.terisiCount, total: session.totalSiswa })}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-800">
                            <AlertCircle className="size-4" />
                            <span>{t("attendancePendingBadge")}</span>
                          </span>
                        )}

                        <Link
                          href={`/teacher/classes/${session.kelasId}/sessions/${hariIniStr}/attendance`}
                          className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold h-10 transition-colors cursor-pointer ${
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
          <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="font-display text-base font-bold text-slate-950 tracking-tight">
                  {t("gradingQueue")}
                </h2>
                <p className="text-xs text-slate-600 mt-1">
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
                <ChevronRight className="size-4" />
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 hover:bg-slate-50/80 px-2 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${colorClass}`}>
                          {initial}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950">
                            {item.anakNama}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-600">
                            <span className="font-medium text-slate-800">{item.penilaianJudul}</span>
                            <span>·</span>
                            <span>{item.kelasNama}</span>
                            <span>·</span>
                            <span className="font-medium text-amber-700 bg-amber-50 rounded px-2 py-0.5 border border-amber-200">
                              {t("notYetGraded")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/teacher/grades/${item.pendaftaranId}`}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-800 transition-colors cursor-pointer h-10 shrink-0"
                      >
                        <span>{t("giveGrade")}</span>
                      </Link>
                    </div>
                  );
                })}

                {antreanPenilaian.length > 6 && (
                  <div className="pt-4 text-center">
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* 1. Catat Presensi */}
            <Link
              href={firstUnfinishedSession ? `/teacher/classes/${firstUnfinishedSession.kelasId}/sessions/${hariIniStr}/attendance` : "/teacher/classes"}
              className="group relative flex flex-col items-center justify-center text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-blue-300 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all shadow-2xs min-h-24 sm:min-h-28"
            >
              <ArrowUpRight className="absolute top-4 right-4 size-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
              <ClipboardCheck className="size-8 text-blue-600 dark:text-blue-400 stroke-[1.75] transition-transform duration-200 group-hover:scale-110" />
              <p className="mt-2 text-xs font-bold text-slate-950 dark:text-slate-50 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {t("quickAttendance")}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                {sesiHariIni.length > 0 ? `${sesiHariIni.length} sesi hari ini` : "Presensi kelas"}
              </p>
            </Link>

            {/* 2. Buat Penilaian */}
            <Link
              href="/teacher/grades"
              className="group relative flex flex-col items-center justify-center text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-amber-300 dark:hover:border-amber-800 hover:bg-amber-50/30 dark:hover:bg-amber-950/20 transition-all shadow-2xs min-h-24 sm:min-h-28"
            >
              <ArrowUpRight className="absolute top-4 right-4 size-4 text-slate-300 dark:text-slate-600 group-hover:text-amber-500 transition-colors" />
              <FileCheck className="size-8 text-amber-600 dark:text-amber-400 stroke-[1.75] transition-transform duration-200 group-hover:scale-110" />
              <p className="mt-2 text-xs font-bold text-slate-950 dark:text-slate-50 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {t("quickNewAssessment")}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                Input nilai tugas
              </p>
            </Link>

            {/* 3. Jurnal Pembelajaran */}
            <Link
              href="/teacher/status"
              className="group relative flex flex-col items-center justify-center text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-emerald-300 dark:hover:border-emerald-800 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 transition-all shadow-2xs min-h-24 sm:min-h-28"
            >
              <ArrowUpRight className="absolute top-4 right-4 size-4 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
              <BookOpen className="size-8 text-emerald-600 dark:text-emerald-400 stroke-[1.75] transition-transform duration-200 group-hover:scale-110" />
              <p className="mt-2 text-xs font-bold text-slate-950 dark:text-slate-50 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {t("quickLearningJournal")}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                Catatan belajar
              </p>
            </Link>

            {/* 4. Kalender Jadwal */}
            <Link
              href="/teacher/calendar"
              className="group relative flex flex-col items-center justify-center text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 hover:border-indigo-300 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-all shadow-2xs min-h-24 sm:min-h-28"
            >
              <ArrowUpRight className="absolute top-4 right-4 size-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
              <CalendarDays className="size-8 text-indigo-600 dark:text-indigo-400 stroke-[1.75] transition-transform duration-200 group-hover:scale-110" />
              <p className="mt-2 text-xs font-bold text-slate-950 dark:text-slate-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {t("quickFullCalendar")}
              </p>
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
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
