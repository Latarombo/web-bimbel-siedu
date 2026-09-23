import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { dalamJendela7Hari } from "@/lib/hari";
import { Badge } from "@/components/ui/badge";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";
import NilaiForm from "@/components/teacher/nilai-form";
import LaporanPerkembanganForm from "@/components/teacher/laporan-perkembangan-form";

export const dynamic = "force-dynamic";

export default async function GradeInputPage({
  params,
  searchParams,
}: {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/grades", locale });
  const { enrollmentId } = await params;
  const { tab } = await searchParams;
  const activeTab = tab ?? "perkembangan"; // 'perkembangan' | 'penilaian' | 'legacy'

  const pid = Number(enrollmentId);
  if (!Number.isInteger(pid)) notFound();
  const guruId = Number(session.user.id);

  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pid)).all(),
  );
  if (!p) notFound();

  const [kelas] = await collect(
    db.orm.public.Kelas.where((k) => k.id.eq(p.kelasId))
      .where((k) => k.guruId.eq(guruId))
      .all(),
  );
  if (!kelas) notFound();

  const [
    mapel,
    anak,
    nilai,
    presensi,
    laporanRows,
    hasilPenilaianRows,
    semuaPenilaian,
    riwayatPendaftaran,
    semuaKelas,
    semuaMapel,
  ] = await Promise.all([
    collect(db.orm.public.MataPelajaran.where((m) => m.id.eq(kelas.mataPelajaranId)).all()),
    collect(db.orm.public.Anak.where((a) => a.id.eq(p.anakId)).all()),
    collect(
      db.orm.public.NilaiProgres.where((n) => n.pendaftaranId.eq(pid))
        .orderBy((n) => n.tanggal.desc())
        .all(),
    ),
    collect(db.orm.public.Presensi.where((x) => x.pendaftaranId.eq(pid)).all()),
    collect(
      db.orm.public.LaporanPerkembangan.where((l) => l.pendaftaranId.eq(pid))
        .orderBy((l) => l.tanggal.desc())
        .all(),
    ),
    collect(db.orm.public.HasilPenilaian.where((h) => h.pendaftaranId.eq(pid)).all()),
    collect(db.orm.public.Penilaian.where((pen) => pen.kelasId.eq(p.kelasId)).all()),
    collect(db.orm.public.Pendaftaran.where((pnd) => pnd.anakId.eq(p.anakId)).all()),
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.MataPelajaran.all()),
  ]);

  const nama = anak[0]?.nama ?? t("childFallback", { id: p.anakId });
  const nHadir = presensi.filter((x) => x.status === "hadir").length;
  const editable = nilai.filter((n) => dalamJendela7Hari(n.createdAt)).length;

  const kelasMap = new Map(semuaKelas.map((k) => [k.id, k]));
  const mapelMap = new Map(semuaMapel.map((m) => [m.id, m]));
  const penilaianMap = new Map(semuaPenilaian.map((pen) => [pen.id, pen]));

  // Histori kelas terkait anak ini
  const kelasTerkait = riwayatPendaftaran.map((rp) => {
    const k = kelasMap.get(rp.kelasId);
    const m = k ? mapelMap.get(k.mataPelajaranId) : null;
    return {
      pendaftaranId: rp.id,
      namaKelas: m ? `${m.nama} · ${k?.jenjang}` : `Kelas #${rp.kelasId}`,
      status: rp.status,
      isCurrent: rp.id === pid,
    };
  });

  return (
    <PageShell>
      <PageHeader
        backHref="/teacher/grades"
        title={nama}
        desc={t("gradeStudentDescription", {
          subject: mapel[0]?.nama ?? t("class"),
          level: kelas.jenjang,
          status: t(`status_${p.status}`),
        })}
        meta={t("gradeEntriesCount", { count: nilai.length + laporanRows.length })}
      />

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* KIRI: kartu siswa + info kehadiran + histori kelas terkait */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Panel>
            <div className="p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-100 text-base font-bold text-blue-800">
                  {nama.trim().charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-display text-[15px] font-bold tracking-tight text-slate-900">{nama}</p>
                  <p className="text-xs text-slate-500">{t("enrollmentId", { id: p.id })}</p>
                </div>
              </div>
              <dl className="mt-4 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
                {[
                  [t("recordedAttendance"), t("sessionsCount", { count: presensi.length })],
                  [t("present"), t("sessionsCount", { count: nHadir })],
                  [t("progressReportsTab"), `${laporanRows.length}`],
                  [t("classAssessmentsTab"), `${hasilPenilaianRows.length}`],
                  [t("editable"), t("editableCount", { count: editable })],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-bold tabular-nums text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Panel>

          {/* Histori Kelas Terkait */}
          <Panel>
            <div className="border-b border-slate-100 px-4 py-3 sm:px-6">
              <h3 className="text-xs font-bold text-slate-900">Histori Kelas Terkait</h3>
            </div>
            <div className="p-4 sm:p-6">
              {kelasTerkait.length === 0 ? (
                <p className="text-xs text-slate-500">Tidak ada kelas lain.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {kelasTerkait.map((kt) => (
                    <li
                      key={kt.pendaftaranId}
                      className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 ${
                        kt.isCurrent ? "bg-blue-50 font-semibold text-blue-900" : "text-slate-600"
                      }`}
                    >
                      <span className="truncate">{kt.namaKelas}</span>
                      <Badge tone={kt.status === "terdaftar" ? "emerald" : "slate"}>
                        {t(`status_${kt.status}`)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Panel>
        </div>

        {/* KANAN: Tabbed Main Content */}
        <div className="space-y-4">
          {/* Tabs switch */}
          <nav className="inline-flex flex-wrap gap-1 rounded-full bg-slate-100 p-1 text-xs">
            {[
              ["perkembangan", `${t("progressReportsTab")} (${laporanRows.length})`],
              ["penilaian", `${t("classAssessmentsTab")} (${hasilPenilaianRows.length})`],
              ["legacy", `${t("legacyGradesTab")} (${nilai.length})`],
            ].map(([tabKey, tabLabel]) => (
              <Link
                key={tabKey}
                href={`/teacher/grades/${pid}?tab=${tabKey}`}
                className={`rounded-full px-4 py-2 font-semibold transition-colors ${
                  activeTab === tabKey
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tabLabel}
              </Link>
            ))}
          </nav>

          {activeTab === "perkembangan" ? (
            <div className="space-y-4">
              {/* Form Laporan Perkembangan Baru */}
              <Panel>
                <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                  <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">
                    {t("newProgressReport")}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Catatan internal guru disimpan terpisah dan aman dari publikasi orang tua.
                  </p>
                </div>
                <div className="p-4 sm:p-6">
                  <LaporanPerkembanganForm pendaftaranId={pid} />
                </div>
              </Panel>

              {/* Riwayat Laporan Perkembangan */}
              <Panel>
                <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                  <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">
                    Riwayat Laporan Perkembangan
                  </h2>
                  <p className="text-xs text-slate-500">
                    Daftar laporan perkembangan anak yang telah disimpan atau diterbitkan ke orang tua.
                  </p>
                </div>
                {laporanRows.length === 0 ? (
                  <div className="px-4 py-12 text-center sm:px-6">
                    <p className="text-sm font-semibold text-slate-700">{t("noProgressReportsYet")}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {laporanRows.map((l) => (
                      <li key={l.id} className="p-4 sm:p-6 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-slate-900 text-sm">{l.judul}</span>
                            {l.draf ? (
                              <Badge tone="slate">{t("draftStatus")}</Badge>
                            ) : (
                              <Badge tone="emerald">{t("publishedStatus")}</Badge>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 tabular-nums">
                            {new Date(`${l.tanggal}T00:00:00+07:00`).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              timeZone: "Asia/Jakarta",
                            })}
                          </span>
                        </div>

                        {/* Catatan Internal (jika ada) */}
                        {l.catatanInternal ? (
                          <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-3 text-xs">
                            <span className="font-bold text-amber-900">{t("internalNoteLabel")}: </span>
                            <span className="text-amber-950 whitespace-pre-line">{l.catatanInternal}</span>
                          </div>
                        ) : null}

                        {/* Laporan Orang Tua */}
                        {l.laporanOrtu ? (
                          <div className="rounded-lg border border-blue-100 bg-blue-50/40 p-3 text-xs">
                            <span className="font-bold text-blue-900">{t("parentReportLabel")}: </span>
                            <span className="text-slate-800 whitespace-pre-line">{l.laporanOrtu}</span>
                          </div>
                        ) : null}

                        {/* Edit details form */}
                        <details className="mt-2 group">
                          <summary className="cursor-pointer list-none text-xs font-semibold text-blue-700 hover:underline">
                            {t("editEntry")}
                          </summary>
                          <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                            <LaporanPerkembanganForm
                              pendaftaranId={pid}
                              laporanId={l.id}
                              initialTanggal={l.tanggal}
                              initialJudul={l.judul}
                              initialCatatanInternal={l.catatanInternal}
                              initialLaporanOrtu={l.laporanOrtu}
                              initialDraf={l.draf}
                              diterbitkanPada={l.diterbitkanPada}
                            />
                          </div>
                        </details>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          ) : activeTab === "penilaian" ? (
            <Panel>
              <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">
                  {t("classAssessmentsTab")}
                </h2>
                <p className="text-xs text-slate-500">
                  Hasil tugas dan penilaian kelas yang diikuti oleh siswa ini.
                </p>
              </div>
              {hasilPenilaianRows.length === 0 ? (
                <div className="px-4 py-12 text-center sm:px-6">
                  <p className="text-sm font-semibold text-slate-700">{t("noAssessmentsYet")}</p>
                </div>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {hasilPenilaianRows.map((h) => {
                    const pen = penilaianMap.get(h.penilaianId);
                    return (
                      <li key={h.id} className="p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{pen?.nama ?? `Penilaian #${h.penilaianId}`}</p>
                          <p className="text-xs text-slate-500">
                            Tanggal: {pen?.tanggal} {pen?.draf ? `· (${t("draftStatus")})` : `· (${t("publishedStatus")})`}
                          </p>
                          {h.catatan ? (
                            <p className="mt-1.5 text-xs text-slate-700 bg-slate-50 rounded px-2 py-1">
                              {h.catatan}
                            </p>
                          ) : null}
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
                            {h.statusHasil === "dinilai"
                              ? `${h.nilai} / ${pen?.nilaiMaksimum ?? 100}`
                              : t(`status${h.statusHasil.charAt(0).toUpperCase() + h.statusHasil.slice(1)}` as Parameters<typeof t>[0]) ?? h.statusHasil}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          ) : (
            /* Tab: Nilai Individu (Legacy) */
            <div className="space-y-4">
              <Panel>
                <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                  <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("newGradeEntry")}</h2>
                  <p className="text-xs text-slate-500">{t("gradeInputHelp")}</p>
                </div>
                <div className="p-4 sm:p-6">
                  <NilaiForm pendaftaranId={pid} />
                </div>
              </Panel>

              <Panel>
                <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
                  <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("gradeHistory")}</h2>
                  <p className="text-xs text-slate-500">{t("historyHelp")}</p>
                </div>
                {nilai.length === 0 ? (
                  <div className="px-4 py-14 text-center sm:px-6">
                    <p className="text-sm font-bold text-slate-900">{t("noStudentEntries")}</p>
                    <p className="mt-1 text-[13px] text-slate-500">{t("firstProgressHelp")}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {nilai.map((n) => {
                      const terkunci = !dalamJendela7Hari(n.createdAt);
                      const v = n.nilaiKuantitatif == null ? null : Number(n.nilaiKuantitatif);
                      return (
                        <li key={n.id} className="px-4 py-5 sm:px-6">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="font-display text-lg font-extrabold tabular-nums tracking-tight text-slate-900">
                                {v != null ? v : "—"}
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {new Date(`${n.tanggal}T00:00:00+07:00`).toLocaleDateString(
                                    locale === "en" ? "en-GB" : "id-ID",
                                    { timeZone: "Asia/Jakarta" },
                                  )}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {terkunci ? t("lockedAdmin") : t("editableWindow")}
                                </p>
                              </div>
                            </div>
                            {v != null ? (
                              <Badge tone={v >= 75 ? "emerald" : "brand"}>
                                {v >= 75 ? t("good") : t("needsSupport")}
                              </Badge>
                            ) : (
                              <Badge tone="slate">{t("notesOnly")}</Badge>
                            )}
                          </div>
                          {n.catatanKualitatif ? (
                            <p className="mt-2.5 whitespace-pre-line break-words rounded-xl bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
                              {n.catatanKualitatif}
                            </p>
                          ) : null}
                          {!terkunci ? (
                            <details className="mt-3 group">
                              <summary className="cursor-pointer list-none text-sm font-semibold text-blue-700 hover:underline">
                                {t("editEntry")}
                              </summary>
                              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                                <NilaiForm
                                  pendaftaranId={pid}
                                  nilaiId={n.id}
                                  defaults={{
                                    tanggal: n.tanggal,
                                    nilai: v == null ? "" : String(v),
                                    catatan: n.catatanKualitatif ?? "",
                                  }}
                                />
                              </div>
                            </details>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="border-t border-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-500 sm:px-6">
                  {t("needLockedCorrection")}{" "}
                  <Link href="/teacher/corrections" className="font-semibold text-blue-700 hover:underline">
                    {t("viewAdminCorrection")}
                  </Link>
                  .
                </p>
              </Panel>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
