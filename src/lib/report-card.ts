import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import type { OfficialReportCardData, AssessmentItem, QualitativeReportItem } from "@/components/common/official-report-card";

interface FetchReportOptions {
  backUrl: string;
  forParentId?: number;
  forTeacherId?: number;
}

export async function getOfficialReportCardData(
  pendaftaranId: number,
  options: FetchReportOptions
): Promise<OfficialReportCardData | null> {
  const [pendaftaran] = await collect(
    db.orm.public.Pendaftaran.where((p) => p.id.eq(pendaftaranId)).all()
  );
  if (!pendaftaran) return null;

  const [anakArr, kelasArr, periodeArr] = await Promise.all([
    collect(db.orm.public.Anak.where((a) => a.id.eq(pendaftaran.anakId)).all()),
    collect(db.orm.public.Kelas.where((k) => k.id.eq(pendaftaran.kelasId)).all()),
    collect(db.orm.public.PeriodePendaftaran.where((per) => per.id.eq(pendaftaran.periodeId)).all()),
  ]);

  const anak = anakArr[0];
  const kelas = kelasArr[0];
  const periode = periodeArr[0];

  if (!anak || !kelas || !periode) return null;

  // Authorization checks
  if (options.forParentId != null && anak.orangTuaId !== options.forParentId) {
    return null;
  }
  if (options.forTeacherId != null && kelas.guruId !== options.forTeacherId) {
    return null;
  }

  const [mapelArr, guruArr, presensiList, penilaianList, hasilList, nilaiProgresList, laporanList] =
    await Promise.all([
      collect(db.orm.public.MataPelajaran.where((m) => m.id.eq(kelas.mataPelajaranId)).all()),
      collect(db.orm.public.User.where((u) => u.id.eq(kelas.guruId)).all()),
      collect(db.orm.public.Presensi.where((pr) => pr.pendaftaranId.eq(pendaftaranId)).all()),
      collect(db.orm.public.Penilaian.where((pn) => pn.kelasId.eq(kelas.id)).all()),
      collect(db.orm.public.HasilPenilaian.where((hp) => hp.pendaftaranId.eq(pendaftaranId)).all()),
      collect(db.orm.public.NilaiProgres.where((np) => np.pendaftaranId.eq(pendaftaranId)).all()),
      collect(
        db.orm.public.LaporanPerkembangan.where((lp) => lp.pendaftaranId.eq(pendaftaranId))
          .orderBy((lp) => lp.tanggal.desc())
          .all()
      ),
    ]);

  const mapel = mapelArr[0];
  const guru = guruArr[0];

  // Presensi statistics
  const totalSesi = presensiList.length;
  let hadir = 0;
  let izin = 0;
  let sakit = 0;
  let alpa = 0;

  for (const pr of presensiList) {
    if (pr.status === "hadir") hadir++;
    else if (pr.status === "izin") izin++;
    else if (pr.status === "sakit") sakit++;
    else if (pr.status === "alpa") alpa++;
  }

  const persenKehadiran = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 100;

  // Assessments mapping
  const penilaianMap = new Map(penilaianList.map((pn) => [pn.id, pn]));
  const assessmentItems: AssessmentItem[] = [];
  const validScores: number[] = [];

  // 1. From HasilPenilaian
  for (const hp of hasilList) {
    const pn = penilaianMap.get(hp.penilaianId);
    if (!pn) continue;
    // Jika untuk orang tua, sembunyikan jika draf masih true
    if (options.forParentId != null && pn.draf) continue;

    const nilaiNum = hp.nilai != null ? Number(hp.nilai) : null;
    const maxNum = Number(pn.nilaiMaksimum);

    if (nilaiNum != null) {
      // Normalisasi nilai ke basis 100 jika maxNum != 100 untuk kalkulasi rata-rata
      const normalizedScore = maxNum > 0 ? (nilaiNum / maxNum) * 100 : nilaiNum;
      validScores.push(normalizedScore);
    }

    assessmentItems.push({
      id: hp.id,
      nama: pn.nama,
      tanggal: pn.tanggal,
      nilai: nilaiNum,
      nilaiMaksimum: maxNum,
      statusHasil: hp.statusHasil,
      catatan: hp.catatan,
    });
  }

  // 2. From NilaiProgres (if any)
  for (const np of nilaiProgresList) {
    const nilaiNum = np.nilaiKuantitatif != null ? Number(np.nilaiKuantitatif) : null;
    if (nilaiNum != null) {
      validScores.push(nilaiNum);
    }
    assessmentItems.push({
      id: 100000 + np.id,
      nama: `Evaluasi Progres (${np.tanggal})`,
      tanggal: np.tanggal,
      nilai: nilaiNum,
      nilaiMaksimum: 100,
      statusHasil: nilaiNum != null ? "dinilai" : "belum_dinilai",
      catatan: np.catatanKualitatif,
    });
  }

  // Sort assessments by date
  assessmentItems.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const rataRataNilai =
    validScores.length > 0
      ? Math.round(validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length)
      : null;

  // Qualitative Reports
  // Filter out drafts if requested by parent
  const filteredLaporan = options.forParentId != null
    ? laporanList.filter((lp) => !lp.draf && lp.laporanOrtu && lp.laporanOrtu.trim().length > 0)
    : laporanList.filter((lp) => lp.laporanOrtu && lp.laporanOrtu.trim().length > 0);

  const qualitativeItems: QualitativeReportItem[] = filteredLaporan.map((lp) => ({
    id: lp.id,
    tanggal: lp.tanggal,
    judul: lp.judul,
    laporanOrtu: lp.laporanOrtu ?? "",
  }));

  return {
    pendaftaranId: pendaftaran.id,
    namaSiswa: anak.nama,
    jenjang: kelas.jenjang,
    tingkat: kelas.tingkat,
    namaMapel: mapel?.nama ?? `Kelas #${kelas.id}`,
    deskripsiMapel: mapel?.deskripsi ?? null,
    namaGuru: guru?.name ?? "Pengajar Siedu",
    periodeNama: periode.nama,
    tanggalMulai: periode.tanggalMulai,
    tanggalSelesai: periode.tanggalSelesai,
    totalSesi,
    hadir,
    izin,
    sakit,
    alpa,
    persenKehadiran,
    assessments: assessmentItems,
    rataRataNilai,
    laporanPerkembangan: qualitativeItems,
    backUrl: options.backUrl,
  };
}
