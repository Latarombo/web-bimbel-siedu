import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {t("profile")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t("profileDescription")}
        </p>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
          <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-4 sm:px-6">
            <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-950 dark:text-slate-100">{t("contactDetails")}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t("profileChangesHelp")}</p>
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
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="p-4 text-center sm:p-6">
              <span className="mx-auto grid size-16 place-items-center rounded-full bg-amber-400 text-2xl font-black text-amber-950 shadow-2xs">
                {inisial}
              </span>
              <p className="mt-3 font-display text-lg font-bold tracking-tight text-slate-950 dark:text-slate-100">{guru.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{guru.email}</p>
            </div>
            <dl className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 text-sm">
              {[
                [t("assignedClasses"), `${kelas.length}`],
                [t("teachingSubjects"), mapelNama.size ? [...mapelNama].join(", ") : ""],
                [t("gradeEntries"), `${nilai.length}`],
                [t("attendanceEntries"), `${presensi.length}`],
              ].map(([k, v]) => (
                <div key={k} className="flex items-baseline justify-between gap-3 px-4 py-3 sm:px-6">
                  <dt className="text-slate-500 dark:text-slate-400">{k}</dt>
                  <dd className="min-w-0 text-right font-semibold text-slate-900 dark:text-slate-100">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs p-4 sm:p-6 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
            <p className="font-display text-[15px] font-bold tracking-tight text-slate-950 dark:text-slate-100">{t("emailPassword")}</p>
            <p className="mt-2 text-xs leading-relaxed">
              {t("emailPasswordHelp")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
