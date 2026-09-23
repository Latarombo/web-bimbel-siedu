import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sanitizeLaporanForParent } from "@/lib/laporan-perkembangan";

import { ScheduleTab } from "@/components/parent/schedule-attendance/schedule-tab";
import { AttendanceTab } from "@/components/parent/schedule-attendance/attendance-tab";
import { JadwalRecord } from "@/components/parent/schedule-attendance/schedule-context";
import { PresensiRecord } from "@/components/parent/schedule-attendance/attendance-context";
import { CalendarDays, UserCheck, Award, BookOpen, Users, Clock } from "lucide-react";
import { StudentAvatar } from "@/components/parent/student-avatar";

export const dynamic = "force-dynamic";

// C7 — Schedule & Attendance (tab gabungan via ?tab=, pola shadcn Tabs server-side).
// Jadwal: JadwalItem kelas yang diikuti anak (pendaftaran aktif), dikelompokkan per hari.
// Presensi: rows Presensi pendaftaran milik anak.

function PresensiBadge({ status, label }: { status: string; label: string }) {
  const tone =
    status === "hadir"
      ? "emerald"
      : status === "izin" || status === "sakit"
        ? "amber"
        : status === "alpa"
          ? "red"
          : "slate";
  return <Badge tone={tone}>{label}</Badge>;
}

const URUTAN_HARI = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

function jamPendek(t: string) {
  return t.slice(0, 5);
}

export default async function ScheduleAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; anakId?: string }>;
}) {
  const tr = await getTranslations("parent");
  const locale = await getLocale();
  const isEn = locale === "en";
  const statusLabels: Record<string, string> = {
    hadir: tr("text116"),
    izin: tr("text117"),
    sakit: tr("text118"),
    alpa: tr("text119"),
  };
  const session = await auth();
  if (!session?.user) {
    return redirect({href: "/login?next=/schedule-attendance", locale});
  }
  const ortuId = Number(session.user.id);
  const { tab, status: statusParam, anakId: anakIdParam } = await searchParams;
  const anakTerpilihId = anakIdParam ? Number(anakIdParam) : null;
  const tabAktif =
    tab === "presensi"
      ? "presensi"
      : tab === "nilai"
        ? "nilai"
        : tab === "laporan"
          ? "laporan"
          : "jadwal";
  const FILTER_STATUS = ["semua", "hadir", "izin", "sakit", "alpa"] as const;
  const statusAktif = (FILTER_STATUS as readonly string[]).includes(
    statusParam ?? "",
  )
    ? (statusParam as (typeof FILTER_STATUS)[number])
    : "semua";

  const anak = await collect(
    db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all(),
  );
  const anakIds = new Set(anak.map((a) => a.id));
  const namaAnak = new Map(anak.map((a) => [a.id, a.nama]));

  const pendaftaran = await collect(
    db.orm.public.Pendaftaran.include("kelas", (b) =>
      b.select("id", "mataPelajaranId", "guruId", "ruangan"),
    ).all(),
  );
  const pendaftaranAktifSemua = pendaftaran.filter(
    (p) =>
      anakIds.has(p.anakId) &&
      ["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(p.status),
  );
  const milikSaya = anakTerpilihId
    ? pendaftaranAktifSemua.filter((p) => p.anakId === anakTerpilihId)
    : pendaftaranAktifSemua;

  // Nama mapel + guru per kelas.
  const mapelIds = [...new Set(milikSaya.map((p) => p.kelas.mataPelajaranId))];
  const guruIds = [...new Set(milikSaya.map((p) => p.kelas.guruId))];
  const [mapelRows, guruRows] = await Promise.all([
    Promise.all(
      mapelIds.map(async (mid) =>
        collect(db.orm.public.MataPelajaran.where((m) => m.id.eq(mid)).all()),
      ),
    ),
    Promise.all(
      guruIds.map(async (gid) =>
        collect(db.orm.public.User.where((u) => u.id.eq(gid)).all()),
      ),
    ),
  ]);
  const mapel = new Map(mapelRows.flat().map((m) => [m.id, m.nama]));
  const guru = new Map(guruRows.flat().map((g) => [g.id, g.name]));

  // Jadwal per kelas yang diikuti.
  const jadwalRowsRaw = (
    await Promise.all(
      milikSaya.map((p) =>
        collect(
          db.orm.public.JadwalItem.where((j) => j.kelasId.eq(p.kelasId)).all(),
        ).then((items) => items.map((j) => ({ j, p }))),
      ),
    )
  ).flat();
  jadwalRowsRaw.sort(
    (x, y) =>
      URUTAN_HARI.indexOf(x.j.hari as (typeof URUTAN_HARI)[number]) -
        URUTAN_HARI.indexOf(y.j.hari as (typeof URUTAN_HARI)[number]) ||
      x.j.jamMulai.localeCompare(y.j.jamMulai),
  );

  const jadwalRecords: JadwalRecord[] = jadwalRowsRaw.map(({ j, p }) => ({
    id: `${p.id}-${j.id}`,
    hari: j.hari,
    jamMulai: j.jamMulai,
    jamSelesai: j.jamSelesai,
    mapel: mapel.get(p.kelas.mataPelajaranId) ?? `Kelas #${p.kelasId}`,
    guru: guru.get(p.kelas.guruId) ?? "-",
    ruangan: p.kelas.ruangan,
    anak: namaAnak.get(p.anakId) ?? tr("text162"),
    jenjang: p.jenjangSaatDaftar,
  }));

  // Presensi pendaftaran milik saya.
  const presensiRaw = (
    await Promise.all(
      milikSaya.map((p) =>
        collect(
          db.orm.public.Presensi.where((s) => s.pendaftaranId.eq(p.id))
            .orderBy((s) => s.tanggalPertemuan.desc())
            .all(),
        ).then((rows) => rows.map((s) => ({ s, p }))),
      ),
    )
  ).flat();
  
  // Catatan pertemuan terbit (materi & PR) untuk sesi-sesi presensi
  const sesiIds = [
    ...new Set(
      presensiRaw
        .map(({ s }) => s.sesiPertemuanId)
        .filter((id): id is number => typeof id === "number"),
    ),
  ];
  const catatanPertemuanList =
    sesiIds.length > 0
      ? await collect(
          db.orm.public.CatatanPertemuan.where((c) => c.sesiId.in(sesiIds))
            .where((c) => c.draf.eq(false))
            .all(),
        )
      : [];
  const catatanBySesi = new Map(
    catatanPertemuanList.map((c) => [c.sesiId, c]),
  );

  const presensiRecords: PresensiRecord[] = presensiRaw.map(({ s, p }) => ({
    id: `${p.id}-${s.id}`,
    tanggal: s.tanggalPertemuan,
    status: s.status as "hadir" | "izin" | "sakit" | "alpa",
    mapel: mapel.get(p.kelas.mataPelajaranId) ?? `Kelas #${p.kelasId}`,
    anak: namaAnak.get(p.anakId) ?? tr("text162"),
    catatan: s.catatan,
    materi: s.sesiPertemuanId && catatanBySesi.has(s.sesiPertemuanId) ? catatanBySesi.get(s.sesiPertemuanId)?.materi : null,
    pr: s.sesiPertemuanId && catatanBySesi.has(s.sesiPertemuanId) ? catatanBySesi.get(s.sesiPertemuanId)?.pr : null,
  }));

  // Penilaian terbit untuk pendaftaran anak milik saya
  const milikSayaIds = new Set(milikSaya.map((p) => p.id));
  const [penilaianTerbit, semuaHasilPenilaian] = await Promise.all([
    collect(db.orm.public.Penilaian.where((p) => p.draf.eq(false)).all()),
    collect(db.orm.public.HasilPenilaian.all()),
  ]);
  const penilaianById = new Map(penilaianTerbit.map((p) => [p.id, p]));
  const hasilMilikSaya = semuaHasilPenilaian
    .filter((h) => milikSayaIds.has(h.pendaftaranId) && penilaianById.has(h.penilaianId))
    .map((h) => {
      const pen = penilaianById.get(h.penilaianId)!;
      const pend = milikSaya.find((p) => p.id === h.pendaftaranId)!;
      return {
        h,
        pen,
        pend,
        anakNama: namaAnak.get(pend.anakId) ?? tr("text162"),
        mapelNama: mapel.get(pend.kelas.mataPelajaranId) ?? `Kelas #${pend.kelasId}`,
      };
    })
    .sort((a, b) => b.pen.tanggal.localeCompare(a.pen.tanggal));

  // Laporan perkembangan terbit untuk pendaftaran anak milik saya (catatan internal di-strip)
  const laporanTerbit = milikSayaIds.size > 0
    ? await collect(
        db.orm.public.LaporanPerkembangan.where((l) => l.pendaftaranId.in([...milikSayaIds]))
          .where((l) => l.draf.eq(false))
          .all(),
      )
    : [];
  const laporanMilikSaya = laporanTerbit.map((raw) => {
    const safe = sanitizeLaporanForParent(raw);
    const pend = milikSaya.find((p) => p.id === safe.pendaftaranId)!;
    return {
      laporan: safe,
      pend,
      anakNama: namaAnak.get(pend.anakId) ?? tr("text162"),
      mapelNama: mapel.get(pend.kelas.mataPelajaranId) ?? `Kelas #${pend.kelasId}`,
      guruNama: guru.get(pend.kelas.guruId) ?? "-",
    };
  }).sort((a, b) => b.laporan.tanggal.localeCompare(a.laporan.tanggal));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-blue-600/10">
        <div className="absolute -right-10 -bottom-10 size-60 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-xs border border-white/20">
              <CalendarDays className="size-3.5" />
              <span>{isEn ? "Academic Schedule & Attendance Portal" : "Portal Jadwal & Presensi Belajar"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {isEn ? "Student Schedule & Attendance" : "Jadwal & Presensi Siswa"}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
              {isEn
                ? "Monitor offline class schedules, real-time attendance, teacher notes, and learning progress."
                : "Pantau jadwal kelas tatap muka, kehadiran real-time, materi modul, serta evaluasi perkembangan anak."}
            </p>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-2.5 backdrop-blur-xs text-center min-w-[85px]">
              <span className="block text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                {isEn ? "Classes" : "Kelas"}
              </span>
              <span className="text-xl font-extrabold text-white tabular-nums">
                {milikSaya.length}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-2.5 backdrop-blur-xs text-center min-w-[85px]">
              <span className="block text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                {isEn ? "Sessions/Wk" : "Sesi / Pekan"}
              </span>
              <span className="text-xl font-extrabold text-white tabular-nums">
                {jadwalRecords.length}
              </span>
            </div>
            <div className="rounded-2xl bg-white/10 border border-white/15 px-4 py-2.5 backdrop-blur-xs text-center min-w-[85px]">
              <span className="block text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                {isEn ? "Attendance" : "Presensi"}
              </span>
              <span className="text-xl font-extrabold text-white tabular-nums">
                {presensiRecords.length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Per Anak jika ada anak terdaftar */}
      {anak.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60">
          <span className="text-xs font-bold text-slate-500 pl-3 pr-1 flex items-center gap-1.5">
            <Users className="size-3.5" />
            {isEn ? "Student:" : "Filter Siswa:"}
          </span>
          <Link
            href={`/schedule-attendance?tab=${tabAktif}`}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
              !anakTerpilihId
                ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {isEn ? "All Children" : "Semua Anak"}
          </Link>
          {anak.map((a) => (
            <Link
              key={a.id}
              href={`/schedule-attendance?tab=${tabAktif}&anakId=${a.id}`}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-2 ${
                anakTerpilihId === a.id
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <StudentAvatar
                nama={a.nama}
                jenjang={a.jenjangTerakhir}
                size="xs"
                showRing={false}
                className="size-5 shrink-0"
              />
              <span>{a.nama}</span>
              {a.jenjangTerakhir && (
                <span className="opacity-70 text-[10px]">({a.jenjangTerakhir})</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Modern Card Tabs Switcher */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {[
          { key: "jadwal", label: isEn ? "Class Schedule" : "Jadwal Belajar", count: jadwalRecords.length, icon: CalendarDays },
          { key: "presensi", label: isEn ? "Attendance History" : "Presensi & Kehadiran", count: presensiRecords.length, icon: UserCheck },
          { key: "nilai", label: tr("classAssessmentsTitle"), count: hasilMilikSaya.length, icon: Award },
          { key: "laporan", label: tr("progressTabTitle"), count: laporanMilikSaya.length, icon: BookOpen },
        ].map(({ key, label, count, icon: Icon }) => {
          const isActive = tabAktif === key;
          const queryParams = new URLSearchParams();
          queryParams.set("tab", key);
          if (anakTerpilihId) queryParams.set("anakId", String(anakTerpilihId));

          return (
            <Link
              key={key}
              href={`/schedule-attendance?${queryParams.toString()}`}
              className={`group relative flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20 ring-2 ring-blue-600/20"
                  : "bg-white border-slate-200/90 text-slate-700 hover:border-blue-300 hover:bg-slate-50/70 shadow-2xs"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`size-8 sm:size-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600 group-hover:bg-blue-100/70"
                  }`}
                >
                  <Icon className="size-4 sm:size-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="block text-xs sm:text-sm font-bold truncate">
                    {label}
                  </span>
                </div>
              </div>
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-extrabold tabular-nums shrink-0 ${
                  isActive
                    ? "bg-white text-blue-700"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {tabAktif === "jadwal" ? (
        <ScheduleTab records={jadwalRecords} />
      ) : tabAktif === "presensi" ? (
        <AttendanceTab records={presensiRecords} />
      ) : tabAktif === "laporan" ? (
        laporanMilikSaya.length === 0 ? (
          <Card className="mt-4 border-dashed border-slate-200 bg-slate-50/50">
            <CardPad className="py-14 text-center">
              <div className="mx-auto size-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <BookOpen className="size-6" />
              </div>
              <p className="text-base font-bold text-slate-800">{tr("progressTabTitle")}</p>
              <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-muted leading-relaxed">
                {tr("noProgressPublished")}
              </p>
            </CardPad>
          </Card>
        ) : (
          <ul className="grid gap-3.5">
            {laporanMilikSaya.map(({ laporan, anakNama, mapelNama, guruNama }) => (
              <li key={laporan.id}>
                <Card className="border-l-4 border-l-blue-600 hover:shadow-xs transition-shadow">
                  <CardPad className="py-4.5 sm:py-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">{laporan.judul}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-blue-700">{mapelNama}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">{anakNama}</span>
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 tabular-nums">
                        {new Date(`${laporan.tanggal}T00:00:00+07:00`).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Asia/Jakarta",
                        })}
                      </span>
                    </div>
                    <div className="mt-3.5 whitespace-pre-line text-xs sm:text-sm leading-relaxed text-slate-700 bg-slate-50/60 rounded-xl p-3.5 border border-slate-100">
                      {laporan.laporanOrtu}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{tr("progressReportBy", { teacher: guruNama, date: laporan.tanggal })}</span>
                    </div>
                  </CardPad>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : (
        hasilMilikSaya.length === 0 ? (
          <Card className="mt-4 border-dashed border-slate-200 bg-slate-50/50">
            <CardPad className="py-14 text-center">
              <div className="mx-auto size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Award className="size-6" />
              </div>
              <p className="text-base font-bold text-slate-800">{tr("classAssessmentsTitle")}</p>
              <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-muted leading-relaxed">
                {locale === "en"
                  ? "No assessments or test assignments published by teachers yet."
                  : "Belum ada tugas atau evaluasi belajar yang diterbitkan oleh guru."}
              </p>
            </CardPad>
          </Card>
        ) : (
          <ul className="grid gap-3.5">
            {hasilMilikSaya.map(({ h, pen, anakNama, mapelNama }) => {
              const statusLabel =
                h.statusHasil === "dinilai"
                  ? `${h.nilai} / ${pen.nilaiMaksimum}`
                  : h.statusHasil === "tidak_ikut"
                    ? tr("notParticipated")
                    : locale === "en"
                      ? "Not Graded"
                      : "Belum Dinilai";

              return (
                <li key={h.id}>
                  <Card className="hover:shadow-xs transition-shadow">
                    <CardPad className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm sm:text-base font-bold text-slate-900">{pen.nama}</p>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-blue-700">{mapelNama}</span>
                            <span>•</span>
                            <span className="font-medium text-slate-700">{anakNama}</span>
                            <span>•</span>
                            <span className="tabular-nums">
                              {new Date(`${pen.tanggal}T00:00:00+07:00`).toLocaleDateString(
                                locale === "en" ? "en-GB" : "id-ID",
                                { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" },
                              )}
                            </span>
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span
                            className={`inline-flex rounded-xl px-3 py-1 text-xs font-bold tabular-nums ${
                              h.statusHasil === "dinilai"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : h.statusHasil === "tidak_ikut"
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-slate-100 text-slate-700 border border-slate-200"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                      {h.catatan ? (
                        <div className="mt-3 rounded-xl border border-slate-200/70 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-700">
                          <span className="font-semibold text-slate-600 mr-1.5">💬 {tr("teacherNote")}</span>
                          <span className="leading-relaxed">{h.catatan}</span>
                        </div>
                      ) : null}
                    </CardPad>
                  </Card>
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
}
