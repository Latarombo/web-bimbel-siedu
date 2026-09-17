import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";
import KelasForm from "@/components/admin/kelas-form";

export const dynamic = "force-dynamic";

export default async function AdminClassesNew() {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/classes/new", locale }) } }, locale });

  const [mapel, guru, periode] = await Promise.all([
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.where((u) => u.role.eq("guru")).all()),
    collect(db.orm.public.PeriodePendaftaran.all()),
  ]);

  return (
    <PageShell>
      <PageHeader
        title={t("text73")}
        desc={t("text74")}
      />

      <Panel className="mt-6 p-6 sm:p-8">
        <KelasForm
          mapelOptions={mapel.map((m) => ({ id: m.id, nama: m.nama }))}
          guruOptions={guru.map((g) => ({ id: g.id, nama: g.name })).sort((a, b) => a.nama.localeCompare(b.nama))}
          periodeOptions={periode.map((p) => ({ id: p.id, nama: p.nama, status: p.status }))}
        />
      </Panel>

      <p className="mt-4 text-sm text-slate-500">
        <Link href="/admin/classes" className="font-semibold text-blue-700 hover:underline">{t("text75")} </Link>
        {" · "}{t("masterDataLinks")}{" "}
        <Link href="/admin/subjects" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-900">{t("text8")} </Link>{" "}
        {t("and")}{" "}
        <Link href="/admin/teachers" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-900">{t("text10")} </Link>
        .
      </p>
    </PageShell>
  );
}
