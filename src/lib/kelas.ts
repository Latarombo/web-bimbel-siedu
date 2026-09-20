import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { labelHari, type DisplayLocale } from "@/lib/label";

export type JenjangKatalog = "TK" | "SD" | "SMP" | "SMA";

/** Bentuk kelas untuk kartu katalog (public + landing). Sudah Number() di edge. */
export type KelasKatalog = {
  id: number;
  mapel: string;
  jenjang: JenjangKatalog;
  tingkat: string | null;
  jadwal: string; // "Selasa 15:00–16:30, Kamis 15:00–16:30"
  guru: string;
  kuota: { terisi: number; maksimum: number };
  biayaPeriode: number;
  biayaDp: number | null;
  tenorMaksimum: number | null;
  kuotaMinimum: number;
  periode: string;
  mapelDeskripsi: string | null;
};

type RowKelas = Awaited<ReturnType<typeof kelasAktifPublik>>[number];

function jamPendek(t: string) {
  return t.slice(0, 5);
}

/** Map row DB (Decimal masih string) → bentuk kartu. */
export function toKelasKatalog(k: RowKelas, locale: DisplayLocale = "id"): KelasKatalog {
  return {
    id: k.id,
    mapel: k.mataPelajaran.nama,
    jenjang: k.jenjang as JenjangKatalog,
    tingkat: (k as unknown as { tingkat?: string | null }).tingkat ?? null,
    jadwal: (k.jadwalItem ?? [])
      .map((j) => `${labelHari(j.hari, locale)} ${jamPendek(j.jamMulai)}–${jamPendek(j.jamSelesai)}`)
      .join(", ") || (locale === "en" ? "Schedule to follow" : "Jadwal menyusul"),
    guru: k.guru.name,
    kuota: { terisi: k.kuotaTerisi, maksimum: k.kuotaMaksimum },
    biayaPeriode: Number(k.biayaPeriode),
    biayaDp: k.biayaDp == null ? null : Number(k.biayaDp),
    tenorMaksimum: k.tenorMaksimum,
    kuotaMinimum: k.kuotaMinimum,
    periode: k.periode.nama,
    mapelDeskripsi: k.mataPelajaran.deskripsi,
  };
}

/**
 * Semua kelas aktif (status aktif + kuota belum penuh) untuk katalog publik.
 * ponytail: belum filter "periode aktif" (PRD UC3.1) — enum status periode
 * belum stabil; tambahkan .where periode saat fitur periode ditutup diuji.
 */
export async function kelasAktifPublik() {
  return collect(
    db.orm.public.Kelas
      .where((k) => k.status.eq("aktif"))
      .include("mataPelajaran", (b) => b.select("id", "nama", "deskripsi"))
      .include("guru", (b) => b.select("id", "name"))
      .include("periode", (b) => b.select("id", "nama"))
      .include("jadwalItem", (b) => b.select("id", "hari", "jamMulai", "jamSelesai").orderBy((j) => j.hari.asc()))
      .all(),
  );
}

/** Bentuk satu pengajar untuk section "Kenali pengajarnya" (landing). */
export type GuruKatalog = {
  id: number;
  nama: string;
  /** Mapel yang diampu, sudah unik & terurut (mis. ["Matematika", "Fisika"]). */
  mapel: string[];
  /** Jenjang yang diampu, urutan TK/SD/SMP/SMA. */
  jenjang: JenjangKatalog[];
  jumlahKelas: number;
  /** Total siswa terdaftar di kelasnya (penjumlahan kuotaTerisi). */
  jumlahSiswa: number;
};

const URUT_JENJANG: JenjangKatalog[] = ["TK", "SD", "SMP", "SMA"];

/**
 * Agregasi pengajar dari baris kelas aktif (kelasAktifPublik) — tanpa query
 * tambahan. Hanya guru yang benar-benar mengajar kelas aktif yang muncul,
 * jadi semua angkanya jujur dari DB.
 */
export function guruDariKelasAktif(rows: Awaited<ReturnType<typeof kelasAktifPublik>>): GuruKatalog[] {
  const byGuru = new Map<number, GuruKatalog & { jenjangSet: Set<JenjangKatalog>; mapelSet: Set<string> }>();
  for (const k of rows) {
    let g = byGuru.get(k.guru.id);
    if (!g) {
      g = {
        id: k.guru.id,
        nama: k.guru.name,
        mapel: [],
        jenjang: [],
        jumlahKelas: 0,
        jumlahSiswa: 0,
        jenjangSet: new Set(),
        mapelSet: new Set(),
      };
      byGuru.set(k.guru.id, g);
    }
    g.jumlahKelas += 1;
    g.jumlahSiswa += k.kuotaTerisi;
    g.mapelSet.add(k.mataPelajaran.nama);
    g.jenjangSet.add(k.jenjang as JenjangKatalog);
  }
  return [...byGuru.values()]
    .map(({ jenjangSet, mapelSet, ...g }) => ({
      ...g,
      mapel: [...mapelSet].sort(),
      jenjang: URUT_JENJANG.filter((j) => jenjangSet.has(j)),
    }))
    .sort((a, b) => b.jumlahKelas - a.jumlahKelas || a.nama.localeCompare(b.nama));
}
