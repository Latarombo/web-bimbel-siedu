/* Label manusiawi untuk nilai enum DB — UI admin/orang tua tidak boleh menampilkan
 * 'menunggu_pembayaran' mentah. Sumber kebenaran tetap enum di contract.prisma. */

import type { Hari } from "@/lib/hari";

export const LABEL_PENDAFTARAN: Record<string, string> = {
  menunggu_pembayaran: "Menunggu pembayaran",
  terdaftar: "Terdaftar",
  tertunggak: "Tertunggak",
  dibatalkan_timeout: "Batal (lewat 24 jam)",
  dibatalkan_tunggakan: "Batal (tunggakan)",
  dibatalkan_orang_tua: "Batal (permintaan orang tua)",
  dibatalkan_kelas: "Batal (kelas dibatalkan)",
};

export const LABEL_PERIODE: Record<string, string> = {
  dibuka: "Dibuka",
  ditutup: "Ditutup",
  selesai: "Selesai",
};

export const LABEL_KELAS: Record<string, string> = {
  aktif: "Aktif",
  dibatalkan: "Dibatalkan",
};

export const LABEL_METODE: Record<string, string> = {
  lunas: "Lunas",
  dp_cicilan: "DP + cicilan",
};

export const LABEL_PEMBATALAN: Record<string, string> = {
  menunggu: "Menunggu keputusan",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

export const LABEL_KATEGORI_BATAL: Record<string, string> = {
  kesalahan_sistem: "Kesalahan sistem",
  salah_nominal_transfer: "Salah nominal transfer",
  salah_rekening: "Salah rekening",
  salah_pilih_kelas: "Salah pilih kelas",
  lainnya: "Lainnya (DP hangus)",
};

export const LABEL_PRESENSI: Record<string, string> = {
  hadir: "Hadir",
  izin: "Izin",
  sakit: "Sakit",
  alpa: "Alpa",
};

const LABEL_HARI_EN: Record<Hari, string> = {
  Senin: "Monday",
  Selasa: "Tuesday",
  Rabu: "Wednesday",
  Kamis: "Thursday",
  Jumat: "Friday",
  Sabtu: "Saturday",
  Minggu: "Sunday",
};

/** Display only: never replace weekday enum values used for scheduling. */
export function labelHari(v: string, locale: DisplayLocale = "id") {
  return locale === "en" && Object.hasOwn(LABEL_HARI_EN, v)
    ? LABEL_HARI_EN[v as Hari]
    : v;
}

/** Accept next-intl locale strings; only "en" selects English, otherwise ID. */
export type DisplayLocale = string;

const LABEL_MAPS_ID = {
  LABEL_PENDAFTARAN,
  LABEL_PERIODE,
  LABEL_KELAS,
  LABEL_METODE,
  LABEL_PEMBATALAN,
  LABEL_KATEGORI_BATAL,
  LABEL_PRESENSI,
};

const LABEL_MAPS_EN: typeof LABEL_MAPS_ID = {
  LABEL_PENDAFTARAN: {
    menunggu_pembayaran: "Awaiting payment",
    terdaftar: "Enrolled",
    tertunggak: "Overdue",
    dibatalkan_timeout: "Cancelled (24-hour deadline passed)",
    dibatalkan_tunggakan: "Cancelled (overdue payment)",
    dibatalkan_orang_tua: "Cancelled (parent request)",
    dibatalkan_kelas: "Cancelled (class cancelled)",
  },
  LABEL_PERIODE: { dibuka: "Open", ditutup: "Closed", selesai: "Completed" },
  LABEL_KELAS: { aktif: "Active", dibatalkan: "Cancelled" },
  LABEL_METODE: { lunas: "Paid in full", dp_cicilan: "Down payment + installments" },
  LABEL_PEMBATALAN: { menunggu: "Awaiting decision", disetujui: "Approved", ditolak: "Rejected" },
  LABEL_KATEGORI_BATAL: {
    kesalahan_sistem: "System error",
    salah_nominal_transfer: "Incorrect transfer amount",
    salah_rekening: "Incorrect bank account",
    salah_pilih_kelas: "Incorrect class selected",
    lainnya: "Other (down payment forfeited)",
  },
  LABEL_PRESENSI: { hadir: "Present", izin: "Excused", sakit: "Sick", alpa: "Absent without notice" },
};

/** Localized display maps; keys remain DB values, legacy constants stay Indonesian. */
export function getLabelMaps(locale: DisplayLocale = "id") {
  return locale === "en" ? LABEL_MAPS_EN : LABEL_MAPS_ID;
}

const label = (map: Record<string, string>, v: string) =>
  Object.hasOwn(map, v) ? map[v] : v.replaceAll("_", " ");
export const labelPendaftaran = (v: string, locale: DisplayLocale = "id") => label(getLabelMaps(locale).LABEL_PENDAFTARAN, v);
export const labelPresensi = (v: string, locale: DisplayLocale = "id") => label(getLabelMaps(locale).LABEL_PRESENSI, v);
export const labelPeriode = (v: string, locale: DisplayLocale = "id") => label(getLabelMaps(locale).LABEL_PERIODE, v);
export const labelKelas = (v: string, locale: DisplayLocale = "id") => label(getLabelMaps(locale).LABEL_KELAS, v);
export const labelMetode = (v: string, locale: DisplayLocale = "id") => label(getLabelMaps(locale).LABEL_METODE, v);
export const labelPembatalan = (v: string, locale: DisplayLocale = "id") => label(getLabelMaps(locale).LABEL_PEMBATALAN, v);
export const labelKategoriBatal = (v: string, locale: DisplayLocale = "id") => label(getLabelMaps(locale).LABEL_KATEGORI_BATAL, v);
