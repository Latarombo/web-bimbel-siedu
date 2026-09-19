import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { hariDariTanggal, tanggalWIB, dalamJendela7Hari } from "@/lib/hari";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

/*
 * Dashboard guru — gaya sama dengan dashboard admin: panel putih border
 * slate-200 + shadow eksplisit, BUKAN token globals.css. Angka semua dari DB.
 * Pola widget dari referensi (EduFlow 27345877, Kuest 21910109): sesi hari ini
 * dengan pill waktu, quick action presensi, antrean t("ungraded").
 */

function Icon({ d, className }: { d: string; className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const P = {
  layers: "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5",
  users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  chart: "M18 20V10M12 20V4M6 20v-6",
  check: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  clipboard:
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
};

/** Waktu lokal WIB "HH:MM" → menit sejak 00:00, untuk pil "sekarang/mendatang". */
function toMenit(hhmm: string): number {
  const [h, m] = hhmm.slice(0, 5).split(":").map(Number);
  return h * 60 + m;
}

const WIB = "Asia/Jakarta";

export default async function TeacherDashboard() {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/dashboard", locale });
  const guruId = Number(session.user.id);

  const kelas = await collect(db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all());
  const kelasIds = kelas.map((k) => k.id);
  const sekarang = new Date();
  const hariIniStr = tanggalWIB(sekarang);
  const hari = hariDariTanggal(hariIniStr);

  const [mapel, jadwal, pendaftaran, nilaiAll, presensiSesi, periode] = await Promise.all([
    kelas.length ? collect(db.orm.public.MataPelajaran.all()) : Promise.resolve([]),
    kelas.length ? collect(db.orm.public.JadwalItem.where((j) => j.kelasId.in(kelasIds)).all()) : Promise.resolve([]),
    kelas.length
      ? collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in(kelasIds)).all())
      : Promise.resolve([]),
    collect(db.orm.public.NilaiProgres.where((n) => n.dicatatOleh.eq(guruId)).all()),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
    kelas.length ? collect(db.orm.public.PeriodePendaftaran.where((p) => p.id.in(kelas.map((k) => k.periodeId))).all()) : Promise.resolve([]),
  ]);
  const mapelById = new Map(mapel.map((m) => [m.id, m]));

  const periodeById = new Map(periode.map((p) => [p.id, p]));
  const kelasHariIni = new Set(kelas.filter((k) => {
    const p = periodeById.get(k.periodeId);
    return k.status === "aktif" && p && hariIniStr >= p.tanggalMulai && hariIniStr <= p.tanggalSelesai;
  }).map((k) => k.id));
  const tersimpan = jadwal.length ? await collect(
    db.orm.public.SesiPertemuan.where((s) => s.jadwalItemId.in(jadwal.map((j) => j.id)))
      .where((s) => s.tanggalPertemuan.eq(hariIniStr)).all(),
  ) : [];
  const sesiBySlot = new Map(tersimpan.map((s) => [s.jadwalItemId, s]));
  const sesiHariIni = jadwal
    .filter((j) => kelasHariIni.has(j.kelasId) && (j.hari === hari || sesiBySlot.has(j.id)))
    .filter((j) => sesiBySlot.get(j.id)?.statusSesi !== "dibatalkan")
    .map((j) => {
      const sesi = sesiBySlot.get(j.id);
      return { ...j, jamMulai: sesi?.jamMulai ?? j.jamMulai, jamSelesai: sesi?.jamSelesai ?? j.jamSelesai };
    })
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai));

  const anakById = new Map(
    (await collect(db.orm.public.Anak.all())).map((a) => [a.id, a]),
  );

  const siswaAktif = pendaftaran.filter((p) => ["terdaftar", "tertunggak"].includes(p.status));
  const siswaPerKelas = new Map<number, number>();
  for (const p of siswaAktif) siswaPerKelas.set(p.kelasId ?? 0, (siswaPerKelas.get(p.kelasId ?? 0) ?? 0) + 1);

  // Antrean: siswa aktif yang BELUM punya nilai dari guru ini.
  const punyaNilai = new Set(nilaiAll.map((n) => n.pendaftaranId));
  const belumNilai = siswaAktif.filter((p) => !punyaNilai.has(p.id));

  // Presensi sesi hari ini: berapa sudah terisi per jadwal item.
  const presensiHariIni = presensiSesi.filter((x) => x.tanggalPertemuan === hariIniStr);
  const terisiByItem = new Map<number, number>();
  for (const x of presensiHariIni) terisiByItem.set(x.jadwalItemId, (terisiByItem.get(x.jadwalItemId) ?? 0) + 1);

  // Entri guru yang terkunci BR#18 (lewat 7 hari) = kandidat koreksi.
  const terkunciCount =
    nilaiAll.filter((n) => !dalamJendela7Hari(n.createdAt)).length +
    presensiSesi.filter((x) => !dalamJendela7Hari(x.createdAt)).length;

  const nowWib = sekarang.toLocaleTimeString("en-GB", { timeZone: WIB, hour: "2-digit", minute: "2-digit" });
  const menitNow = toMenit(nowWib);

  const kelasAktif = kelas.filter((k) => k.status === "aktif").length;

  const kpi = [
    { icon: P.layers, accent: "border-t-blue-600", tile: "bg-blue-50 text-blue-600", value: kelas.length, label: t("assignedClasses"), sub: t("stillActive", { count: kelasAktif }) },
    { icon: P.users, accent: "border-t-emerald-500", tile: "bg-emerald-50 text-emerald-600", value: siswaAktif.length, label: t("activeStudents"), sub: t("inClasses", { count: kelas.length }) },
    { icon: P.calendar, accent: "border-t-amber-500", tile: "bg-amber-50 text-amber-600", value: sesiHariIni.length, label: t("todaySessionsDay", { day: t(`day_${hari}`) }), sub: sesiHariIni.length === 0 ? t("noTeachingSchedule") : t("notStarted", { count: sesiHariIni.filter((j) => toMenit(j.jamSelesai) > menitNow).length }) },
    { icon: P.check, accent: "border-t-slate-300", tile: "bg-slate-100 text-slate-500", value: nilaiAll.length, label: t("gradeEntries"), sub: t("lockedCountAdmin", { count: terkunciCount }) },
  ];

  return (
    <PageShell wide>
      {/* HEADER + konteks hari */}
      <PageHeader
        title={t("teacherDashboard")}
        desc={t("greeting", { name: session.user.name ?? t("teacher"), day: t(`day_${hari}`), sessions: sesiHariIni.length > 0 ? t("teachingSessions", {count: sesiHariIni.length}) : t("noTeachingSessions") })}
      >
        <ButtonLink href="/teacher/calendar" variant="outline">{t("calendarTitle")}</ButtonLink>
        <ButtonLink href="/teacher/classes">{t("manageClasses")}</ButtonLink>
      </PageHeader>

      {/* STRIP KONTEKS HARI INI — gelap, sama seperti chip periode admin */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-2xl bg-slate-900 px-4 py-4 text-white sm:px-6">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-bold tabular-nums">
            {sekarang.toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: WIB })}
          </span>
          <span className="text-sm text-slate-300">{t("serverTime")} <span className="tabular-nums font-semibold text-white">{nowWib}</span> {t("timeZone")}</span>
        </div>
        {sesiHariIni.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            {sesiHariIni.map((j) => {
              const k = kelas.find((x) => x.id === j.kelasId);
              const lewat = toMenit(j.jamSelesai) <= menitNow;
              const sedang = !lewat && toMenit(j.jamMulai) <= menitNow;
              return (
                <span
                  key={j.id}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold tabular-nums ${
                    sedang ? "bg-emerald-500/20 text-emerald-200" : lewat ? "bg-white/5 text-slate-400 line-through decoration-slate-500" : "bg-white/10 text-white"
                  }`}
                >
                  <span aria-hidden="true">{j.jamMulai.slice(0, 5)}–{j.jamSelesai.slice(0, 5)}</span>
                  <span className="font-medium">{mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? t("class")} · {k?.jenjang ?? "—"}</span>
                  {sedang ? <span className="rounded-full bg-emerald-400 px-1.5 text-[10px] font-bold text-emerald-950">{t("ongoing")}</span> : null}
                </span>
              );
            })}
          </div>
        ) : (
          <span className="text-sm text-slate-300">{t("noScheduleTodayPrefix")} <span className="font-semibold text-white">{t("assignedClassesTitle")}</span></span>
        )}
      </div>

      {/* KPI */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi.map((s) => (
          <div key={s.label} className={`rounded-2xl border border-slate-200 border-t-4 bg-white p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.10),0_4px_12px_-6px_rgba(15,23,42,0.08)] ${s.accent}`}>
            <span className={`inline-grid size-9 place-items-center rounded-lg ${s.tile}`}>
              <Icon d={s.icon} className="size-5" />
            </span>
            <p className="mt-3 font-display text-[26px] font-extrabold leading-none tracking-tight tabular-nums text-slate-900">{s.value}</p>
            <p className="mt-2.5 text-sm font-bold text-slate-900">{s.label}</p>
            <p className="mt-0.5 text-[13px] text-slate-600">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* GRID: sesi + presensi (kiri 2/3) | antrean nilai (kanan 1/3) */}
      <div className="mt-4 grid items-start gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Panel>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("todaySessions")}</h2>
              <p className="text-xs text-slate-500">{t("sessionAttendanceHelp")}</p>
            </div>
            {sesiHariIni.length === 0 ? (
              <div className="px-4 py-10 text-center sm:px-6">
                <p className="text-sm font-bold text-slate-900">{t("noTeachingToday")}</p>
                <p className="mt-1 text-[13px] text-slate-500">{t("nextScheduleHelp")}</p>
                <ButtonLink href="/teacher/classes" size="sm" variant="outline" className="mt-4">{t("viewSchedule")}</ButtonLink>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {sesiHariIni.map((j) => {
                  const k = kelas.find((x) => x.id === j.kelasId);
                  const nSiswa = siswaPerKelas.get(j.kelasId) ?? 0;
                  const nTerisi = terisiByItem.get(j.id) ?? 0;
                  const lewat = toMenit(j.jamSelesai) <= menitNow;
                  const sedang = !lewat && toMenit(j.jamMulai) <= menitNow;
                  return (
                    <li key={j.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-24 flex-shrink-0">
                          <p className="text-sm font-extrabold tabular-nums text-slate-900">{j.jamMulai.slice(0, 5)}–{j.jamSelesai.slice(0, 5)}</p>
                          {sedang ? (
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                              <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" /> {t("ongoing")}
                            </span>
                          ) : lewat ? (
                            <span className="mt-1 block text-[11px] font-semibold text-slate-400">{t("finished")}</span>
                          ) : (
                            <span className="mt-1 block text-[11px] font-semibold text-slate-400">{t("waiting")}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900">
                            {mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? t("class")} · {k?.jenjang ?? "—"}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {t("sessionSummary", { count: nSiswa, id: j.kelasId, filled: nTerisi })}
                          </p>
                        </div>
                      </div>
                      <div className="ml-auto flex flex-wrap items-center gap-2">
                        {nSiswa > 0 && nTerisi === nSiswa ? (
                          <Badge tone="emerald">{t("attendanceComplete")}</Badge>
                        ) : null}
                        <ButtonLink href={`/teacher/classes/${j.kelasId}/sessions/${hariIniStr}/attendance?sesi=${j.id}`} size="sm" variant={sedang && nTerisi < nSiswa ? "default" : "outline"}>
                          {nTerisi === 0 ? t("fillAttendance") : nTerisi < nSiswa ? t("completeAttendance") : t("openAttendance")}
                        </ButtonLink>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* KELAS RINGKAS */}
          <Panel>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("yourClasses")}</h2>
                <Link href="/teacher/classes" className="text-sm font-semibold text-blue-700 hover:underline">{t("allClasses")}</Link>
              </div>
            </div>
            {kelas.length === 0 ? (
              <div className="px-4 py-10 text-center sm:px-6">
                <p className="text-sm font-bold text-slate-900">{t("noAssignedClasses")}</p>
                <p className="mt-1 text-[13px] text-slate-500">{t("classAssignmentHelp")}</p>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {kelas.slice(0, 4).map((k) => {
                  const nAktif = siswaPerKelas.get(k.id) ?? 0;
                  const pct = Math.min(100, Math.round((nAktif / Math.max(k.kuotaMaksimum, 1)) * 100));
                  const sesi = jadwal.filter((j) => j.kelasId === k.id);
                  return (
                    <li key={k.id} className="rounded-xl border border-slate-200 p-5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900">{mapelById.get(k.mataPelajaranId)?.nama ?? t("class")} · {k.jenjang}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {sesi.map((j) => `${t(`day_${j.hari}`).slice(0, 3)} ${j.jamMulai.slice(0, 5)}`).join(" · ") || t("noSchedule")}
                          </p>
                        </div>
                        <Badge tone={k.status === "aktif" ? "emerald" : "slate"}>{t(`status_${k.status}`)}</Badge>
                      </div>
                      <div className="mt-4">
                        <div className="flex items-baseline justify-between text-xs">
                          <span className="font-bold tabular-nums text-slate-700">{t("studentCapacity", { count: nAktif, max: k.kuotaMaksimum })}</span>
                          <span className="tabular-nums text-slate-500">{pct}%</span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200/80" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t("capacityFilled")}>
                          <div className={`h-full rounded-full ${pct >= 90 ? "bg-amber-500" : "bg-blue-600"}`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <Link href={`/teacher/classes/${k.id}`} className="mt-3.5 inline-block text-sm font-semibold text-blue-700 hover:underline">
                        {t("openRosterAttendance")}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        {/* KANAN: antrean nilai + koreksi */}
        <div className="flex flex-col gap-4">
          <Panel>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("noGrades")}</h2>
                {belumNilai.length > 0 ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-amber-800">{belumNilai.length}</span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500">{t("ungradedStudentsHelp")}</p>
            </div>
            {belumNilai.length === 0 ? (
              <div className="px-4 py-10 text-center sm:px-6">
                <p className="text-sm font-bold text-slate-900">{t("allStudentsGraded")}</p>
                <p className="mt-1 text-[13px] text-slate-500">{t("allGradedHelp")}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {belumNilai.slice(0, 6).map((p) => {
                  const a = anakById.get(p.anakId);
                  const k = kelas.find((x) => x.id === p.kelasId);
                  return (
                    <li key={p.id}>
                      <Link href={`/teacher/grades/${p.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-slate-50 sm:px-6">
                        <span className="grid size-8 flex-shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                          {(a?.nama ?? "?").trim().charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-slate-900">{a?.nama ?? t("childFallback", { id: p.anakId })}</span>
                          <span className="block truncate text-xs text-slate-500">
                            {mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? t("class")} · {k?.jenjang ?? "—"}
                          </span>
                        </span>
                        <span className="flex-shrink-0 text-xs font-bold text-amber-700">{t("ungraded")}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {belumNilai.length > 0 ? (
              <div className="border-t border-slate-100 px-4 py-3 sm:px-6">
                <Link href="/teacher/grades" className="text-sm font-semibold text-blue-700 hover:underline">
                  {t("enterGradesNow")}
                </Link>
              </div>
            ) : null}
          </Panel>

          <Panel>
            <div className={`p-4 sm:p-6 ${terkunciCount > 0 ? "" : "text-center"}`}>
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("correctionsLocks")}</h2>
              <p className={`mt-1 text-[13px] leading-relaxed text-slate-600 ${terkunciCount > 0 ? "" : "mx-auto max-w-[26ch]"}`}>
                {terkunciCount > 0
                  ? t("lockedEntriesHelp", { count: terkunciCount })
                  : t("noLockedEntriesHelp")}
              </p>
              <Link href="/teacher/corrections" className={`mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline`}>
                {t("viewCorrectionRules")}
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
