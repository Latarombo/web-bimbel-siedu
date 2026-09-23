import { getTranslations, getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { tanggalWIB, hariDariTanggal } from "@/lib/hari";
import { TeacherScheduleWidget, type ScheduleSessionItem } from "@/components/teacher/dashboard/teacher-schedule-widget";
import {
  ChevronRight,
  Calendar,
  CheckCircle2,
  GraduationCap,
  BookOpen,
} from "lucide-react";

export const dynamic = "force-dynamic";

const WIB = "Asia/Jakarta";

const JENJANG_BADGE: Record<string, { badge: string; text: string }> = {
  TK: { badge: "bg-pink-50 text-pink-700 border-pink-200", text: "text-pink-700" },
  SD: { badge: "bg-blue-50 text-blue-700 border-blue-200", text: "text-blue-700" },
  SMP: { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-emerald-700" },
  SMA: { badge: "bg-amber-50 text-amber-800 border-amber-200", text: "text-amber-800" },
};

const AVATAR_COLORS = [
  "bg-blue-500 text-white",
  "bg-amber-500 text-white",
  "bg-emerald-500 text-white",
  "bg-purple-500 text-white",
  "bg-rose-500 text-white",
  "bg-sky-500 text-white",
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

  const sesiHariIni = scheduleSessions.filter((s) => s.hari === hari && hariIniStr >= s.periodeMulai && hariIniStr <= s.periodeSelesai);
  const totalSiswaHariIni = sesiHariIni.reduce((acc, s) => acc + s.totalSiswa, 0);
  const totalTerisiHariIni = sesiHariIni.reduce((acc, s) => acc + Math.min(s.terisiCount, s.totalSiswa), 0);
  const pctPresensi = totalSiswaHariIni > 0 ? Math.round((totalTerisiHariIni / totalSiswaHariIni) * 100) : 100;

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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ======================================================= */}
        {/* LEFT COLUMN: Main Area                                  */}
        {/* ======================================================= */}
        <div className="space-y-6 lg:col-span-8 order-1">
          
          {/* 1. Header (Pola Hero Katalog: Solid #1d4ed8 dengan aksen gelombang sudut) */}
          <div className="relative overflow-hidden rounded-2xl bg-[#1d4ed8] p-5 sm:p-6 text-white shadow-xs">
            {/* Gelombang sudut tanpa gradient */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
              <svg
                className="absolute -right-6 -top-6 w-64 sm:w-80 md:w-96"
                viewBox="0 0 400 280"
                fill="none"
              >
                <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="white" fillOpacity="0.05" />
                <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="white" fillOpacity="0.07" />
                <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="white" fillOpacity="0.09" />
              </svg>

              <svg
                className="absolute -left-6 -bottom-6 w-56 sm:w-72 md:w-80"
                viewBox="0 0 360 260"
                fill="none"
              >
                <path d="M0 60 C90 105, 180 175, 280 260 L0 260 Z" fill="white" fillOpacity="0.05" />
                <path d="M0 120 C75 155, 145 205, 210 260 L0 260 Z" fill="white" fillOpacity="0.07" />
                <path d="M0 180 C50 205, 100 230, 140 260 L0 260 Z" fill="white" fillOpacity="0.08" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {t("welcomeTeacher", { name: teacherName })}
                </h1>
                <p className="text-xs sm:text-sm text-blue-100 mt-0.5">
                  {tanggalLengkap}
                </p>
              </div>

              {sesiHariIni.length > 0 ? (
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 border border-white/20 backdrop-blur-xs px-3.5 py-2 self-start sm:self-center">
                  <span className="size-2 rounded-full bg-emerald-400 ring-2 ring-emerald-400/30" />
                  <span className="text-xs font-bold text-white">
                    {t("sessionsCountToday", { count: sesiHariIni.length })}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-xs px-3.5 py-2 self-start sm:self-center">
                  <span className="size-2 rounded-full bg-blue-200" />
                  <span className="text-xs font-semibold text-blue-100">
                    {t("noScheduleToday")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. 4 Metric Overview Cards (Minimalis Elegan dengan Divider Halus & Interaktif) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Card 1: Kelas Diampu */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4.5 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t("taughtClasses")}
                </p>
                <p className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  {kelasAktif.length}
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-400">{t("activeGroups")}</span>
                <span className="font-semibold text-slate-600">{t("totalClassesCount", { count: kelas.length })}</span>
              </div>
            </div>

            {/* Card 2: Total Murid */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4.5 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t("totalStudents")}
                </p>
                <p className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  {uniqueStudentsCount}
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-400">{t("registeredStudents")}</span>
                <span className="font-semibold text-slate-600">{t("enrollmentsCount", { count: siswaAktif.length })}</span>
              </div>
            </div>

            {/* Card 3: Perlu Dinilai */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4.5 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t("needsGrading")}
                </p>
                <p className={`mt-2 text-3xl sm:text-4xl font-black tracking-tight transition-colors ${antreanPenilaian.length > 0 ? "text-amber-600 group-hover:text-amber-700" : "text-slate-900 group-hover:text-blue-600"}`}>
                  {antreanPenilaian.length}
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-400">{t("evaluationQueue")}</span>
                {antreanPenilaian.length > 0 ? (
                  <span className="font-bold text-amber-600">{t("statusPending")}</span>
                ) : (
                  <span className="font-semibold text-emerald-600">{t("statusDone")}</span>
                )}
              </div>
            </div>

            {/* Card 4: Presensi Sesi */}
            <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4.5 sm:p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)] transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
              <div>
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  {t("sessionAttendanceMetric")}
                </p>
                <p className="mt-2 text-3xl sm:text-4xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  {sesiHariIni.length > 0 ? `${pctPresensi}%` : "100%"}
                </p>
              </div>
              <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="font-medium text-slate-400">
                  {sesiHariIni.length > 0 ? t("studentsRatio", { filled: totalTerisiHariIni, total: totalSiswaHariIni }) : t("noScheduleToday")}
                </span>
                <span className="font-semibold text-slate-600">
                  {sesiHariIni.length > 0 ? t("sessionsCountStat", { count: sesiHariIni.length }) : t("todayLabel")}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Kelas Diampu (Clean Grid with Single Detail Action) */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {t("taughtClasses")}
              </h2>
              <Link
                href="/teacher/classes"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
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

                  return (
                    <div
                      key={k.id}
                      className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:border-blue-200 hover:shadow-sm transition-all"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-bold ${tema.badge}`}>
                            <GraduationCap className="size-3.5" />
                            {k.jenjang} {k.tingkat ? `· ${k.tingkat}` : ""}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 truncate max-w-[140px]">
                            {p?.nama ?? t("activePeriodDefault")}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {m?.nama ?? t("subjectDefault")}
                          </h3>
                          {m?.deskripsi && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {m.deskripsi}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-slate-50 rounded-xl p-2.5">
                          <Calendar className="size-4 shrink-0 text-slate-400" />
                          <span className="line-clamp-1">{jadwalStr}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                          <div className="flex items-center">
                            <div className="flex -space-x-2 overflow-hidden">
                              {students.slice(0, 3).map((s, idx) => {
                                const anak = anakById.get(s.anakId);
                                const initial = (anak?.nama?.[0] || "S").toUpperCase();
                                const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                                return (
                                  <div
                                    key={s.id}
                                    title={anak?.nama}
                                    className={`inline-grid size-7 place-items-center rounded-full ring-2 ring-white text-[11px] font-bold ${colorClass}`}
                                  >
                                    {initial}
                                  </div>
                                );
                              })}
                            </div>
                            <span className="ml-2.5 text-xs font-semibold text-slate-600">
                              {t("studentsCount", { count: students.length })}
                            </span>
                          </div>

                          <span className="text-[11px] font-bold text-slate-400">
                            {t("quotaRatio", { count: students.length, max: k.kuotaMaksimum })}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <Link
                          href={`/teacher/classes/${k.id}`}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-4 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-[0.99] transition-all cursor-pointer"
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
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center space-y-1.5">
                <BookOpen className="size-8 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-700">{t("noActiveClassesYet")}</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {t("noActiveClassesDesc")}
                </p>
              </div>
            )}
          </div>

          {/* 4. Antrean Penilaian */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {t("gradingQueue")}
              </h2>
              <Link
                href="/teacher/grades"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <span>{t("gradesPage")}</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            {antreanPenilaian.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                <div className="divide-y divide-slate-100">
                  {antreanPenilaian.slice(0, 5).map((item, idx) => {
                    const initial = (item.anakNama?.[0] || "S").toUpperCase();
                    const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];

                    return (
                      <div
                        key={item.key}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`grid size-9 shrink-0 place-items-center rounded-xl text-xs font-black shadow-2xs ${colorClass}`}>
                            {initial}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900">
                              {item.anakNama}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[11px] text-slate-500">
                                {item.penilaianJudul}
                              </span>
                              <span className="text-slate-300">·</span>
                              <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600">
                                {item.kelasNama}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg sm:hidden">
                            {t("notYetGraded")}
                          </span>
                          <Link
                            href={`/teacher/grades/${item.pendaftaranId}`}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-600 hover:text-white transition-all cursor-pointer"
                          >
                            <span>{t("giveGrade")}</span>
                            <ChevronRight className="size-3" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {antreanPenilaian.length > 5 && (
                  <div className="bg-slate-50/80 p-3 text-center border-t border-slate-100">
                    <Link
                      href="/teacher/grades"
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      {t("viewAllGradingQueue", { count: antreanPenilaian.length })}
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-white p-6 text-center space-y-1.5">
                <div className="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-600 mx-auto">
                  <CheckCircle2 className="size-5 stroke-[2.5]" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {t("allTasksGraded")}
                </p>
                <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                  {t("noNewAssessments")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================= */}
        {/* RIGHT COLUMN: Interactive Schedule & Calendar Rail       */}
        {/* ======================================================= */}
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
