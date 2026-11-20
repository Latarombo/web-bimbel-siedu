import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect, Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { ArrowLeft } from "lucide-react";
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
  const kelasLabel = kelas ? `${mapelName} · ${kelas.jenjang}${kelas.tingkat ? ` (${kelas.tingkat})` : ""}` : "";

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
      jenjang: kelas?.jenjang,
    };
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      {/* Top back navigation */}
      <div>
        <Link
          href="/teacher/grades"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Kembali ke Nilai & Penilaian</span>
        </Link>
      </div>

      {/* Title & Metadata */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {assessment.nama}
        </h1>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          {kelasLabel} · {t("assessmentDate")}: {assessment.tanggal} · Batas Maks: {assessment.nilaiMaksimum} Poin
        </p>
      </div>

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
  );
}
