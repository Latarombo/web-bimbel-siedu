import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";
import GuruProfilForm from "@/components/teacher/guru-profil-form";

export const dynamic = "force-dynamic";

export default async function TeacherProfile() {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/profile", locale });
  const guruId = Number(session.user.id);

  const [guru] = await collect(db.orm.public.User.where((u) => u.id.eq(guruId)).all());
  if (!guru) return redirect({ href: "/login", locale });

  const kelas = await collect(db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all());
  const [mapel, nilai, presensi] = await Promise.all([
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.NilaiProgres.where((n) => n.dicatatOleh.eq(guruId)).all()),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
  ]);
  const mapelNama = new Set(
    kelas.map((k) => mapel.find((m) => m.id === k.mataPelajaranId)?.nama).filter(Boolean),
  );
  const inisial = (guru.name ?? "?").trim().charAt(0).toUpperCase();

  return (
    <PageShell>
      <PageHeader title={t("profile")} desc={t("profileDescription")} />

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel>
          <div className="border-b border-slate-100 px-4 py-4 sm:px-6">
            <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("contactDetails")}</h2>
            <p className="text-xs text-slate-500">{t("profileChangesHelp")}</p>
          </div>
          <div className="p-4 sm:p-6">
            <GuruProfilForm
              defaults={{
                nama: guru.name,
                alamat: guru.alamat ?? "",
                nomorTelepon: guru.nomorTelepon ?? "",
              }}
            />
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel>
            <div className="p-4 text-center sm:p-6">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-blue-600 text-2xl font-bold text-white">
                {inisial}
              </span>
              <p className="mt-3 font-display text-lg font-bold tracking-tight text-slate-900">{guru.name}</p>
              <p className="text-sm text-slate-500">{guru.email}</p>
              <span className="mt-2 inline-flex rounded-full bg-blue-100 px-3 py-0.5 text-xs font-bold text-blue-800">
                {t("teacher")}
              </span>
            </div>
            <dl className="divide-y divide-slate-100 border-t border-slate-100 text-sm">
              {[
                [t("assignedClasses"), `${kelas.length}`],
                [t("teachingSubjects"), mapelNama.size ? [...mapelNama].join(", ") : "—"],
                [t("gradeEntries"), `${nilai.length}`],
                [t("attendanceEntries"), `${presensi.length}`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 px-4 py-3 sm:px-6">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="min-w-0 text-right font-semibold text-slate-900">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>

          <Panel>
            <div className="p-4 text-[13px] leading-relaxed text-slate-600 sm:p-6">
              <p className="font-display text-[15px] font-bold tracking-tight text-slate-900">{t("emailPassword")}</p>
              <p className="mt-2">
                {t("emailPasswordHelp")}
              </p>
            </div>
          </Panel>
        </div>
      </div>
    </PageShell>
  );
}
