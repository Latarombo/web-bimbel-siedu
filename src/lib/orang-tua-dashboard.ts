/*
 * Rakitan data dashboard orang tua (/home).
 *
 * Enam query, bukan N-per-kartu-anak: semua baris diambil per-orang-tua lalu
 * digabung di JS. Skala lembaga (ratusan siswa) aman; pola sama dengan
 * lib/kelas.ts dan (parent)/payments.
 *
 * Sumber angka: Pendaftaran (tenor/metode), Pembayaran (tipe/jumlah/status/
 * jatuhTempo), Presensi (status/catatan/tanggal), NilaiProgres (kuantitatif +
 * kualitatif), Kelas+JadwalItem (hari & jam), User (nama guru). Nol angka ketokan.
 */
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { hariDariTanggal, type Hari } from "@/lib/hari";

export const STATUS_AKTIF_DB = ["menunggu_pembayaran", "terdaftar", "tertunggak"] as const;

const URUTAN_HARI: Hari[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export type KartuTagihan = {
  /** Jumlah yang masih harus dibayar (pending + gagal). */
  belumDibayar: number;
  /** Sudah dibayar pada periode berjalan. */
  sudahDibayar: number;
  /** Tagihan berikutnya: pending terdekat, atau 'gagal' kalau ada retry. */
  berikutnya: {
    pembayaranId: number;
    label: string;
    jumlah: number;
    jatuhTempo: string | null;
    status: "pending" | "gagal";
    /** <0 = lewat jatuh tempo. */
    sisaHari: number | null;
  } | null;
  /** Hanya berarti untuk metode dp_cicilan. */
  tenor: { lunas: number; total: number } | null;
  metode: "lunas" | "dp_cicilan";
};

export type AnakDashboard = {
  id: number;
  nama: string;
  jenjang: string | null;
  /** Status Pendaftaran aktif terakhir (enum DB) — untuk badge. */
  status: string;
  /** true kalau pendaftaran aktif terakhir masih berstatus menunggu_pembayaran. */
  menungguPembayaran: boolean;
  tertunggak: boolean;
  /** Label kelas aktif: mapel + guru. */
  kelas: { mapel: string; guru: string } | null;
  tagihan: KartuTagihan | null;
  jadwal: {
    hari: string;
    mulai: string;
    selesai: string;
    mapel: string;
    guru: string;
    /** Tanggal pertemuan berikutnya, null kalau hari jadwal belum terpetakan. */
    tanggalBerikutnya: string | null;
  }[];
  presensi: { total: number; hadir: number; izin: number; sakit: number; alpa: number };
  persenHadir: number | null;
  pertemuanTerakhir: { tanggal: string; status: string; catatan: string | null } | null;
  nilai: { tanggal: string; nilai: number }[];
  catatanTerakhir: { teks: string; guru: string; tanggal: string } | null;
  pendaftaranId: number | null;
  kelasId: number | null;
};

function hariSebagai(tglIso: string) {
  const t = new Date(tglIso);
  return Math.round((t.getTime() - Date.now()) / 86_400_000);
}

function tanggalHariBerikut(target: Hari, dari = new Date()): string {
  const dariStr = dari.toISOString().slice(0, 10);
  const indexIni = URUTAN_HARI.indexOf(hariDariTanggal(dariStr));
  const selisih = (URUTAN_HARI.indexOf(target) - indexIni + 7) % 7;
  const d = new Date(`${dariStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + selisih);
  return d.toISOString().slice(0, 10);
}

export async function dashboardOrangTua(ortuId: number): Promise<AnakDashboard[]> {
  const [anak, pendaftaran] = await Promise.all([
    collect(db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all()),
    collect(
      db.orm.public.Pendaftaran.include("kelas", (b) =>
        b.select("id", "mataPelajaranId", "guruId", "jenjang"),
      ).all(),
    ),
  ]);
  if (anak.length === 0) return [];

  const anakIds = new Set(anak.map((a) => a.id));
  const milikSaya = pendaftaran
    .filter((p) => anakIds.has(p.anakId))
    .sort((x, y) => x.createdAt.localeCompare(y.createdAt));
  const pidSaya = milikSaya.map((p) => p.id);

  // ORM rc.8 di repo ini belum terbukti mendukung `.inArray`, dan pola yang sudah
  // jalan di halaman ini/lain adalah "ambil tabel kecil, saring di JS"
  // (lihat Pendaftaran.all() di atas & lib/kelas.ts). Skala lembaga aman.
  const [pembayaran, presensi, nilai, mapelRows, guruRows, jadwalRows] = await Promise.all([
    collect(db.orm.public.Pembayaran.all()),
    collect(db.orm.public.Presensi.all()),
    collect(db.orm.public.NilaiProgres.all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.where((u) => u.role.eq("guru")).all()),
    collect(db.orm.public.JadwalItem.all()),
  ]);
  const pidSet = new Set(pidSaya);
  const kelasIdSet = new Set(milikSaya.map((p) => p.kelasId));
  const tagihanSemua = pembayaran.filter((b) => pidSet.has(b.pendaftaranId));
  const presensiSemua = presensi.filter((s) => pidSet.has(s.pendaftaranId));
  const nilaiSemua = nilai.filter((n) => pidSet.has(n.pendaftaranId));
  const jadwalSemua = jadwalRows.filter((j) => kelasIdSet.has(j.kelasId));

  const mapel = new Map(mapelRows.map((m) => [m.id, m.nama]));
  const guru = new Map(guruRows.map((g) => [g.id, g.name]));
  const byPendaftaran = <T extends { pendaftaranId: number }>(rows: T[]) => {
    const out = new Map<number, T[]>();
    for (const r of rows) {
      const list = out.get(r.pendaftaranId);
      if (list) list.push(r);
      else out.set(r.pendaftaranId, [r]);
    }
    return out;
  };
  const tagihanByP = byPendaftaran(tagihanSemua);
  const presensiByP = byPendaftaran(presensiSemua);
  const nilaiByP = byPendaftaran(nilaiSemua);
  const jadwalByKelas = new Map<number, typeof jadwalSemua>();
  for (const j of jadwalSemua) {
    const list = jadwalByKelas.get(j.kelasId);
    if (list) list.push(j);
    else jadwalByKelas.set(j.kelasId, [j]);
  }

  // Gabungkan ke per-anak: pendaftaran aktif terakhir yang pegang kendali kartu.
  const out: AnakDashboard[] = [];
  for (const a of anak) {
    const punyanya = milikSaya.filter((p) => p.anakId === a.id);
    if (punyanya.length === 0) {
      // Anak sudah dibuat tapi belum memilih kelas — tetap muncul di switcher
      // supaya orang tua tidak mengira datanya hilang.
      out.push({
        id: a.id,
        nama: a.nama,
        jenjang: a.jenjangTerakhir ?? null,
        status: "",
        menungguPembayaran: false,
        tertunggak: false,
        kelas: null,
        tagihan: null,
        jadwal: [],
        presensi: { total: 0, hadir: 0, izin: 0, sakit: 0, alpa: 0 },
        persenHadir: null,
        pertemuanTerakhir: null,
        nilai: [],
        catatanTerakhir: null,
        pendaftaranId: null,
        kelasId: null,
      });
      continue;
    }
    const aktif = punyanya.filter((p) =>
      (STATUS_AKTIF_DB as readonly string[]).includes(p.status),
    );
    const p = aktif[aktif.length - 1] ?? punyanya[punyanya.length - 1];

    // --- Tagihan
    const bills = tagihanByP.get(p.id) ?? [];
    const belum = bills.filter((b) => b.status === "pending" || b.status === "gagal");
    const lunas = bills.filter((b) => b.status === "berhasil");
    const cicilanLunas = lunas.filter((b) => b.tipe === "cicilan").length;
    const next = [...belum].sort(
      (x, y) => (x.jatuhTempo ?? "9999").localeCompare(y.jatuhTempo ?? "9999"),
    )[0];
    const tagihan: KartuTagihan = {
      belumDibayar: belum.reduce((s, b) => s + Number(b.jumlah), 0),
      sudahDibayar: lunas.reduce((s, b) => s + Number(b.jumlah), 0),
      metode: p.metodeBayar,
      tenor:
        p.metodeBayar === "dp_cicilan" && p.tenorBulan
          ? { lunas: cicilanLunas, total: p.tenorBulan }
          : null,
      berikutnya: next
        ? {
            pembayaranId: next.id,
            label:
              next.tipe === "cicilan"
                ? `Cicilan ke-${next.cicilanKe}`
                : next.tipe === "dp"
                  ? "Uang muka (DP)"
                  : "Pembayaran lunas",
            jumlah: Number(next.jumlah),
            jatuhTempo: next.jatuhTempo,
            status: next.status === "gagal" ? "gagal" : "pending",
            sisaHari: next.jatuhTempo ? hariSebagai(next.jatuhTempo) : null,
          }
        : null,
    };

    // --- Jadwal minggu ini (hari enum + tanggal pertemuan berikutnya)
    const jadwal = (jadwalByKelas.get(p.kelasId) ?? [])
      .slice()
      .sort(
        (x, y) =>
          URUTAN_HARI.indexOf(x.hari) - URUTAN_HARI.indexOf(y.hari) ||
          x.jamMulai.localeCompare(y.jamMulai),
      )
      .map((j) => ({
        hari: j.hari,
        mulai: j.jamMulai.slice(0, 5),
        selesai: j.jamSelesai.slice(0, 5),
        mapel: mapel.get(p.kelas.mataPelajaranId) ?? `Kelas #${p.kelasId}`,
        guru: guru.get(p.kelas.guruId) ?? "-",
        tanggalBerikutnya: tanggalHariBerikut(j.hari),
      }));

    // --- Presensi
    const pres = (presensiByP.get(p.id) ?? [])
      .slice()
      .sort((x, y) => y.tanggalPertemuan.localeCompare(x.tanggalPertemuan));
    const hitung = (s: string) => pres.filter((x) => x.status === s).length;
    const presensi = {
      total: pres.length,
      hadir: hitung("hadir"),
      izin: hitung("izin"),
      sakit: hitung("sakit"),
      alpa: hitung("alpa"),
    };
    const pertemuanTerakhir = pres[0]
      ? {
          tanggal: pres[0].tanggalPertemuan,
          status: pres[0].status,
          catatan: pres[0].catatan ?? null,
        }
      : null;

    // --- Nilai + catatan guru terakhir
    const nilaiRows = (nilaiByP.get(p.id) ?? [])
      .slice()
      .sort((x, y) => x.tanggal.localeCompare(y.tanggal));
    const nilai = nilaiRows
      .filter((n) => n.nilaiKuantitatif != null)
      .map((n) => ({ tanggal: n.tanggal, nilai: Number(n.nilaiKuantitatif) }));
    const kualitatif = nilaiRows.filter((n) => n.catatanKualitatif);
    const terakhirKual = kualitatif[kualitatif.length - 1];
    const catatanGuru = terakhirKual
      ? {
          teks: terakhirKual.catatanKualitatif as string,
          guru: guru.get(p.kelas.guruId) ?? "Guru",
          tanggal: terakhirKual.tanggal,
        }
      : pres.find((x) => x.catatan)
        ? {
            teks: pres.find((x) => x.catatan)!.catatan as string,
            guru: guru.get(p.kelas.guruId) ?? "Guru",
            tanggal: pres.find((x) => x.catatan)!.tanggalPertemuan,
          }
        : null;

    out.push({
      id: a.id,
      nama: a.nama,
      jenjang: p.jenjangSaatDaftar ?? a.jenjangTerakhir ?? null,
      status: p.status,
      menungguPembayaran: p.status === "menunggu_pembayaran",
      tertunggak: p.status === "tertunggak",
      kelas: {
        mapel: mapel.get(p.kelas.mataPelajaranId) ?? `Kelas #${p.kelasId}`,
        guru: guru.get(p.kelas.guruId) ?? "-",
      },
      tagihan,
      jadwal,
      presensi,
      persenHadir: pres.length ? Math.round((presensi.hadir / pres.length) * 100) : null,
      pertemuanTerakhir,
      nilai,
      catatanTerakhir: catatanGuru,
      pendaftaranId: p.id,
      kelasId: p.kelasId,
    });
  }

  // Anak paling butuh perhatian duluan: tertunggak > menunggu bayar > sisanya.
  return out.sort((x, y) => bobot(x) - bobot(y));
}

function bobot(a: AnakDashboard) {
  if (a.tertunggak) return 0;
  if ((a.tagihan?.belumDibayar ?? 0) > 0) return a.menungguPembayaran ? 1 : 2;
  return 3;
}
