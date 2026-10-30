import { getTranslations, getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { tanggalWIB, hariDariTanggal } from "@/lib/hari";
import { TeacherScheduleWidget, type ScheduleSessionItem } from "@/components/teacher/dashboard/teacher-schedule-widget";
import { TeacherAnalyticsSection } from "@/components/teacher/dashboard-charts";
import { TeacherDashboardTabs } from "@/components/teacher/dashboard/teacher-dashboard-tabs";
import {
  ChevronRight,
  Calendar,
  CheckCircle2,
  GraduationCap,
  BookOpen,
  Clock,
  ClipboardCheck,
  TrendingUp,
  Users,
  AlertCircle,
  FileText,
  CalendarDays,
  ArrowUpRight,
  Check,
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
  const pctPresensiHariIni = totalSiswaHariIni > 0 ? Math.round((totalTerisiHariIni / totalSiswaHariIni) * 100) : 100;

  // 7. Overall attendance calculations & 7-day trend
  const hadirCount = presensiSesi.filter((p) => p.status === "hadir").length;
  const izinCount = presensiSesi.filter((p) => p.status === "izin").length;
  const sakitCount = presensiSesi.filter((p) => p.status === "sakit").length;
  const alpaCount = presensiSesi.filter((p) => p.status === "alpa").length;
  const totalPresensiAll = hadirCount + izinCount + sakitCount + alpaCount;
  const overallAttendanceRate = totalPresensiAll > 0 ? Math.round((hadirCount / totalPresensiAll) * 100) : 100;

  const hariAktivitasData: { label: string; hadir: number }[] = [];
  let totalAktivitasHadir = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(sekarang);
    d.setDate(d.getDate() - i);
    const dStr = tanggalWIB(d);
    const dayLabel = d.toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
      weekday: "short",
      day: "numeric",
      timeZone: WIB,
    });
    const hadirDay = presensiSesi.filter(
      (p) => p.tanggalPertemuan === dStr && p.status === "hadir"
    ).length;
    totalAktivitasHadir += hadirDay;
    hariAktivitasData.push({ label: dayLabel, hadir: hadirDay });
  }

  const rekapPresensiData = [
    { key: "hadir", label: t("statusHadir") || "Hadir", value: hadirCount, color: "#10b981" },
    { key: "izin", label: t("statusIzin") || "Izin", value: izinCount, color: "#f59e0b" },
    { key: "sakit", label: t("statusSakit") || "Sakit", value: sakitCount, color: "#0ea5e9" },
    { key: "alpa", label: t("statusAlpa") || "Alpa", value: alpaCount, color: "#f43f5e" },
  ];

  // 8. Next upcoming session finder if no session today
  const HARI_ORDER = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  let nextSession: {
    session: ScheduleSessionItem;
    dayLabel: string;
    diffDays: number;
  } | null = null;

  for (let offset = 1; offset <= 7; offset++) {
    const targetDate = new Date(sekarang);
    targetDate.setDate(targetDate.getDate() + offset);
    const targetDateStr = tanggalWIB(targetDate);
    const targetDayIndex = targetDate.getDay();
    const targetHariName = HARI_ORDER[targetDayIndex];

    const match = scheduleSessions.find((s) => {
      return (
        s.hari === targetHariName &&
        targetDateStr >= s.periodeMulai &&
        targetDateStr <= s.periodeSelesai
      );
    });

    if (match) {
      const dayLabel = targetDate.toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
        weekday: "long",
        day: "numeric",
        month: "short",
        timeZone: WIB,
      });
      nextSession = {
        session: match,
        dayLabel,
        diffDays: offset,
      };
      break;
    }
  }

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

  // =========================================================================
  // TAB CONTENT BUILDERS
  // =========================================================================

  // TAB 1: AGENDA & TUGAS
  const agendaTabContent = (
    <div className="space-y-6">
      {/* Sesi Mengajar Hari Ini */}
      {sesiHariIni.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {t("todayFocusTitle")}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">{t("todayFocusDesc")}</p>
            </div>
            <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
              {sesiHariIni.length} Sesi Terjadwal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {sesiHariIni.map((session) => {
              const tema = JENJANG_BADGE[session.jenjang] || JENJANG_BADGE.SD;
              const isDone = session.totalSiswa > 0 && session.terisiCount >= session.totalSiswa;

              return (
                <div
                  key={session.id}
                  className="flex flex-col justify-between rounded-md border border-slate-200 bg-slate-50/50 p-3.5 hover:bg-white hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                        <Clock className="size-3.5 text-slate-500" />
                        {session.jamMulai} - {session.jamSelesai} WIB
                      </span>
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold ${tema.badge}`}>
                        {session.jenjang} {session.tingkat ? `· ${session.tingkat}` : ""}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-1">
                        {session.mapel}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {session.kelasNama} · {session.totalSiswa} Siswa
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
                      className={`inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-xs font-semibold min-h-[38px] transition-colors cursor-pointer ${
                        isDone
                          ? "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                    >
                      <ClipboardCheck className="size-3.5" />
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
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {t("gradingQueue")}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
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
                    <div className={`grid size-8 shrink-0 place-items-center rounded-md text-xs font-bold ${colorClass}`}>
                      {initial}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.anakNama}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-xs text-slate-500">
                        <span className="font-medium text-slate-700">{item.penilaianJudul}</span>
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
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition-colors cursor-pointer min-h-[38px] shrink-0"
                  >
                    <span>{t("giveGrade")}</span>
                    <ChevronRight className="size-3" />
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
            <p className="text-sm font-semibold text-slate-800">{t("allTasksGraded")}</p>
            <p className="text-xs text-slate-500">{t("noNewAssessments")}</p>
          </div>
        )}
      </div>

      {/* Pintasan Aksi Cepat */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href={firstUnfinishedSession ? `/teacher/classes/${firstUnfinishedSession.kelasId}/sessions/${hariIniStr}/attendance` : "/teacher/classes"}
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 hover:border-slate-300 hover:bg-slate-50 transition-all min-h-[88px]"
        >
          <div className="flex items-center justify-between">
            <ClipboardCheck className="size-4 text-blue-600" />
            <ArrowUpRight className="size-3.5 text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{t("quickAttendance")}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
              {sesiHariIni.length > 0 ? `${sesiHariIni.length} sesi hari ini` : "Presensi kelas"}
            </p>
          </div>
        </Link>

        <Link
          href="/teacher/grades/new"
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 hover:border-slate-300 hover:bg-slate-50 transition-all min-h-[88px]"
        >
          <div className="flex items-center justify-between">
            <GraduationCap className="size-4 text-emerald-600" />
            <ArrowUpRight className="size-3.5 text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{t("quickNewAssessment")}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">Input nilai tugas</p>
          </div>
        </Link>

        <Link
          href="/teacher/status"
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 hover:border-slate-300 hover:bg-slate-50 transition-all min-h-[88px]"
        >
          <div className="flex items-center justify-between">
            <FileText className="size-4 text-purple-600" />
            <ArrowUpRight className="size-3.5 text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{t("quickLearningJournal")}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">Catatan pembelajaran</p>
          </div>
        </Link>

        <Link
          href="/teacher/calendar"
          className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-3.5 hover:border-slate-300 hover:bg-slate-50 transition-all min-h-[88px]"
        >
          <div className="flex items-center justify-between">
            <CalendarDays className="size-4 text-amber-600" />
            <ArrowUpRight className="size-3.5 text-slate-400" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-900">{t("quickFullCalendar")}</p>
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">Jadwal tatap muka</p>
          </div>
        </Link>
      </div>
    </div>
  );

  // TAB 2: DAFTAR KELAS
  const classesTabContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {t("taughtClasses")}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar rombongan belajar aktif yang Anda ampu semester ini.
          </p>
        </div>
        <Link
          href="/teacher/classes"
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          <span>{t("viewAll")}</span>
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {kelasAktif.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {kelasAktif.map((k) => {
            const m = mapelById.get(k.mataPelajaranId);
            const p = periodeById.get(k.periodeId);
            const students = siswaByKelas.get(k.id) ?? [];
            const tema = JENJANG_BADGE[k.jenjang] || JENJANG_BADGE.SD;

            const jadwalKelas = jadwal.filter((j) => j.kelasId === k.id);
            const jadwalStr = jadwalKelas.length > 0
              ? jadwalKelas.map((j) => `${j.hari} (${j.jamMulai} - ${j.jamSelesai})`).join(", ")
              : t("scheduleNotSet");

            const capacityPct = k.kuotaMaksimum > 0 ? Math.min(100, Math.round((students.length / k.kuotaMaksimum) * 100)) : 0;

            return (
              <div
                key={k.id}
                className="flex flex-col justify-between rounded-lg border border-slate-200 bg-white p-4 sm:p-5 hover:border-slate-300 transition-all space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-semibold ${tema.badge}`}>
                      {k.jenjang} {k.tingkat ? `· ${k.tingkat}` : ""}
                    </span>
                    <span className="text-xs text-slate-500 truncate max-w-[150px]">
                      {p?.nama ?? t("activePeriodDefault")}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                      {m?.nama ?? t("subjectDefault")}
                    </h3>
                    {m?.deskripsi && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                        {m.deskripsi}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 rounded-md p-2.5">
                    <Calendar className="size-4 shrink-0 text-slate-500" />
                    <span className="line-clamp-1">{jadwalStr}</span>
                  </div>

                  {/* Quota Progress */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">{t("quotaCapacity")}</span>
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {students.length}/{k.kuotaMaksimum} siswa ({capacityPct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-xs bg-slate-100">
                      <div
                        className={`h-full rounded-xs ${tema.bar}`}
                        style={{ width: `${capacityPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-600 font-medium">
                    {t("studentsCount", { count: students.length })}
                  </span>
                  <Link
                    href={`/teacher/classes/${k.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 py-2 px-3 text-xs font-semibold text-white transition-colors min-h-[38px]"
                  >
                    <span>{t("classDetail")}</span>
                    <ChevronRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center space-y-1.5">
          <BookOpen className="size-8 mx-auto text-slate-400" />
          <p className="text-sm font-bold text-slate-700">{t("noActiveClassesYet")}</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t("noActiveClassesDesc")}
          </p>
        </div>
      )}
    </div>
  );

  // TAB 3: ANALITIK KEHADIRAN
  const analyticsTabContent = (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            {t("analyticsSectionTitle")}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan data kehadiran siswa pada seluruh kelas yang Anda ampu.
          </p>
        </div>
        <span className="text-xs font-medium text-slate-500">
          Total {totalPresensiAll} presensi tercatat
        </span>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-5">
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
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      
      {/* 1. Header Bersih Tanpa Gradient */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {t("welcomeTeacher", { name: teacherName })}
          </h1>
          <p className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            <Calendar className="size-4 text-slate-400" />
            <span>{tanggalLengkap} · Waktu Indonesia Barat</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {sesiHariIni.length > 0 ? (
            <div className="inline-flex items-center gap-2 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1.5 text-xs font-semibold text-blue-800 dark:text-blue-300">
              <span className="size-2 rounded-full bg-blue-600 dark:bg-blue-400" />
              <span>{t("sessionsCountToday", { count: sesiHariIni.length })}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="size-2 rounded-full bg-slate-400" />
              <span>{t("noScheduleToday")}</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. Urgent Action Alert (Muncul jika ada sesi yang belum dicatat) */}
      {firstUnfinishedSession ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50/70 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-md bg-amber-100 text-amber-800 mt-0.5">
                <Clock className="size-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Presensi Belum Dicatat
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 mt-0.5">
                  Sesi <strong>{firstUnfinishedSession.mapel}</strong> ({firstUnfinishedSession.jamMulai} - {firstUnfinishedSession.jamSelesai} WIB) di rombel {firstUnfinishedSession.kelasNama} memerlukan pencatatan kehadiran.
                </p>
              </div>
            </div>
            <Link
              href={`/teacher/classes/${firstUnfinishedSession.kelasId}/sessions/${hariIniStr}/attendance`}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all min-h-[44px] shrink-0"
            >
              <ClipboardCheck className="size-4" />
              <span>{t("recordAttendanceNow")}</span>
            </Link>
          </div>
        </div>
      ) : sesiHariIni.length > 0 ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
            <p className="text-xs sm:text-sm font-medium text-emerald-800">
              {t("allAttendanceDoneToday")}
            </p>
          </div>
        </div>
      ) : nextSession ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <CalendarDays className="size-5 text-slate-500 shrink-0" />
            <p className="text-xs sm:text-sm text-slate-700">
              Jadwal mengajar berikutnya: <strong className="text-slate-900">{nextSession.dayLabel}</strong> ({nextSession.session.jamMulai} - {nextSession.session.jamSelesai} WIB) · {nextSession.session.mapel}
            </p>
          </div>
        </div>
      ) : null}

      {/* 3. Ringkasan 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Kelas Diampu */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("taughtClasses")}
            </p>
            <BookOpen className="size-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {kelasAktif.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("totalClassesCount", { count: kelas.length })}
          </p>
        </div>

        {/* Card 2: Total Murid */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("totalStudents")}
            </p>
            <Users className="size-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {uniqueStudentsCount}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("enrollmentsCount", { count: siswaAktif.length })}
          </p>
        </div>

        {/* Card 3: Perlu Dinilai */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t("needsGrading")}
            </p>
            {antreanPenilaian.length > 0 ? (
              <AlertCircle className="size-4 text-amber-500" />
            ) : (
              <CheckCircle2 className="size-4 text-emerald-500" />
            )}
          </div>
          <p className={`mt-2 text-2xl sm:text-3xl font-bold tracking-tight tabular-nums ${antreanPenilaian.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"}`}>
            {antreanPenilaian.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {antreanPenilaian.length > 0 ? "Menunggu penilaian" : t("statusDone")}
          </p>
        </div>

        {/* Card 4: Kehadiran Hari Ini / Keseluruhan */}
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {sesiHariIni.length > 0 ? "Kehadiran Hari Ini" : t("overallAttendanceRate")}
            </p>
            <TrendingUp className="size-4 text-slate-400" />
          </div>
          <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
            {sesiHariIni.length > 0 ? `${pctPresensiHariIni}%` : `${overallAttendanceRate}%`}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {sesiHariIni.length > 0 ? t("studentsRatio", { filled: totalTerisiHariIni, total: totalSiswaHariIni }) : `${totalPresensiAll} presensi`}
          </p>
        </div>
      </div>

      {/* 4. Konten Utama Terbagi dalam Grid 12 Kolom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Kolom Kiri: Tab Berorientasi Tugas */}
        <div className="lg:col-span-8 order-1">
          <TeacherDashboardTabs
            agendaContent={agendaTabContent}
            classesContent={classesTabContent}
            analyticsContent={analyticsTabContent}
            todaySessionsCount={sesiHariIni.length}
            pendingGradingCount={antreanPenilaian.length}
            activeClassesCount={kelasAktif.length}
            labels={{
              agendaTab: "Agenda & Tugas",
              classesTab: t("taughtClasses"),
              analyticsTab: "Analitik Kehadiran",
            }}
          />
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
