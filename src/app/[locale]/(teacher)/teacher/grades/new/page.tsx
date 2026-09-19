import { getTranslations, getLocale } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";
import { PenilaianForm, type StudentAssessmentRow } from "@/components/teacher/penilaian-form";

export const dynamic = "force-dynamic";

export default async function NewClassAssessment({
  searchParams,
}: {
  searchParams: Promise<{ kelasId?: string }>;
}) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/grades/new", locale });
  const guruId = Number(session.user.id);
  const { kelasId: queryKelasId } = await searchParams;

  const kelasList = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).where((k) => k.status.eq("aktif")).all(),
  );
  if (kelasList.length === 0) {
    return (
      <PageShell>
        <PageHeader backHref="/teacher/grades" title={t("newAssessmentButton")} desc={t("noActiveClasses")} />
        <Panel className="mt-4 p-8 text-center text-sm text-slate-500">
          {t("noActiveClasses")}
        </Panel>
      </PageShell>
    );
  }

  const mapelList = await collect(db.orm.public.MataPelajaran.all());
  const mapelById = new Map(mapelList.map((m) => [m.id, m]));

  const selectedKelasId = queryKelasId ? Number(queryKelasId) : kelasList[0].id;
  const activeKelas = kelasList.find((k) => k.id === selectedKelasId) ?? kelasList[0];

  const [pendaftaranRows, anakRows] = await Promise.all([
    collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.eq(activeKelas.id)).all()),
    collect(db.orm.public.Anak.all()),
  ]);

  const anakById = new Map(anakRows.map((a) => [a.id, a]));
  const activePendaftaran = pendaftaranRows.filter(
    (p) => p.status === "terdaftar" || p.status === "tertunggak",
  );

  const siswa: StudentAssessmentRow[] = activePendaftaran.map((p) => ({
    pendaftaranId: p.id,
    nama: anakById.get(p.anakId)?.nama ?? t("childFallback", { id: p.anakId }),
    statusHasil: "belum_dinilai",
    nilai: null,
    catatan: null,
  }));

  const mapelName = mapelById.get(activeKelas.mataPelajaranId)?.nama ?? "Kelas";
  const kelasLabel = `${mapelName} · ${activeKelas.jenjang}`;

  return (
    <PageShell>
      <PageHeader
        backHref="/teacher/grades"
        title={t("newAssessmentButton")}
        desc={kelasLabel}
      />

      {kelasList.length > 1 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">{t("filterClass")}:</span>
          {kelasList.map((k) => (
            <Link
              key={k.id}
              href={`/teacher/grades/new?kelasId=${k.id}`}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                k.id === activeKelas.id
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {mapelById.get(k.mataPelajaranId)?.nama} · {k.jenjang}
            </Link>
          ))}
        </div>
      ) : null}

      <Panel className="mt-5 p-4 sm:p-6">
        <PenilaianForm
          kelasId={activeKelas.id}
          siswa={siswa}
        />
      </Panel>
    </PageShell>
  );
}
