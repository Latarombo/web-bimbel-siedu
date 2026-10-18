import { rupiah, fmtTanggal } from "@/lib/format";

/**
 * Format nomor telepon Indonesia ke format internasional (mis. 0812... -> 62812...)
 */
export function formatPhoneNumberToWA(phone?: string | null): string {
  if (!phone) return "";
  let clean = phone.replace(/[^0-9]/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.slice(1);
  } else if (!clean.startsWith("62")) {
    clean = "62" + clean;
  }
  return clean;
}

/**
 * URL WhatsApp Generator untuk Pengingat Tagihan Pembayaran
 */
export function createBillingReminderWaLink(params: {
  phone?: string | null;
  parentName?: string;
  studentName: string;
  className: string;
  amount: number;
  dueDate?: string | null;
  paymentUrl: string;
}): string {
  const targetPhone = formatPhoneNumberToWA(params.phone);
  const sapaan = params.parentName ? `Bapak/Ibu ${params.parentName}` : "Bapak/Ibu Orang Tua Siswa";
  const jatuhTempoStr = params.dueDate ? fmtTanggal(params.dueDate, "id") : "Segera";

  const message = [
    `Yth. ${sapaan},`,
    "",
    "Berikut pemberitahuan tagihan bimbingan belajar Siedu Learning Center:",
    `• Nama Siswa: ${params.studentName}`,
    `• Kelas: ${params.className}`,
    `• Jumlah Tagihan: ${rupiah(params.amount)}`,
    `• Batas Pembayaran: ${jatuhTempoStr}`,
    "",
    "Pembayaran resmi dapat dilakukan secara aman melalui tautan berikut:",
    params.paymentUrl,
    "",
    "Terima kasih atas kerja sama dan kepercayaan Bapak/Ibu.",
    "Salam hangat,",
    "Siedu Learning Center",
  ].join("\n");

  const encoded = encodeURIComponent(message);
  return targetPhone ? `https://wa.me/${targetPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

/**
 * URL WhatsApp Generator untuk Pembagian Materi & PR Sesi
 */
export function createSessionNotesWaLink(params: {
  phone?: string | null;
  className: string;
  sessionDate: string;
  materi: string;
  pr?: string | null;
  portalUrl?: string;
}): string {
  const targetPhone = formatPhoneNumberToWA(params.phone);

  const lines = [
    `Yth. Orang Tua/Wali Murid ${params.className},`,
    "",
    `Berikut ringkasan materi dan kegiatan belajar sesi ${params.sessionDate}:`,
    "",
    `📘 Topik Materi:`,
    params.materi.trim(),
  ];

  if (params.pr && params.pr.trim().length > 0) {
    lines.push("", `📝 Latihan / Tugas (PR):`, params.pr.trim());
  }

  if (params.portalUrl) {
    lines.push("", `Pantau perkembangan dan jadwal belajar ananda di:`, params.portalUrl);
  }

  lines.push("", "Terima kasih atas perhatian dan dukungannya.", "Salam, Pengajar Siedu");

  const encoded = encodeURIComponent(lines.join("\n"));
  return targetPhone ? `https://wa.me/${targetPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

/**
 * URL WhatsApp Generator untuk Pembagian E-Rapor Siswa
 */
export function createReportCardWaLink(params: {
  phone?: string | null;
  parentName?: string;
  studentName: string;
  className: string;
  averageScore?: number | null;
  attendancePercent?: number;
  reportUrl: string;
}): string {
  const targetPhone = formatPhoneNumberToWA(params.phone);
  const sapaan = params.parentName ? `Bapak/Ibu ${params.parentName}` : "Bapak/Ibu Orang Tua Siswa";

  const lines = [
    `Yth. ${sapaan},`,
    "",
    `Laporan Capaian Belajar (E-Rapor) ananda ${params.studentName} pada kelas ${params.className} telah diterbitkan.`,
  ];

  if (params.attendancePercent != null) {
    lines.push(`• Tingkat Kehadiran: ${params.attendancePercent}%`);
  }
  if (params.averageScore != null) {
    lines.push(`• Rata-rata Capaian: ${params.averageScore}`);
  }

  lines.push(
    "",
    "Dokumen E-Rapor resmi dapat diunduh dan dicetak melalui tautan berikut:",
    params.reportUrl,
    "",
    "Terima kasih atas kerja sama dan pendampingan belajar ananda.",
    "Salam hangat,",
    "Siedu Learning Center"
  );

  const encoded = encodeURIComponent(lines.join("\n"));
  return targetPhone ? `https://wa.me/${targetPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

/**
 * URL WhatsApp Generator untuk Pembagian Kuitansi Pembayaran Sah
 */
export function createReceiptPaidWaLink(params: {
  phone?: string | null;
  parentName?: string;
  studentName: string;
  className: string;
  receiptNumber: string;
  amount: number;
  paidDate: string;
  receiptUrl: string;
}): string {
  const targetPhone = formatPhoneNumberToWA(params.phone);
  const sapaan = params.parentName ? `Bapak/Ibu ${params.parentName}` : "Bapak/Ibu Orang Tua Siswa";

  const lines = [
    `Yth. ${sapaan},`,
    "",
    "Pembayaran bimbingan belajar Siedu Learning Center telah berhasil diverifikasi dan dinyatakan SAH / LUNAS:",
    `• Nomor Kuitansi: ${params.receiptNumber}`,
    `• Nama Siswa: ${params.studentName}`,
    `• Kelas: ${params.className}`,
    `• Jumlah: ${rupiah(params.amount)}`,
    `• Tanggal: ${params.paidDate}`,
    "",
    "Kuitansi elektronik resmi dapat diakses dan dicetak melalui tautan berikut:",
    params.receiptUrl,
    "",
    "Terima kasih atas kerja sama dan kepercayaan Anda.",
    "Salam hangat,",
    "Siedu Learning Center",
  ];

  const encoded = encodeURIComponent(lines.join("\n"));
  return targetPhone ? `https://wa.me/${targetPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
}

