import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sanitizeLaporanForParent } from "@/lib/laporan-perkembangan";

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
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const tr = await getTranslations("parent");
  const statusLabels: Record<string, string> = {
    hadir: tr("text116"),
    izin: tr("text117"),
    sakit: tr("text118"),
    alpa: tr("text119"),
  };
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({href: "/login?next=/schedule-attendance", locale});
  }
  const ortuId = Number(session.user.id);
  const { tab, status: statusParam } = await searchParams;
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
      b.select("id", "mataPelajaranId", "guruId"),
    ).all(),
  );
  const milikSaya = pendaftaran.filter(
    (p) =>
      anakIds.has(p.anakId) &&
      ["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(p.status),
  );

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
  const jadwalRows = (
    await Promise.all(
      milikSaya.map((p) =>
        collect(
          db.orm.public.JadwalItem.where((j) => j.kelasId.eq(p.kelasId)).all(),
        ).then((items) => items.map((j) => ({ j, p }))),
      ),
    )
  ).flat();
  jadwalRows.sort(
    (x, y) =>
      URUTAN_HARI.indexOf(x.j.hari as (typeof URUTAN_HARI)[number]) -
        URUTAN_HARI.indexOf(y.j.hari as (typeof URUTAN_HARI)[number]) ||
      x.j.jamMulai.localeCompare(y.j.jamMulai),
  );

  // Presensi pendaftaran milik saya.
  const presensi = (
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
  const rekap = presensi.reduce<Record<string, number>>((acc, { s }) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});
  const presensiTampil =
    statusAktif === "semua"
      ? presensi
      : presensi.filter(({ s }) => s.status === statusAktif);

  // Catatan pertemuan terbit (materi & PR) untuk sesi-sesi presensi
  const sesiIds = [
    ...new Set(
      presensi
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
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
           {tr("text168")} </h1>
        <p className="mt-1 text-sm text-muted">
           {tr("text169")} </p>
      </header>

      {/* Filter tabs */}
      <nav
        aria-label={tr("text170")}
        className="inline-flex flex-wrap rounded-full bg-slate-100 p-1"
      >
        {[
          ["jadwal", `Jadwal (${jadwalRows.length})`],
          ["presensi", `Presensi (${presensi.length})`],
          ["nilai", `${tr("classAssessmentsTitle")} (${hasilMilikSaya.length})`],
          ["laporan", `${tr("progressTabTitle")} (${laporanMilikSaya.length})`],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={`/schedule-attendance?tab=${key}`}
            aria-current={tabAktif === key ? "page" : undefined}
            className={`min-w-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-5 ${
              tabAktif === key
                ? "bg-white text-brand shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {tabAktif === "jadwal" ? (
        jadwalRows.length === 0 ? (
          <Card className="mt-4">
            <CardPad className="py-12 text-center">
              <p className="text-base font-semibold">{tr("text171")}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                 {tr("text172")} </p>
            </CardPad>
          </Card>
        ) : (
          <ul className="mt-4 grid gap-3">
            {jadwalRows.map(({ j, p }) => (
              <li key={`${j.id}-${p.id}`}>
                <Card className="border-l-4 border-l-amber-500">
                  <CardPad className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {mapel.get(p.kelas.mataPelajaranId) ??
                          `Kelas #${p.kelasId}`}{" "}
                        — {namaAnak.get(p.anakId) ?? tr("text162")}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {j.hari}, {jamPendek(j.jamMulai)}–
                        {jamPendek(j.jamSelesai)}  {tr("text173")}{" "}
                        {guru.get(p.kelas.guruId) ?? "-"}
                      </p>
                    </div>
                    <Badge tone="slate">{p.jenjangSaatDaftar}</Badge>
                  </CardPad>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : tabAktif === "presensi" ? (
        presensi.length === 0 ? (
        <Card className="mt-4">
          <CardPad className="py-12 text-center">
            <p className="text-base font-semibold">
               {tr("text174")} </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
               {tr("text175")} </p>
          </CardPad>
        </Card>
      ) : (
        <>
          {/* Pill filter status — pola referensi #2 (All/To do/Done → Semua/Hadir/...) */}
          <nav
            aria-label={tr("text176")}
            className="mt-4 flex flex-wrap gap-2"
          >
            {FILTER_STATUS.map((f) => {
              const n = f === "semua" ? presensi.length : (rekap[f] ?? 0);
              const on = statusAktif === f;
              return (
                <Link
                  key={f}
                  href={`/schedule-attendance?tab=presensi${f === "semua" ? "" : `&status=${f}`}`}
                  aria-current={on ? "page" : undefined}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold capitalize transition-colors ${
                    on
                      ? "border-brand bg-brand text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-brand/40 hover:text-brand"
                  }`}
                >
                  {statusLabels[f] ?? f}
                  <span
                    className={`rounded-full px-1.5 text-xs tabular-nums ${
                      on ? "bg-white/20" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {n}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Rekap — pola Dashboard Card, top border biru (akademik). */}
            <section className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(["hadir", "izin", "sakit", "alpa"] as const).map((s) => (
                <Card
                  key={s}
                  className={`border-t-4 ${
                    s === "hadir"
                      ? "border-t-emerald-500"
                      : s === "alpa"
                        ? "border-t-rose-500"
                        : "border-t-amber-500"
                  }`}
                >
                  <CardPad className="py-4">
                    <p className="text-xs font-semibold uppercase text-muted">
                      {statusLabels[s] ?? s}
                    </p>
                    <p className="mt-0.5 text-2xl font-bold">{rekap[s] ?? 0}</p>
                  </CardPad>
                </Card>
              ))}
            </section>

            {presensiTampil.length === 0 ? (
              <Card className="mt-4">
                <CardPad className="py-10 text-center">
                  <p className="text-sm text-muted">{tr("text177")}</p>
                </CardPad>
              </Card>
            ) : (
              <ul className="mt-4 grid gap-2.5">
                {presensiTampil.map(({ s, p }) => (
                  <li key={`${s.id}-${p.id}`}>
                    <Card>
                      <CardPad className="py-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold">
                              {new Date(s.tanggalPertemuan).toLocaleDateString(
                                locale === "en" ? "en-GB" : "id-ID",
                                {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                  timeZone: "Asia/Jakarta",
                                },
                              )}
                            </p>
                            <p className="text-xs text-muted">
                              {mapel.get(p.kelas.mataPelajaranId) ??
                                `Kelas #${p.kelasId}`}{" "}
                              — {namaAnak.get(p.anakId) ?? tr("text162")}
                            </p>
                          </div>
                          <PresensiBadge status={s.status} label={statusLabels[s.status] ?? s.status} />
                        </div>
                        {s.catatan ? (
                          <div className="mt-2.5 rounded-lg border border-slate-200/60 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                            <span className="font-semibold text-slate-500">{tr("teacherNote")}{" "}</span>
                            {s.catatan}
                          </div>
                        ) : null}
                        {s.sesiPertemuanId && catatanBySesi.has(s.sesiPertemuanId) ? (
                          <div className="mt-2.5 space-y-1.5 rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-slate-700">
                            {catatanBySesi.get(s.sesiPertemuanId)?.materi ? (
                              <div>
                                <span className="font-semibold text-blue-900">{tr("sessionMaterials")}{" "}</span>
                                <span>{catatanBySesi.get(s.sesiPertemuanId)?.materi}</span>
                              </div>
                            ) : null}
                            {catatanBySesi.get(s.sesiPertemuanId)?.pr ? (
                              <div className={catatanBySesi.get(s.sesiPertemuanId)?.materi ? "border-t border-blue-100/70 pt-1.5" : ""}>
                                <span className="font-semibold text-blue-900">{tr("sessionHomework")}{" "}</span>
                                <span>{catatanBySesi.get(s.sesiPertemuanId)?.pr}</span>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </CardPad>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </>
        )
      ) : tabAktif === "laporan" ? (
        laporanMilikSaya.length === 0 ? (
          <Card className="mt-4">
            <CardPad className="py-12 text-center">
              <p className="text-base font-semibold">{tr("progressTabTitle")}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                {tr("noProgressPublished")}
              </p>
            </CardPad>
          </Card>
        ) : (
          <ul className="mt-4 grid gap-3">
            {laporanMilikSaya.map(({ laporan, anakNama, mapelNama, guruNama }) => (
              <li key={laporan.id}>
                <Card className="border-l-4 border-l-blue-600">
                  <CardPad className="py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{laporan.judul}</h3>
                        <p className="text-xs text-slate-500">
                          {mapelNama} — <span className="font-medium text-slate-700">{anakNama}</span>
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 tabular-nums">
                        {new Date(`${laporan.tanggal}T00:00:00+07:00`).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          timeZone: "Asia/Jakarta",
                        })}
                      </span>
                    </div>
                    <div className="mt-3 whitespace-pre-line text-xs leading-relaxed text-slate-800">
                      {laporan.laporanOrtu}
                    </div>
                    <p className="mt-3 text-[11px] text-slate-400">
                      {tr("progressReportBy", { teacher: guruNama, date: laporan.tanggal })}
                    </p>
                  </CardPad>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : (
        hasilMilikSaya.length === 0 ? (
          <Card className="mt-4">
            <CardPad className="py-12 text-center">
              <p className="text-base font-semibold">{tr("classAssessmentsTitle")}</p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
                {locale === "en" ? "No assessments published by teachers yet." : "Belum ada tugas atau penilaian yang diterbitkan oleh guru."}
              </p>
            </CardPad>
          </Card>
        ) : (
          <ul className="mt-4 grid gap-3">
            {hasilMilikSaya.map(({ h, pen, anakNama, mapelNama }) => {
              const statusLabel = h.statusHasil === "dinilai"
                ? `${h.nilai} / ${pen.nilaiMaksimum}`
                : h.statusHasil === "tidak_ikut"
                  ? tr("notParticipated")
                  : (locale === "en" ? "Not Graded" : "Belum Dinilai");

              return (
                <li key={h.id}>
                  <Card>
                    <CardPad className="py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{pen.nama}</p>
                          <p className="text-xs text-muted">
                            {mapelNama} — {anakNama} ·{" "}
                            {new Date(`${pen.tanggal}T00:00:00+07:00`).toLocaleDateString(
                              locale === "en" ? "en-GB" : "id-ID",
                              { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" },
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              h.statusHasil === "dinilai"
                                ? "bg-emerald-100 text-emerald-800"
                                : h.statusHasil === "tidak_ikut"
                                  ? "bg-rose-100 text-rose-800"
                                  : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                      {h.catatan ? (
                        <div className="mt-2.5 rounded-lg border border-slate-200/60 bg-slate-50 px-3 py-2 text-xs text-slate-700">
                          <span className="font-semibold text-slate-500">{tr("teacherNote")}{" "}</span>
                          {h.catatan}
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
