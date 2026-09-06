export type KelasCard = {
  id: string;
  mapel: string;
  jenjang: "TK" | "SD" | "SMP" | "SMA";
  hari: string;
  jam: string;
  guru: string;
  kuota: { terisi: number; maksimum: number };
  biayaPeriode: number;
  biayaDp: number | null;
  periode: string;
};

export const KELAS: KelasCard[] = [
  { id: "1", mapel: "Matematika Ceria", jenjang: "SD", hari: "Selasa", jam: "15:00–16:30", guru: "Bu Sinta", kuota: { terisi: 12, maksimum: 20 }, biayaPeriode: 1200000, biayaDp: 300000, periode: "2026/2027 Ganjil" },
  { id: "2", mapel: "Bahasa Inggris Fun", jenjang: "TK", hari: "Rabu", jam: "09:00–10:00", guru: "Miss Rani", kuota: { terisi: 8, maksimum: 15 }, biayaPeriode: 900000, biayaDp: null, periode: "2026/2027 Ganjil" },
  { id: "3", mapel: "Fisika SMP", jenjang: "SMP", hari: "Kamis", jam: "16:00–17:30", guru: "Pak Budi", kuota: { terisi: 18, maksimum: 20 }, biayaPeriode: 1500000, biayaDp: 400000, periode: "2026/2027 Ganjil" },
  { id: "4", mapel: "Kimia SMA", jenjang: "SMA", hari: "Senin", jam: "15:30–17:00", guru: "Bu Lestari", kuota: { terisi: 5, maksimum: 18 }, biayaPeriode: 1800000, biayaDp: 500000, periode: "2026/2027 Ganjil" },
  { id: "5", mapel: "Calistung TK", jenjang: "TK", hari: "Sabtu", jam: "08:00–09:30", guru: "Bu Ayu", kuota: { terisi: 14, maksimum: 16 }, biayaPeriode: 750000, biayaDp: null, periode: "2026/2027 Ganjil" },
  { id: "6", mapel: "Matematika SMA — UTBK", jenjang: "SMA", hari: "Sabtu", jam: "13:00–15:00", guru: "Pak Doni", kuota: { terisi: 10, maksimum: 25 }, biayaPeriode: 2200000, biayaDp: 600000, periode: "2026/2027 Ganjil" },
];

export function rupiah(n: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}
