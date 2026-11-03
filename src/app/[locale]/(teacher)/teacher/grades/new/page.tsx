import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { PenilaianForm, type StudentAssessmentRow } from "@/components/teacher/penilaian-form";

export const dynamic = "force-dynamic";

export default async function NewClassAssessment({
  searchParams,
}: {
  searchParams: Promise<{ kelasId?: string; nama?: string; tanggal?: string }>;
}) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/grades/new", locale });
  const guruId = Number(session.user.id);
  const { kelasId: queryKelasId, nama: queryNama, tanggal: queryTanggal } = await searchParams;

  const kelasList = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).where((k) => k.status.eq("aktif")).all(),
  );
  if (kelasList.length === 0) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link href="/teacher/dashboard" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <Link href="/teacher/grades" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
            Nilai
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-slate-200">
            {t("newAssessmentButton")}
          </span>
        </nav>
        <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {t("newAssessmentButton")}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t("noActiveClasses")}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-500 dark:text-slate-400 shadow-2xs">
          {t("noActiveClasses")}
        </div>
      </div>
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
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <Link href="/teacher/dashboard" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
          Dashboard
        </Link>
        <span>/</span>
        <Link href="/teacher/grades" className="hover:text-slate-950 dark:hover:text-slate-100 transition-colors">
          Nilai
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900 dark:text-slate-200">
          {t("newAssessmentButton")}
        </span>
      </nav>

      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {t("newAssessmentButton")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          {kelasLabel}
        </p>
      </div>

      {kelasList.length > 1 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{t("filterClass")}:</span>
          {kelasList.map((k) => (
            <Link
              key={k.id}
              href={`/teacher/grades/new?kelasId=${k.id}${queryNama ? `&nama=${encodeURIComponent(queryNama)}` : ""}${queryTanggal ? `&tanggal=${encodeURIComponent(queryTanggal)}` : ""}`}
              className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                k.id === activeKelas.id
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                  : "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {mapelById.get(k.mataPelajaranId)?.nama} · {k.jenjang}
            </Link>
          ))}
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xs">
        <PenilaianForm
          kelasId={activeKelas.id}
          siswa={siswa}
          initialNama={queryNama ?? ""}
          initialTanggal={queryTanggal ?? undefined}
        />
      </div>
    </div>
  );
}
