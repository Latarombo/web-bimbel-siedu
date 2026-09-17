import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { tanggalWIB } from "@/lib/hari";
import { rencanakanSesi } from "@/lib/rencana-sesi";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const WIB = "Asia/Jakarta";

export default async function TeacherClassDetail({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/classes", locale });
  const { classId } = await params;
  const kid = Number(classId);
  if (!Number.isInteger(kid)) notFound();
  const guruId = Number(session.user.id);

  const [kelas] = await collect(
    db.orm.public.Kelas.where((k) => k.id.eq(kid))
      .where((k) => k.guruId.eq(guruId))
      .all(),
  );
  if (!kelas) notFound();

  const [mapel, jadwal, pendaftaran, semuaAnak, nilaiByGuru, presensiByGuru] = await Promise.all([
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.JadwalItem.where((j) => j.kelasId.eq(kid)).all()),
    collect(
      db.orm.public.Pendaftaran.where((p) => p.kelasId.eq(kid))
        .where((p) => p.status.in(["terdaftar", "tertunggak"]))
        .all(),
    ),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.NilaiProgres.where((n) => n.dicatatOleh.eq(guruId)).all()),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
  ]);
  const m = mapel.find((x) => x.id === kelas.mataPelajaranId);
  const anakById = new Map(semuaAnak.map((a) => [a.id, a]));
  const sesiIds = new Set(jadwal.map((j) => j.id));
  const hariIniStr = tanggalWIB(new Date());
  const [periode] = await collect(
    db.orm.public.PeriodePendaftaran.where((p) => p.id.eq(kelas.periodeId)).all(),
  );
  const tersimpan = jadwal.length ? await collect(
    db.orm.public.SesiPertemuan.where((s) => s.jadwalItemId.in([...sesiIds]))
      .where((s) => s.tanggalPertemuan.gte(hariIniStr)).all(),
  ) : [];
  const awal = periode && periode.tanggalMulai > hariIniStr ? periode.tanggalMulai : hariIniStr;
  const rencana = kelas.status === "aktif" && periode && awal <= periode.tanggalSelesai
    ? rencanakanSesi(awal, periode.tanggalSelesai, jadwal) : [];
  const byKey = new Map(tersimpan.map((s) => [`${s.jadwalItemId}:${s.tanggalPertemuan}`, s]));
  const berikutBySlot = new Map<number, (typeof rencana)[number]>();
  const kandidat = kelas.status === "aktif" && periode ? [
    ...tersimpan.filter((s) => s.tanggalPertemuan >= awal && s.tanggalPertemuan <= periode.tanggalSelesai),
    ...rencana,
  ].sort((a, b) => a.tanggalPertemuan.localeCompare(b.tanggalPertemuan) || a.jamMulai.localeCompare(b.jamMulai)) : [];
  for (const calon of kandidat) {
    if (berikutBySlot.has(calon.jadwalItemId)) continue;
    const sesi = byKey.get(`${calon.jadwalItemId}:${calon.tanggalPertemuan}`);
    if (sesi?.statusSesi === "dibatalkan") continue;
    berikutBySlot.set(calon.jadwalItemId, {
      ...calon, jamMulai: sesi?.jamMulai ?? calon.jamMulai, jamSelesai: sesi?.jamSelesai ?? calon.jamSelesai,
    });
  }
  const pertamaHariIni = [...berikutBySlot.values()]
    .filter((s) => s.tanggalPertemuan === hariIniStr)
    .sort((a, b) => a.jamMulai.localeCompare(b.jamMulai))[0];

  const nHadir = new Map<number, number>();
  for (const x of presensiByGuru) {
    if (!sesiIds.has(x.jadwalItemId) || x.status !== "hadir") continue;
    nHadir.set(x.pendaftaranId, (nHadir.get(x.pendaftaranId) ?? 0) + 1);
  }
  const nSesiHadir = new Map<number, number>();
  for (const p of pendaftaran) {
    nSesiHadir.set(p.id, presensiByGuru.filter((x) => x.pendaftaranId === p.id).length);
  }

  const rows = pendaftaran.map((p) => {
    const nilai = nilaiByGuru.filter((n) => n.pendaftaranId === p.id);
    const num = nilai.filter((n) => n.nilaiKuantitatif != null).map((n) => Number(n.nilaiKuantitatif));
    return {
      p,
      anak: anakById.get(p.anakId),
      nNilai: nilai.length,
      rata: num.length ? Math.round(num.reduce((s, v) => s + v, 0) / num.length) : null,
      hadir: nHadir.get(p.id) ?? 0,
      tercatat: nSesiHadir.get(p.id) ?? 0,
    };
  });
  rows.sort((a, b) => (a.anak?.nama ?? "").localeCompare(b.anak?.nama ?? ""));

  const pct = Math.min(100, Math.round((pendaftaran.length / Math.max(kelas.kuotaMaksimum, 1)) * 100));
  const sesi = jadwal.sort((a, b) => a.hari.localeCompare(b.hari) || a.jamMulai.localeCompare(b.jamMulai));

  return (
    <PageShell wide>
      <PageHeader
        backHref="/teacher/classes"
        title={`${m?.nama ?? t("class")} · ${kelas.jenjang}`}
        desc={t("classDetailMeta", { id: kelas.id, status: t(`status_${kelas.status}`), count: pendaftaran.length, max: kelas.kuotaMaksimum })}
        meta={pct >= 90 ? t("almostFull") : undefined}
      >
        {pertamaHariIni ? (
          <ButtonLink href={`/teacher/classes/${kid}/sessions/${hariIniStr}/attendance?sesi=${pertamaHariIni.jadwalItemId}`} variant="outline">
            {t("attendanceToday")}
          </ButtonLink>
        ) : null}
      </PageHeader>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel>
          <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
            <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("activeRoster")}</h2>
            <p className="text-xs text-slate-500">{t("rosterSummary", { count: rows.length })}</p>
          </div>
          {rows.length === 0 ? (
            <div className="px-4 py-14 text-center sm:px-6">
              <p className="text-sm font-bold text-slate-900">{t("noEnrolledStudents")}</p>
              <p className="mt-1 text-[13px] text-slate-500">{t("rosterApprovalHelp")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto overscroll-x-contain">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-600">
                    <th className="px-4 py-3 sm:px-6">{t("name")}</th>
                    <th className="px-4 py-3">{t("status")}</th>
                    <th className="hidden px-4 py-3 text-center md:table-cell">{t("gradeEntries")}</th>
                    <th className="px-4 py-3 text-center">{t("average")}</th>
                    <th className="hidden px-4 py-3 text-center md:table-cell">{t("present")}</th>
                    <th className="px-4 py-3 text-right sm:px-6">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(({ p, anak, nNilai, rata, hadir, tercatat }) => (
                    <tr key={p.id} className="transition-colors hover:bg-slate-50">
                      <td className="px-4 py-3 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">
                            {(anak?.nama ?? "?").trim().charAt(0).toUpperCase()}
                          </span>
                          <span className="font-semibold text-slate-900">{anak?.nama ?? t("childFallback", { id: p.anakId })}</span>
                        </div>
                        {/* Kolom Entri/Hadir disembunyikan di HP — ringkasannya jadi baris kecil di sel nama. */}
                        <p className="mt-1 text-xs text-slate-500 md:hidden">
                          {t("studentGradeAttendance", { count: nNilai, attendance: tercatat > 0 ? t("attendedSessions", {count: hadir, total: tercatat}) : t("noAttendance") })}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={p.status === "terdaftar" ? "emerald" : "amber"}>{t(`status_${p.status}`)}</Badge>
                      </td>
                      <td className="hidden px-4 py-3 text-center tabular-nums text-slate-700 md:table-cell">{nNilai}</td>
                      <td className="px-4 py-3 text-center">
                        {rata != null ? <Badge tone={rata >= 75 ? "emerald" : "brand"}>{rata}</Badge> : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="hidden px-4 py-3 text-center text-xs tabular-nums text-slate-600 md:table-cell">
                        {tercatat > 0 ? t("sessionRatio", { count: hadir, total: tercatat }) : t("noAttendance")}
                      </td>
                      <td className="px-4 py-3 text-right sm:px-6">
                        <Link href={`/teacher/grades/${p.id}`} className="text-sm font-semibold text-blue-700 hover:underline">
                          {t("gradesNotes")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <Panel>
            <div className="p-4 sm:p-6">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("sessionSchedule")}</h2>
              <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
                {sesi.length === 0 ? (
                  <li className="px-4 py-3 text-[13px] text-slate-500">{t("noClassScheduleAdmin")}</li>
                ) : (
                  sesi.map((j) => {
                    const berikut = berikutBySlot.get(j.id);
                    return (
                    <li key={j.id} className="flex items-center justify-between gap-2 px-4 py-3">
                      <span className="text-sm text-slate-700">
                        <span className="font-semibold text-slate-900">{t(`day_${j.hari}`)}</span>{" "}
                        <span className="tabular-nums">{j.jamMulai.slice(0, 5)}–{j.jamSelesai.slice(0, 5)}</span>
                      </span>
                      {berikut ? (
                        <Link
                          href={`/teacher/classes/${kid}/sessions/${berikut.tanggalPertemuan}/attendance?sesi=${j.id}`}
                          className="text-right text-xs font-semibold text-blue-700 hover:underline"
                        >
                          {t("attendance")} {new Date(`${berikut.tanggalPertemuan}T00:00:00+07:00`).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: WIB })}
                          <span className="block tabular-nums">{berikut.jamMulai.slice(0, 5)} s.d. {berikut.jamSelesai.slice(0, 5)}</span>
                        </Link>
                      ) : null}
                    </li>
                    );
                  })
                )}
              </ul>
              <div className="mt-4">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-bold tabular-nums text-slate-700">{t("seatsFilled", { count: pendaftaran.length, max: kelas.kuotaMaksimum })}</span>
                  <span className="tabular-nums text-slate-500">{pct}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200/80" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={t("capacityFilled")}>
                  <div className={`h-full rounded-full ${pct >= 90 ? "bg-amber-500" : "bg-blue-600"}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          </Panel>

          <Panel>
            <div className="p-4 sm:p-6">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("teachingSummary")}</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                {[
                  [t("activeStudents"), `${rows.length}`],
                  [t("yourGradeEntries"), `${nilaiByGuru.filter((n) => pendaftaran.some((p) => p.id === n.pendaftaranId)).length}`],
                  [t("recordedAttendance"), `${presensiByGuru.filter((x) => sesiIds.has(x.jadwalItemId)).length}`],
                  [t("minimumCapacity"), t("studentsCount", { count: kelas.kuotaMinimum })],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-bold tabular-nums text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 border-t border-slate-100 pt-3 text-xs leading-relaxed text-slate-500">
                {t("ownEntriesHelp")}
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
