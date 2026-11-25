import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { redirect, Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { ChevronRight } from "lucide-react";
import { PenilaianForm, type StudentAssessmentRow } from "@/components/teacher/penilaian-form";

export const dynamic = "force-dynamic";

export default async function EditClassAssessment({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; back?: string; classId?: string }>;
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

  const search = (await searchParams) ?? {};
  const reqHeaders = await headers();
  const referer = reqHeaders.get("referer") || "";

  const isFromClass =
    search.from === "class" ||
    search.from === "kelas" ||
    Boolean(search.classId) ||
    referer.includes("/teacher/classes");

  const parentHref = isFromClass
    ? `/teacher/classes/${assessment.kelasId}`
    : "/teacher/grades";
  const parentLabel = isFromClass
    ? (t("class") || "Kelas")
    : (t("grades") || "Nilai");

  const [kelas] = await collect(
    db.orm.public.Kelas.where({ id: assessment.kelasId }).all(),
  );
  const mapelList = await collect(db.orm.public.MataPelajaran.all());
  const mapelById = new Map(mapelList.map((m) => [m.id, m]));
  const mapelName = kelas ? mapelById.get(kelas.mataPelajaranId)?.nama ?? "Kelas" : "Kelas";
  const kelasLabel = kelas ? `${mapelName} · ${kelas.jenjang}${kelas.tingkat ? ` (${kelas.tingkat})` : ""}` : "";

  const [pendaftaranRows, anakRows, hasilRows, jadwalRows] = await Promise.all([
    collect(db.orm.public.Pendaftaran.where({ kelasId: assessment.kelasId }).all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.HasilPenilaian.where({ penilaianId: assessment.id }).all()),
    collect(db.orm.public.JadwalItem.where({ kelasId: assessment.kelasId }).all()),
  ]);

  const jadwalIds = jadwalRows.map((j) => j.id);
  const sesiRows = jadwalIds.length
    ? await collect(
        db.orm.public.SesiPertemuan.where((s) => s.jadwalItemId.in(jadwalIds)).all(),
      )
    : [];
  sesiRows.sort((a, b) => a.tanggalPertemuan.localeCompare(b.tanggalPertemuan));
  const sessionOptions = sesiRows.map((s, idx) => ({
    id: s.id,
    label: `Pertemuan #${idx + 1} (${s.tanggalPertemuan} · ${s.jamMulai.slice(0, 5)}-${s.jamSelesai.slice(0, 5)})`,
  }));

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
      {/* Top breadcrumb navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Link
          href={parentHref}
          title={isFromClass ? (kelasLabel || undefined) : undefined}
          className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors font-medium"
        >
          {parentLabel}
        </Link>
        <ChevronRight className="size-3.5 text-slate-400 dark:text-slate-600 shrink-0" aria-hidden="true" />
        <span className="font-semibold text-slate-900 dark:text-slate-100">
          Input
        </span>
      </nav>

      {/* Title & Metadata */}
      <div className="space-y-3">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {assessment.nama}
        </h1>

        {/* Structured Metadata Panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-xs">
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {t("subjectDefault") || "Mata Pelajaran"}
            </span>
            <span className="mt-0.5 block font-semibold text-slate-900 dark:text-slate-100">
              {mapelName}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {t("class") || "Kelas"}
            </span>
            <span className="mt-0.5 block font-semibold text-slate-900 dark:text-slate-100">
              {kelas ? `${kelas.jenjang}${kelas.tingkat ? ` (${kelas.tingkat})` : ""}` : "-"}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {t("assessmentDate") || "Tanggal Penilaian"}
            </span>
            <span className="mt-0.5 block font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {assessment.tanggal}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Nilai Maksimum
            </span>
            <span className="mt-0.5 block font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {assessment.nilaiMaksimum ?? 100}
            </span>
          </div>
        </div>
      </div>

      <PenilaianForm
        kelasId={assessment.kelasId}
        penilaianId={assessment.id}
        initialNama={assessment.nama}
        initialTanggal={assessment.tanggal}
        initialNilaiMaksimum={assessment.nilaiMaksimum}
        initialDraf={assessment.draf}
        diterbitkanPada={assessment.diterbitkanPada}
        initialSesiId={assessment.sesiPertemuanId}
        sessions={sessionOptions}
        siswa={siswa}
      />
    </div>
  );
}
