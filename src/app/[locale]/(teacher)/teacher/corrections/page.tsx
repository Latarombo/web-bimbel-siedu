import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { dalamJendela7Hari } from "@/lib/hari";
import { PageShell, PageHeader, Panel, Notice } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function TeacherCorrections() {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/corrections", locale });
  const guruId = Number(session.user.id);

  // Angka nyata: entri milik guru ini yang sudah lewat jendela 7 hari.
  const [nilai, presensi] = await Promise.all([
    collect(db.orm.public.NilaiProgres.where((n) => n.dicatatOleh.eq(guruId)).all()),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
  ]);
  const nilaiTerkunci = nilai.filter((n) => !dalamJendela7Hari(n.createdAt)).length;
  const presensiTerkunci = presensi.filter((x) => !dalamJendela7Hari(x.createdAt)).length;
  const total = nilaiTerkunci + presensiTerkunci;

  return (
    <PageShell>
      <PageHeader
        title={t("correctionTitle")}
        desc={t("correctionDescription")}
        meta={t("lockedEntriesCount", { count: total })}
      />

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel>
          <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
            <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("requestCorrection")}</h2>
            <p className="text-xs text-slate-500">{t("correctionStepsHelp")}</p>
          </div>
          <ol className="divide-y divide-slate-100">
            {[
              {
                t: t("correctionStep1"),
                d: t("correctionStep1Body"),
              },
              {
                t: t("correctionStep2"),
                d: t("correctionStep2Body"),
              },
              {
                t: t("correctionStep3"),
                d: t("correctionStep3Body"),
              },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-3 px-4 py-5 sm:gap-4 sm:px-6">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-blue-600 text-[13px] font-bold text-white tabular-nums">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{s.t}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>

        <div className="flex flex-col gap-4">
          <Notice tone="blue" title={t("whyLocked")}>
            {t("whyLockedBody")}
          </Notice>

          <Panel>
            <div className="p-4 sm:p-6">
              <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("yourEntryStatus")}</h2>
              <dl className="mt-3 space-y-2.5 text-sm">
                {[
                  [t("lockedGrades"), t("entriesCount", { count: nilaiTerkunci })],
                  [t("lockedAttendance"), t("entriesCount", { count: presensiTerkunci })],
                  [t("editableByYou"), t("entriesCount", { count: nilai.length - nilaiTerkunci + (presensi.length - presensiTerkunci) })],
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
