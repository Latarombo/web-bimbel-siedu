import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";

export interface RaporStudentSummary {
  pendaftaranId: number;
  anakId: number;
  nama: string;
  tingkat: string | null;
  hadir: number;
  totalSesi: number;
  persenKehadiran: number;
  rataRataNilai: number | null;
  totalTugasDinilai: number;
  catatanRapor: string | null;
  raporDiterbitkanPada: string | null;
  statusRapor: "belum_diisi" | "draf" | "diterbitkan";
}

export interface RaporKelasData {
  kelasId: number;
  namaMapel: string;
  jenjang: string;
  tingkat: string | null;
  namaGuru: string;
  namaPeriode: string;
  students: RaporStudentSummary[];
}

export interface AssessmentReportItem {
  id: number;
  nama: string;
  tanggal: string;
  nilai: number | null;
  nilaiMaksimum: number;
  statusHasil: string;
  catatanSiswa?: string | null;
  catatanTugas?: string | null;
}

export interface RaporDetailData {
  pendaftaranId: number;
  anakId: number;
  namaSiswa: string;
  tanggalLahir: string | null;
  jenjang: string;
  tingkat: string | null;
  namaMapel: string;
  deskripsiMapel: string | null;
  namaGuru: string;
  namaWali: string;
  teleponWali: string | null;
  periodeNama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  totalSesi: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  persenKehadiran: number;
  assessments: AssessmentReportItem[];
  rataRataNilai: number | null;
  catatanRapor: string | null;
  raporDiterbitkanPada: string | null;
  isDiterbitkan: boolean;
}

export async function getRaporKelas(
  classId: number,
  teacherId: number,
): Promise<RaporKelasData | null> {
  const [kelas] = await collect(
    db.orm.public.Kelas.where({ id: classId, guruId: teacherId }).all(),
  );
  if (!kelas) return null;

  const [mapelArr, guruArr, periodeArr, pendaftaranList, semuaAnak, presensiList, penilaianList] =
    await Promise.all([
      collect(db.orm.public.MataPelajaran.where({ id: kelas.mataPelajaranId }).all()),
      collect(db.orm.public.User.where({ id: kelas.guruId }).all()),
      collect(db.orm.public.PeriodePendaftaran.where({ id: kelas.periodeId }).all()),
      collect(
        db.orm.public.Pendaftaran.where({ kelasId: classId })
          .where((p) => p.status.in(["terdaftar", "tertunggak"]))
          .all(),
      ),
      collect(db.orm.public.Anak.all()),
      collect(db.orm.public.Presensi.where({ dicatatOleh: teacherId }).all()),
      collect(db.orm.public.Penilaian.where({ kelasId: classId }).all()),
    ]);

  const mapel = mapelArr[0];
  const guru = guruArr[0];
  const periode = periodeArr[0];

  const anakMap = new Map(semuaAnak.map((a) => [a.id, a]));
  const penilaianIds = penilaianList.map((p) => p.id);
  const hasilList = penilaianIds.length
    ? await collect(
        db.orm.public.HasilPenilaian.where((h) => h.penilaianId.in(penilaianIds)).all(),
      )
    : [];

  const penilaianMap = new Map(penilaianList.map((p) => [p.id, p]));
  const hasilByPendaftaran = new Map<number, typeof hasilList>();
  for (const h of hasilList) {
    const arr = hasilByPendaftaran.get(h.pendaftaranId) ?? [];
    arr.push(h);
    hasilByPendaftaran.set(h.pendaftaranId, arr);
  }

  const presensiByPendaftaran = new Map<number, typeof presensiList>();
  for (const pr of presensiList) {
    const arr = presensiByPendaftaran.get(pr.pendaftaranId) ?? [];
    arr.push(pr);
    presensiByPendaftaran.set(pr.pendaftaranId, arr);
  }

  const students: RaporStudentSummary[] = pendaftaranList.map((p) => {
    const anak = anakMap.get(p.anakId);
    const pPresensi = presensiByPendaftaran.get(p.id) ?? [];
    const totalSesi = pPresensi.length;
    const hadir = pPresensi.filter((pr) => pr.status === "hadir").length;
    const persenKehadiran = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 100;

    const pHasil = hasilByPendaftaran.get(p.id) ?? [];
    const dinilaiList = pHasil.filter(
      (h) => h.statusHasil === "dinilai" && h.nilai != null,
    );
    const normalizedScores = dinilaiList.map((h) => {
      const pn = penilaianMap.get(h.penilaianId);
      const maxScore = pn ? Number(pn.nilaiMaksimum) : 100;
      return maxScore > 0 ? (Number(h.nilai) / maxScore) * 100 : Number(h.nilai);
    });

    const rataRataNilai =
      normalizedScores.length > 0
        ? Math.round(
            normalizedScores.reduce((acc, curr) => acc + curr, 0) /
              normalizedScores.length,
          )
        : null;

    let statusRapor: "belum_diisi" | "draf" | "diterbitkan" = "belum_diisi";
    if (p.raporDiterbitkanPada) {
      statusRapor = "diterbitkan";
    } else if (p.catatanRapor && p.catatanRapor.trim().length > 0) {
      statusRapor = "draf";
    }

    return {
      pendaftaranId: p.id,
      anakId: p.anakId,
      nama: anak?.nama ?? `Siswa #${p.anakId}`,
      tingkat: anak?.tingkat ?? null,
      hadir,
      totalSesi,
      persenKehadiran,
      rataRataNilai,
      totalTugasDinilai: dinilaiList.length,
      catatanRapor: p.catatanRapor ?? null,
      raporDiterbitkanPada: p.raporDiterbitkanPada ?? null,
      statusRapor,
    };
  });

  students.sort((a, b) => a.nama.localeCompare(b.nama));

  return {
    kelasId: kelas.id,
    namaMapel: mapel?.nama ?? `Kelas #${kelas.id}`,
    jenjang: kelas.jenjang,
    tingkat: kelas.tingkat ?? null,
    namaGuru: guru?.name ?? "Pengajar Siedu",
    namaPeriode: periode?.nama ?? "Periode Belajar",
    students,
  };
}

export async function getRaporDetail(
  pendaftaranId: number,
  options: { forTeacherId?: number; forParentId?: number } = {},
): Promise<RaporDetailData | null> {
  const [pendaftaran] = await collect(
    db.orm.public.Pendaftaran.where({ id: pendaftaranId }).all(),
  );
  if (!pendaftaran) return null;

  const [anakArr, kelasArr, periodeArr] = await Promise.all([
    collect(db.orm.public.Anak.where({ id: pendaftaran.anakId }).all()),
    collect(db.orm.public.Kelas.where({ id: pendaftaran.kelasId }).all()),
    collect(db.orm.public.PeriodePendaftaran.where({ id: pendaftaran.periodeId }).all()),
  ]);

  const anak = anakArr[0];
  const kelas = kelasArr[0];
  const periode = periodeArr[0];
  if (!anak || !kelas || !periode) return null;

  if (options.forTeacherId != null && kelas.guruId !== options.forTeacherId) {
    return null;
  }
  if (options.forParentId != null && anak.orangTuaId !== options.forParentId) {
    return null;
  }

  const [mapelArr, guruArr, waliArr, presensiList, penilaianList, hasilList] =
    await Promise.all([
      collect(db.orm.public.MataPelajaran.where({ id: kelas.mataPelajaranId }).all()),
      collect(db.orm.public.User.where({ id: kelas.guruId }).all()),
      collect(db.orm.public.User.where({ id: anak.orangTuaId }).all()),
      collect(db.orm.public.Presensi.where({ pendaftaranId: pendaftaran.id }).all()),
      collect(db.orm.public.Penilaian.where({ kelasId: kelas.id }).all()),
      collect(db.orm.public.HasilPenilaian.where({ pendaftaranId: pendaftaran.id }).all()),
    ]);

  const mapel = mapelArr[0];
  const guru = guruArr[0];
  const wali = waliArr[0];

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

  const penilaianMap = new Map(penilaianList.map((pn) => [pn.id, pn]));
  const assessmentItems: AssessmentReportItem[] = [];
  const validScores: number[] = [];

  for (const hp of hasilList) {
    const pn = penilaianMap.get(hp.penilaianId);
    if (!pn) continue;
    if (options.forParentId != null && pn.draf) continue;

    const nilaiNum = hp.nilai != null ? Number(hp.nilai) : null;
    const maxNum = Number(pn.nilaiMaksimum);

    if (nilaiNum != null) {
      const normalized = maxNum > 0 ? (nilaiNum / maxNum) * 100 : nilaiNum;
      validScores.push(normalized);
    }

    assessmentItems.push({
      id: hp.id,
      nama: pn.nama,
      tanggal: pn.tanggal,
      nilai: nilaiNum,
      nilaiMaksimum: maxNum,
      statusHasil: hp.statusHasil,
      catatanSiswa: hp.catatan,
      catatanTugas: pn.catatan,
    });
  }

  assessmentItems.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  const rataRataNilai =
    validScores.length > 0
      ? Math.round(validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length)
      : null;

  return {
    pendaftaranId: pendaftaran.id,
    anakId: anak.id,
    namaSiswa: anak.nama,
    tanggalLahir: anak.tanggalLahir ?? null,
    jenjang: kelas.jenjang,
    tingkat: kelas.tingkat ?? null,
    namaMapel: mapel?.nama ?? `Kelas #${kelas.id}`,
    deskripsiMapel: mapel?.deskripsi ?? null,
    namaGuru: guru?.name ?? "Pengajar Siedu",
    namaWali: wali?.name ?? "Orang Tua / Wali",
    teleponWali: wali?.nomorTelepon ?? null,
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
    catatanRapor: pendaftaran.catatanRapor ?? null,
    raporDiterbitkanPada: pendaftaran.raporDiterbitkanPada ?? null,
    isDiterbitkan: Boolean(pendaftaran.raporDiterbitkanPada),
  };
}
