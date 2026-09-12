import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";

export type JenjangKatalog = "TK" | "SD" | "SMP" | "SMA";

/** Bentuk kelas untuk kartu katalog (public + landing). Sudah Number() di edge. */
export type KelasKatalog = {
  id: number;
  mapel: string;
  jenjang: JenjangKatalog;
  jadwal: string; // "Selasa 15:00–16:30, Kamis 15:00–16:30"
  guru: string;
  kuota: { terisi: number; maksimum: number };
  biayaPeriode: number;
  biayaDp: number | null;
  periode: string;
};

type RowKelas = Awaited<ReturnType<typeof kelasAktifPublik>>[number];

function jamPendek(t: string) {
  return t.slice(0, 5);
}

/** Map row DB (Decimal masih string) → bentuk kartu. */
export function toKelasKatalog(k: RowKelas): KelasKatalog {
  return {
    id: k.id,
    mapel: k.mataPelajaran.nama,
    jenjang: k.jenjang as JenjangKatalog,
    jadwal: (k.jadwalItem ?? [])
      .map((j) => `${j.hari} ${jamPendek(j.jamMulai)}–${jamPendek(j.jamSelesai)}`)
      .join(", ") || "Jadwal menyusul",
    guru: k.guru.name,
    kuota: { terisi: k.kuotaTerisi, maksimum: k.kuotaMaksimum },
    biayaPeriode: Number(k.biayaPeriode),
    biayaDp: k.biayaDp == null ? null : Number(k.biayaDp),
    periode: k.periode.nama,
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
      .include("mataPelajaran", (b) => b.select("id", "nama"))
      .include("guru", (b) => b.select("id", "name"))
      .include("periode", (b) => b.select("id", "nama"))
      .include("jadwalItem", (b) => b.select("id", "hari", "jamMulai", "jamSelesai").orderBy((j) => j.hari.asc()))
      .all(),
  );
}
