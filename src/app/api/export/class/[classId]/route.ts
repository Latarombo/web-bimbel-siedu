import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";

function escapeCsv(val: unknown): string {
  if (val == null) return '""';
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { classId } = await params;
  const kid = Number(classId);
  if (!Number.isInteger(kid)) {
    return new Response("Invalid Class ID", { status: 400 });
  }

  const [kelas] = await collect(
    db.orm.public.Kelas.where((k) => k.id.eq(kid)).all()
  );
  if (!kelas) {
    return new Response("Class not found", { status: 404 });
  }

  const userId = Number(session.user.id);
  const userRole = (session.user as any).role;
  if (userRole !== "admin" && kelas.guruId !== userId) {
    return new Response("Forbidden", { status: 403 });
  }

  const url = new URL(req.url);
  const exportType = url.searchParams.get("type") || "summary"; // 'summary' | 'attendance' | 'grades'

  const [mapelArr, periodeArr, pendaftaranList, semuaAnak] = await Promise.all([
    collect(db.orm.public.MataPelajaran.where((m) => m.id.eq(kelas.mataPelajaranId)).all()),
    collect(db.orm.public.PeriodePendaftaran.where((p) => p.id.eq(kelas.periodeId)).all()),
    collect(
      db.orm.public.Pendaftaran.where((p) => p.kelasId.eq(kid))
        .where((p) => p.status.in(["terdaftar", "tertunggak"]))
        .all()
    ),
    collect(db.orm.public.Anak.all()),
  ]);

  const mapel = mapelArr[0];
  const periode = periodeArr[0];
  const anakMap = new Map(semuaAnak.map((a) => [a.id, a]));
  const pendaftaranIds = pendaftaranList.map((p) => p.id);

  const csvRows: string[][] = [];
  const timestamp = new Date().toISOString().slice(0, 10);
  const fileName = `rekap-kelas-${kid}-${exportType}-${timestamp}.csv`;

  if (exportType === "attendance") {
    const presensiList = pendaftaranIds.length > 0
      ? await collect(
          db.orm.public.Presensi.where((pr) => pr.pendaftaranId.in(pendaftaranIds)).all()
        )
      : [];

    csvRows.push([
      "No",
      "ID Pendaftaran",
      "Nama Siswa",
      "Tanggal Pertemuan",
      "Status Presensi",
      "Terlambat",
      "Catatan",
    ]);

    presensiList.sort((a, b) => a.tanggalPertemuan.localeCompare(b.tanggalPertemuan));

    let no = 1;
    for (const pr of presensiList) {
      const p = pendaftaranList.find((item) => item.id === pr.pendaftaranId);
      const anak = p ? anakMap.get(p.anakId) : null;
      csvRows.push([
        String(no++),
        String(pr.pendaftaranId),
        anak?.nama ?? `Siswa #${p?.anakId ?? ""}`,
        pr.tanggalPertemuan,
        pr.status.toUpperCase(),
        pr.terlambat ? "Ya" : "Tidak",
        pr.catatan ?? "",
      ]);
    }
  } else if (exportType === "grades") {
    const [penilaianList, hasilList, nilaiProgresList] = await Promise.all([
      collect(db.orm.public.Penilaian.where((pn) => pn.kelasId.eq(kid)).all()),
      pendaftaranIds.length > 0
        ? collect(db.orm.public.HasilPenilaian.where((h) => h.pendaftaranId.in(pendaftaranIds)).all())
        : [],
      pendaftaranIds.length > 0
        ? collect(db.orm.public.NilaiProgres.where((np) => np.pendaftaranId.in(pendaftaranIds)).all())
        : [],
    ]);

    const penilaianMap = new Map(penilaianList.map((pn) => [pn.id, pn]));

    csvRows.push([
      "No",
      "ID Pendaftaran",
      "Nama Siswa",
      "Nama Penilaian",
      "Tanggal",
      "Nilai",
      "Nilai Maksimum",
      "Status Penilaian",
      "Catatan",
    ]);

    let no = 1;
    for (const hp of hasilList) {
      const p = pendaftaranList.find((item) => item.id === hp.pendaftaranId);
      const anak = p ? anakMap.get(p.anakId) : null;
      const pn = penilaianMap.get(hp.penilaianId);
      csvRows.push([
        String(no++),
        String(hp.pendaftaranId),
        anak?.nama ?? `Siswa #${p?.anakId ?? ""}`,
        pn?.nama ?? "Penilaian",
        pn?.tanggal ?? "",
        hp.nilai != null ? String(hp.nilai) : "",
        pn ? String(pn.nilaiMaksimum) : "100",
        hp.statusHasil,
        hp.catatan ?? "",
      ]);
    }

    for (const np of nilaiProgresList) {
      const p = pendaftaranList.find((item) => item.id === np.pendaftaranId);
      const anak = p ? anakMap.get(p.anakId) : null;
      csvRows.push([
        String(no++),
        String(np.pendaftaranId),
        anak?.nama ?? `Siswa #${p?.anakId ?? ""}`,
        "Evaluasi Mingguan / Progres",
        np.tanggal,
        np.nilaiKuantitatif != null ? String(np.nilaiKuantitatif) : "",
        "100",
        np.nilaiKuantitatif != null ? "dinilai" : "belum_dinilai",
        np.catatanKualitatif ?? "",
      ]);
    }
  } else {
    // Summary
    const [presensiList, hasilList, nilaiProgresList, penilaianList] = await Promise.all([
      pendaftaranIds.length > 0
        ? collect(db.orm.public.Presensi.where((pr) => pr.pendaftaranId.in(pendaftaranIds)).all())
        : [],
      pendaftaranIds.length > 0
        ? collect(db.orm.public.HasilPenilaian.where((h) => h.pendaftaranId.in(pendaftaranIds)).all())
        : [],
      pendaftaranIds.length > 0
        ? collect(db.orm.public.NilaiProgres.where((np) => np.pendaftaranId.in(pendaftaranIds)).all())
        : [],
      collect(db.orm.public.Penilaian.where((pn) => pn.kelasId.eq(kid)).all()),
    ]);

    const penilaianMap = new Map(penilaianList.map((pn) => [pn.id, pn]));

    csvRows.push([
      "No",
      "ID Pendaftaran",
      "Nama Siswa",
      "Jenjang",
      "Tingkat",
      "Mata Pelajaran",
      "Periode",
      "Total Sesi Presensi",
      "Hadir",
      "Izin",
      "Sakit",
      "Alpa",
      "Kehadiran (%)",
      "Rata-Rata Nilai",
      "Status Siswa",
    ]);

    let no = 1;
    for (const p of pendaftaranList) {
      const anak = anakMap.get(p.anakId);
      const prs = presensiList.filter((pr) => pr.pendaftaranId === p.id);
      const totalSesi = prs.length;
      const hadir = prs.filter((pr) => pr.status === "hadir").length;
      const izin = prs.filter((pr) => pr.status === "izin").length;
      const sakit = prs.filter((pr) => pr.status === "sakit").length;
      const alpa = prs.filter((pr) => pr.status === "alpa").length;
      const persen = totalSesi > 0 ? Math.round((hadir / totalSesi) * 100) : 100;

      const hps = hasilList.filter((h) => h.pendaftaranId === p.id && h.nilai != null);
      const nps = nilaiProgresList.filter((np) => np.pendaftaranId === p.id && np.nilaiKuantitatif != null);

      const scores: number[] = [];
      for (const h of hps) {
        const pn = penilaianMap.get(h.penilaianId);
        const max = pn ? Number(pn.nilaiMaksimum) : 100;
        const score = Number(h.nilai);
        scores.push(max > 0 ? (score / max) * 100 : score);
      }
      for (const np of nps) {
        scores.push(Number(np.nilaiKuantitatif));
      }

      const rataRata = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : "";

      csvRows.push([
        String(no++),
        String(p.id),
        anak?.nama ?? `Siswa #${p.anakId}`,
        kelas.jenjang,
        kelas.tingkat ?? "",
        mapel?.nama ?? `Kelas #${kelas.id}`,
        periode?.nama ?? "",
        String(totalSesi),
        String(hadir),
        String(izin),
        String(sakit),
        String(alpa),
        String(persen),
        rataRata !== "" ? String(rataRata) : "",
        p.status,
      ]);
    }
  }

  // Prepend UTF-8 BOM so Excel opens the CSV directly with correct unicode rendering
  const BOM = "\uFEFF";
  const csvContent = BOM + csvRows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
