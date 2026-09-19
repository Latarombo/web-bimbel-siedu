import { getTranslations, getLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";
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
  if (!session?.user) return redirect(`/login?next=/teacher/grades`);
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
    <PageShell>
      <PageHeader
        backHref="/teacher/grades"
        title={assessment.nama}
        desc={kelasLabel}
      />

      <Panel className="mt-5 p-4 sm:p-6">
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
      </Panel>
    </PageShell>
  );
}
