import { tanggalValid } from "./hari";

export function validateLaporanInput(data: {
  tanggal?: string;
  catatanInternal?: string | null;
  laporanOrtu?: string | null;
  draf?: boolean;
}): string | null {
  if (data.tanggal && !tanggalValid(data.tanggal)) {
    return "Format tanggal tidak valid";
  }
  if (data.draf === false) {
    if (!data.laporanOrtu || !data.laporanOrtu.trim()) {
      return "Laporan untuk orang tua wajib diisi sebelum diterbitkan";
    }
  }
  return null;
}

export function sanitizeLaporanForParent<T extends { catatanInternal?: string | null }>(
  report: T,
): Omit<T, "catatanInternal"> {
  const { catatanInternal: _, ...safeReport } = report;
  void _;
  return safeReport;
}
