/**
 * Fungsi konversi angka menjadi kata-kata bahasa Indonesia (Terbilang).
 * Berguna untuk kwitansi, invoice, dan dokumen resmi keuangan.
 */
export function terbilang(n: number): string {
  const bilangan = [
    "",
    "Satu",
    "Dua",
    "Tiga",
    "Empat",
    "Lima",
    "Enam",
    "Tujuh",
    "Delapan",
    "Sembilan",
    "Sepuluh",
    "Sebelas",
  ];

  const num = Math.floor(Math.abs(n));

  if (num < 12) {
    return bilangan[num];
  } else if (num < 20) {
    return `${terbilang(num - 10)} Belas`;
  } else if (num < 100) {
    const sisa = num % 10;
    return `${terbilang(Math.floor(num / 10))} Puluh${sisa > 0 ? ` ${terbilang(sisa)}` : ""}`;
  } else if (num < 200) {
    const sisa = num - 100;
    return `Seratus${sisa > 0 ? ` ${terbilang(sisa)}` : ""}`;
  } else if (num < 1000) {
    const sisa = num % 100;
    return `${terbilang(Math.floor(num / 100))} Ratus${sisa > 0 ? ` ${terbilang(sisa)}` : ""}`;
  } else if (num < 2000) {
    const sisa = num - 1000;
    return `Seribu${sisa > 0 ? ` ${terbilang(sisa)}` : ""}`;
  } else if (num < 1000000) {
    const sisa = num % 1000;
    return `${terbilang(Math.floor(num / 1000))} Ribu${sisa > 0 ? ` ${terbilang(sisa)}` : ""}`;
  } else if (num < 1000000000) {
    const sisa = num % 1000000;
    return `${terbilang(Math.floor(num / 1000000))} Juta${sisa > 0 ? ` ${terbilang(sisa)}` : ""}`;
  } else if (num < 1000000000000) {
    const sisa = num % 1000000000;
    return `${terbilang(Math.floor(num / 1000000000))} Miliar${sisa > 0 ? ` ${terbilang(sisa)}` : ""}`;
  } else {
    return num.toLocaleString("id-ID");
  }
}

export function terbilangRupiah(n: number): string {
  if (n === 0) return "Nol Rupiah";
  return `${terbilang(n)} Rupiah`;
}
