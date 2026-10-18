import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import type { OfficialCertificateData } from "@/components/common/official-certificate";

interface FetchCertificateOptions {
  backUrl: string;
  forParentId?: number;
  forTeacherId?: number;
}

export async function getOfficialCertificateData(
  pendaftaranId: number,
  options: FetchCertificateOptions
): Promise<OfficialCertificateData | null> {
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

  const [mapelArr, guruArr, presensiList, penilaianList, hasilList, nilaiProgresList] =
    await Promise.all([
      collect(db.orm.public.MataPelajaran.where((m) => m.id.eq(kelas.mataPelajaranId)).all()),
      collect(db.orm.public.User.where((u) => u.id.eq(kelas.guruId)).all()),
      collect(db.orm.public.Presensi.where((pr) => pr.pendaftaranId.eq(pendaftaranId)).all()),
      collect(db.orm.public.Penilaian.where((pn) => pn.kelasId.eq(kelas.id)).all()),
      collect(db.orm.public.HasilPenilaian.where((hp) => hp.pendaftaranId.eq(pendaftaranId)).all()),
      collect(db.orm.public.NilaiProgres.where((np) => np.pendaftaranId.eq(pendaftaranId)).all()),
    ]);

  const mapel = mapelArr[0];
  const guru = guruArr[0];

  // Presensi stats
  const totalSesi = presensiList.length;
  let hadir = 0;
  for (const pr of presensiList) {
    if (pr.status === "hadir") hadir++;
  }
  const persenKehadiran = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 100;

  // Nilai stats
  const penilaianMap = new Map(penilaianList.map((pn) => [pn.id, pn]));
  const validScores: number[] = [];

  for (const hp of hasilList) {
    const pn = penilaianMap.get(hp.penilaianId);
    if (!pn || pn.draf) continue;
    if (hp.nilai != null) {
      const maxNum = Number(pn.nilaiMaksimum);
      const score = Number(hp.nilai);
      validScores.push(maxNum > 0 ? (score / maxNum) * 100 : score);
    }
  }

  for (const np of nilaiProgresList) {
    if (np.nilaiKuantitatif != null) {
      validScores.push(Number(np.nilaiKuantitatif));
    }
  }

  const rataRataNilai =
    validScores.length > 0
      ? Math.round(validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length)
      : null;

  // Predikat
  let predikat = "Baik";
  if (rataRataNilai != null) {
    if (rataRataNilai >= 90) predikat = "Dengan Pujian (Sangat Memuaskan)";
    else if (rataRataNilai >= 80) predikat = "Sangat Memuaskan";
    else if (rataRataNilai >= 70) predikat = "Memuaskan";
    else predikat = "Baik";
  } else if (persenKehadiran >= 90) {
    predikat = "Sangat Baik";
  }

  const tahun = new Date().getFullYear();
  const nomorSertifikat = `CERT/SIEDU/${tahun}/${String(pendaftaran.id).padStart(5, "0")}`;
  const tanggalTerbit = periode.tanggalSelesai || new Date().toISOString().slice(0, 10);

  return {
    pendaftaranId: pendaftaran.id,
    nomorSertifikat,
    namaSiswa: anak.nama,
    namaMapel: mapel?.nama ?? `Kelas #${kelas.id}`,
    jenjang: kelas.jenjang,
    tingkat: kelas.tingkat,
    periodeNama: periode.nama,
    tanggalTerbit,
    persenKehadiran,
    rataRataNilai,
    predikat,
    namaGuru: guru?.name ?? "Pengajar Siedu",
    backUrl: options.backUrl,
  };
}
