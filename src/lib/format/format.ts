import type { DisplayLocale } from "@/lib/label";

export function rupiah(n: number, locale: DisplayLocale = "id") {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Tanggal ISO (yyyy-mm-dd atau timestamp) → "13 Sep 2026" (WIB). Untuk tabel admin/orang tua. */
export function fmtTanggal(iso: string, locale: DisplayLocale = "id") {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}
