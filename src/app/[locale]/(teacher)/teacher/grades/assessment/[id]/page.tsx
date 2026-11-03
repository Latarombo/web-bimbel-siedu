import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect, Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { PenilaianForm, type StudentAssessmentRow } from "@/components/teacher/penilaian-form";

export const dynamic = "force-dynamic";

export default async function EditClassAssessment({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/grades", locale });
  const guruId = Number(session.user.id);
  const { id: assessmentIdStr } = await params;
  const assessmentId = Number(assessmentIdStr);

  if (!Number.isInteger(assessmentId) || assessmentId <= 0) {
    notFound();
  }

  const [assessment] = await collect(
    db.orm.public.Penilaian.where({ id: assessmentId, dibuatOleh: guruId }).all(),
  );
  if (!assessment) {
    notFound();
  }

  const [kelas] = await collect(
    db.orm.public.Kelas.where({ id: assessment.kelasId }).all(),
  );
  const mapelList = await collect(db.orm.public.MataPelajaran.all());
  const mapelById = new Map(mapelList.map((m) => [m.id, m]));
  const mapelName = kelas ? mapelById.get(kelas.mataPelajaranId)?.nama ?? "Kelas" : "Kelas";
  const kelasLabel = kelas ? `${mapelName} · ${kelas.jenjang}` : "";

  const [pendaftaranRows, anakRows, hasilRows] = await Promise.all([
    collect(db.orm.public.Pendaftaran.where({ kelasId: assessment.kelasId }).all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.HasilPenilaian.where({ penilaianId: assessment.id }).all()),
  ]);

  const anakById = new Map(anakRows.map((a) => [a.id, a]));
  const hasilByPendaftaran = new Map(hasilRows.map((h) => [h.pendaftaranId, h]));

  const activePendaftaran = pendaftaranRows.filter(
    (p) => p.status === "terdaftar" || p.status === "tertunggak" || hasilByPendaftaran.has(p.id),
  );

  const siswa: StudentAssessmentRow[] = activePendaftaran.map((p) => {
    const h = hasilByPendaftaran.get(p.id);
    return {
      pendaftaranId: p.id,
      nama: anakById.get(p.anakId)?.nama ?? t("childFallback", { id: p.anakId }),
      statusHasil: h ? (h.statusHasil as "belum_dinilai" | "dinilai" | "tidak_ikut") : "belum_dinilai",
      nilai: h?.nilai ?? null,
      catatan: h?.catatan ?? null,
    };
  });

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
        <span className="font-semibold text-slate-900 dark:text-slate-200 truncate">
          {assessment.nama}
        </span>
      </nav>

      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {assessment.nama}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          {kelasLabel}
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xs">
        <PenilaianForm
          kelasId={assessment.kelasId}
          penilaianId={assessment.id}
          initialNama={assessment.nama}
          initialTanggal={assessment.tanggal}
          initialNilaiMaksimum={assessment.nilaiMaksimum}
          initialDraf={assessment.draf}
          diterbitkanPada={assessment.diterbitkanPada}
          siswa={siswa}
        />
      </div>
    </div>
  );
}
