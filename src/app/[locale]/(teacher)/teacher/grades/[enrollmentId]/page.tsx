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

export const dynamic = "force-dynamic";

export default async function GradeInputPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/grades", locale });
  const { enrollmentId } = await params;
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

  const [mapel, anak, nilai, presensi] = await Promise.all([
    collect(db.orm.public.MataPelajaran.where((m) => m.id.eq(kelas.mataPelajaranId)).all()),
    collect(db.orm.public.Anak.where((a) => a.id.eq(p.anakId)).all()),
    collect(
      db.orm.public.NilaiProgres.where((n) => n.pendaftaranId.eq(pid))
        .orderBy((n) => n.tanggal.desc())
        .all(),
    ),
    collect(db.orm.public.Presensi.where((x) => x.pendaftaranId.eq(pid)).all()),
  ]);
  const nama = anak[0]?.nama ?? t("childFallback", { id: p.anakId });
  const nHadir = presensi.filter((x) => x.status === "hadir").length;
  const editable = nilai.filter((n) => dalamJendela7Hari(n.createdAt)).length;

  return (
    <PageShell>
      <PageHeader
        backHref="/teacher/grades"
        title={nama}
        desc={t("gradeStudentDescription", { subject: mapel[0]?.nama ?? t("class"), level: kelas.jenjang, status: t(`status_${p.status}`) })}
        meta={t("gradeEntriesCount", { count: nilai.length })}
      />

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* KIRI: kartu siswa + form entri — kolom aksi dulu di desktop lebar? tidak:
            referensi (Kuest) menaruh form di kiri, riwayat di kanan. */}
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

          <Panel>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("newGradeEntry")}</h2>
              <p className="text-xs text-slate-500">{t("gradeInputHelp")}</p>
            </div>
            <div className="p-4 sm:p-6">
              <NilaiForm pendaftaranId={pid} />
            </div>
          </Panel>
        </div>

        {/* KANAN: riwayat linimasa */}
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
                          <p className="text-sm font-semibold text-slate-900">{new Date(`${n.tanggal}T00:00:00+07:00`).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", { timeZone: "Asia/Jakarta" })}</p>
                          <p className="text-xs text-slate-500">
                            {terkunci ? t("lockedAdmin") : t("editableWindow")}
                          </p>
                        </div>
                      </div>
                      {v != null ? (
                        <Badge tone={v >= 75 ? "emerald" : "brand"}>{v >= 75 ? t("good") : t("needsSupport")}</Badge>
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
    </PageShell>
  );
}
