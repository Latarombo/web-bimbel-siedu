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

  const activeSesi = assessment.sesiPertemuanId
    ? sesiRows.find((s) => s.id === assessment.sesiPertemuanId)
    : sesiRows.find((s) => s.tanggalPertemuan === assessment.tanggal) ?? null;

  const activeSesiIndex = activeSesi
    ? sesiRows.findIndex((s) => s.id === activeSesi.id)
    : -1;

  const sesiLabel = activeSesi
    ? `Pertemuan #${activeSesiIndex + 1}`
    : "-";

  const tanggalPertemuanLabel = activeSesi
    ? activeSesi.tanggalPertemuan
    : "-";

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

      {/* Ringkasan Informasi Tugas (Daftar Vertikal Rata Tanpa Kartu) */}
      <h1 className="sr-only">
        {assessment.nama}
      </h1>
      <div className="text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200">
        <div className="grid grid-cols-[max-content_auto_1fr] items-baseline gap-x-2.5 sm:gap-x-3 gap-y-1.5 sm:gap-y-2">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Nama Tugas
          </span>
          <span className="font-semibold text-slate-400 dark:text-slate-500 select-none" aria-hidden="true">
            :
          </span>
          <span className="font-medium text-slate-950 dark:text-slate-50">
            {assessment.nama}
          </span>

          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Mata Pelajaran
          </span>
          <span className="font-semibold text-slate-400 dark:text-slate-500 select-none" aria-hidden="true">
            :
          </span>
          <span className="font-medium text-slate-950 dark:text-slate-50">
            {mapelName}
          </span>

          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Kelas
          </span>
          <span className="font-semibold text-slate-400 dark:text-slate-500 select-none" aria-hidden="true">
            :
          </span>
          <span className="font-medium text-slate-950 dark:text-slate-50">
            {kelas ? `${kelas.jenjang}${kelas.tingkat ? ` (${kelas.tingkat})` : ""}` : "-"}
          </span>

          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Sesi Pertemuan
          </span>
          <span className="font-semibold text-slate-400 dark:text-slate-500 select-none" aria-hidden="true">
            :
          </span>
          <span className="font-medium text-slate-950 dark:text-slate-50">
            {sesiLabel}
          </span>

          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Tanggal Pertemuan
          </span>
          <span className="font-semibold text-slate-400 dark:text-slate-500 select-none" aria-hidden="true">
            :
          </span>
          <span className="font-medium text-slate-950 dark:text-slate-50 tabular-nums">
            {tanggalPertemuanLabel}
          </span>

          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Tanggal Penilaian
          </span>
          <span className="font-semibold text-slate-400 dark:text-slate-500 select-none" aria-hidden="true">
            :
          </span>
          <span className="font-medium text-slate-950 dark:text-slate-50 tabular-nums">
            {assessment.tanggal}
          </span>

          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Jumlah Siswa
          </span>
          <span className="font-semibold text-slate-400 dark:text-slate-500 select-none" aria-hidden="true">
            :
          </span>
          <span className="font-medium text-slate-950 dark:text-slate-50 tabular-nums">
            {siswa.length}
          </span>
        </div>
      </div>

      <PenilaianForm
        kelasId={assessment.kelasId}
        penilaianId={assessment.id}
        initialNama={assessment.nama}
        initialTanggal={assessment.tanggal}
        initialDraf={assessment.draf}
        diterbitkanPada={assessment.diterbitkanPada}
        initialSesiId={assessment.sesiPertemuanId}
        sessions={sessionOptions}
        siswa={siswa}
      />
    </div>
  );
}
