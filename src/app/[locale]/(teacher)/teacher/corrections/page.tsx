import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { dalamJendela7Hari } from "@/lib/hari";
import { PageShell, PageHeader, Panel, Notice } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { PengajuanKoreksiForm, type LockedEntryItem } from "@/components/teacher/pengajuan-koreksi-form";

export const dynamic = "force-dynamic";

export default async function TeacherCorrections() {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/corrections", locale });
  const guruId = Number(session.user.id);

  // Angka nyata: entri milik guru ini yang sudah lewat jendela 7 hari + riwayat pengajuan koreksi
  const [nilai, presensi, pengajuan, semuaPendaftaran, semuaAnak] = await Promise.all([
    collect(db.orm.public.NilaiProgres.where((n) => n.dicatatOleh.eq(guruId)).all()),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
    collect(db.orm.public.PengajuanKoreksi.where((p) => p.guruId.eq(guruId)).all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Anak.all()),
  ]);

  const pendaftaranById = new Map(semuaPendaftaran.map((p) => [p.id, p]));
  const anakById = new Map(semuaAnak.map((a) => [a.id, a]));

  const getAnakNama = (pendaftaranId: number) => {
    const p = pendaftaranById.get(pendaftaranId);
    if (!p) return t("enrollmentId", { id: pendaftaranId });
    return anakById.get(p.anakId)?.nama ?? t("childFallback", { id: p.anakId });
  };

  const nilaiTerkunci = nilai.filter((n) => !dalamJendela7Hari(n.createdAt));
  const presensiTerkunci = presensi.filter((x) => !dalamJendela7Hari(x.createdAt));
  const total = nilaiTerkunci.length + presensiTerkunci.length;

  const lockedEntries: LockedEntryItem[] = [
    ...presensiTerkunci.map((x) => ({
      id: x.id,
      entitas: "presensi" as const,
      label: `${getAnakNama(x.pendaftaranId)} (${x.tanggalPertemuan})`,
      ringkasan: `Status: ${x.status}${x.catatan ? ` · "${x.catatan}"` : ""}`,
      currentValues: {
        status: x.status,
        catatan: x.catatan,
      },
    })),
    ...nilaiTerkunci.map((n) => ({
      id: n.id,
      entitas: "nilai" as const,
      label: `${getAnakNama(n.pendaftaranId)} (${n.tanggal})`,
      ringkasan: `Nilai: ${n.nilaiKuantitatif ?? "—"}${n.catatanKualitatif ? ` · "${n.catatanKualitatif}"` : ""}`,
      currentValues: {
        nilaiKuantitatif: n.nilaiKuantitatif,
        catatanKualitatif: n.catatanKualitatif,
      },
    })),
  ];

  const riwayatPengajuan = [...pengajuan].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <PageShell>
      <PageHeader
        title={t("correctionTitle")}
        desc={t("correctionDescription")}
        meta={t("lockedEntriesCount", { count: total })}
      />

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-6">
          {/* Panel Form Pengajuan Koreksi */}
          <Panel>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("newCorrectionRequest")}</h2>
              <p className="text-xs text-slate-500">{t("correctionStepsHelp")}</p>
            </div>
            <div className="p-4 sm:p-6">
              <PengajuanKoreksiForm lockedEntries={lockedEntries} />
            </div>
          </Panel>

          {/* Panel Riwayat Pengajuan Saya */}
          <Panel>
            <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("myCorrectionsHistory")}</h2>
            </div>
            {riwayatPengajuan.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                {t("noCorrectionsYet")}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {riwayatPengajuan.map((item) => {
                  let parsedUsulan: Record<string, unknown> = {};
                  try {
                    parsedUsulan = JSON.parse(item.dataUsulan);
                  } catch {
                    parsedUsulan = { data: item.dataUsulan };
                  }

                  const tone = item.status === "disetujui"
                    ? "emerald"
                    : item.status === "ditolak"
                      ? "red"
                      : "amber";

                  const statusLabel = item.status === "disetujui"
                    ? t("statusApproved")
                    : item.status === "ditolak"
                      ? t("statusRejected")
                      : t("statusPending");

                  return (
                    <div key={item.id} className="p-4 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            {item.entitas === "presensi" ? t("attendance") : t("grades")} #{item.entitasId}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              timeZone: "Asia/Jakarta",
                            })}
                          </span>
                        </div>
                        <Badge tone={tone}>{statusLabel}</Badge>
                      </div>

                      <div className="mt-3 space-y-2 text-sm">
                        <div>
                          <span className="font-medium text-slate-700">{t("correctionReason")}: </span>
                          <span className="text-slate-600">{item.alasan}</span>
                        </div>

                        <div>
                          <span className="font-medium text-slate-700">{t("proposedData")}: </span>
                          <span className="rounded bg-slate-50 px-2 py-0.5 font-mono text-xs text-slate-800">
                            {JSON.stringify(parsedUsulan)}
                          </span>
                        </div>

                        {item.catatanAdmin ? (
                          <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-700">
                            <span className="font-semibold text-slate-900">{t("adminNote")}: </span>
                            {item.catatanAdmin}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Notice tone="blue" title={t("whyLocked")}>
            {t("whyLockedBody")}
          </Notice>

          <Panel>
            <div className="p-4 sm:p-6">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("yourEntryStatus")}</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                {[
                  [t("lockedGrades"), t("entriesCount", { count: nilaiTerkunci.length })],
                  [t("lockedAttendance"), t("entriesCount", { count: presensiTerkunci.length })],
                  [t("editableByYou"), t("entriesCount", { count: nilai.length - nilaiTerkunci.length + (presensi.length - presensiTerkunci.length) })],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-3">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-bold tabular-nums text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
                <Link href="/teacher/grades" className="block font-semibold text-blue-700 hover:underline">
                  {t("findEditable")}
                </Link>
                <Link href="/teacher/classes" className="block font-semibold text-blue-700 hover:underline">
                  {t("attendanceByClass")}
                </Link>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
