import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageShell, PageHeader, Panel, FilterTabs } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const WIB = "Asia/Jakarta";

export default async function TeacherClasses({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/classes", locale });
  const { status = "semua" } = await searchParams;
  const guruId = Number(session.user.id);

  const kelas = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all(),
  );

  const [mapel, jadwal, pendaftaran] = await Promise.all([
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.JadwalItem.all()),
    kelas.length
      ? collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in(kelas.map((k) => k.id))).all())
      : Promise.resolve([]),
  ]);
  const mapelById = new Map(mapel.map((m) => [m.id, m]));
  const hariIniStr = new Date().toLocaleDateString("en-CA", { timeZone: WIB });

  const hitung = (s?: string) => (s === "semua" ? kelas.length : kelas.filter((k) => k.status === s).length);
  const shown = status === "semua" ? kelas : kelas.filter((k) => k.status === status);
  const aktifCount = kelas.filter((k) => k.status === "aktif").length;

  const rows = shown.map((k) => {
    const nAktif = pendaftaran.filter(
      (p) => p.kelasId === k.id && ["terdaftar", "tertunggak"].includes(p.status),
    ).length;
    return { k, nAktif };
  });
  rows.sort((a, b) => (a.k.status === "aktif" ? -1 : 1) - (b.k.status === "aktif" ? -1 : 1) || b.nAktif - a.nAktif);

  return (
    <PageShell>
      <PageHeader
        title={t("assignedClassesTitle")}
        desc={t("classesDescription")}
        meta={t("classCounts", { active: aktifCount, total: kelas.length })}
      />

      <FilterTabs
        label={t("filterClassStatus")}
        tabs={[
          { label: t("all"), href: "/teacher/classes", count: hitung("semua"), aktif: status === "semua" },
          { label: t("active"), href: "/teacher/classes?status=aktif", count: hitung("aktif"), aktif: status === "aktif" },
          { label: t("cancelled"), href: "/teacher/classes?status=dibatalkan", count: hitung("dibatalkan"), aktif: status === "dibatalkan" },
        ]}
      />

      {rows.length === 0 ? (
        <Panel className="mt-4">
          <div className="px-4 py-14 text-center sm:px-6">
            <p className="text-sm font-bold text-slate-900">
              {kelas.length === 0 ? t("noAssignedClasses") : t("noClassesWithStatus")}
            </p>
            <p className="mt-1 text-[13px] text-slate-500">
              {kelas.length === 0
                ? t("assignmentAdminHelp")
                : t("changeFilterHelp")}
            </p>
            {status !== "semua" ? (
              <ButtonLink href="/teacher/classes" size="sm" variant="outline" className="mt-4">{t("viewAll")}</ButtonLink>
            ) : null}
          </div>
        </Panel>
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {rows.map(({ k, nAktif }) => {
            const sesi = jadwal
              .filter((j) => j.kelasId === k.id)
              .sort((a, b) => a.hari.localeCompare(b.hari) || a.jamMulai.localeCompare(b.jamMulai));
            const pct = Math.min(100, Math.round((nAktif / Math.max(k.kuotaMaksimum, 1)) * 100));
            const m = mapelById.get(k.mataPelajaranId);
            return (
              <Panel key={k.id}>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-base font-bold tracking-tight text-slate-900">
                        {m?.nama ?? t("class")} · {k.jenjang}
                      </h2>
                      <p className="mt-0.5 text-xs text-slate-500">{t("classId", { id: k.id })}</p>
                    </div>
                    <Badge tone={k.status === "aktif" ? "emerald" : "amber"}>{t(k.status === "aktif" ? "active" : "cancelled")}</Badge>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-bold tabular-nums text-slate-700">{t("activeCapacity", { count: nAktif, max: k.kuotaMaksimum })}</span>
                      <span className="tabular-nums text-slate-500">{pct}%</span>
                    </div>
                    <div
                      className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-200/80"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={t("capacityFilled")}
                    >
                      <div className={`h-full rounded-full ${pct >= 90 ? "bg-amber-500" : "bg-blue-600"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
                    {sesi.length === 0 ? (
                      <li className="px-4 py-2.5 text-[13px] text-slate-500">{t("noSessionScheduleAdmin")}</li>
                    ) : (
                      sesi.map((j) => (
                        <li key={j.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                          <span className="text-sm text-slate-700">
                            <span className="font-semibold text-slate-900">{t(`day_${j.hari}`)}</span>{" "}
                            <span className="tabular-nums">{j.jamMulai.slice(0, 5)}–{j.jamSelesai.slice(0, 5)}</span>
                          </span>
                          <Link
                            href={`/teacher/classes/${k.id}/sessions/${hariIniStr}/attendance`}
                            className="text-sm font-semibold text-blue-700 hover:underline"
                          >
                            {t("attendanceToday")}
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>

                  <div className="mt-4 flex items-center gap-3">
                    <ButtonLink href={`/teacher/classes/${k.id}`} size="sm">{t("openRoster")}</ButtonLink>
                    <Link href={`/teacher/grades?kelas=${k.id}`} className="text-sm font-semibold text-slate-500 hover:text-slate-900 hover:underline">
                      {t("studentGrades")}
                    </Link>
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
