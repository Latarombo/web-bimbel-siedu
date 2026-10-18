"use client";

/* Section "Empat langkah memulai" - mempertahankan 100% desain card & layout
   asli yang disukai user, hanya mengganti konten mock window di dalamnya agar
   memiliki UI yang unik dan berbeda di setiap langkah (pola referensi Zenius):
   - Langkah 1: Pilihan Jenjang & Form Profil Anak (seperti screenshot 3 Zenius)
   - Langkah 2: Kartu Katalog Kelas & Kuota Real-time
   - Langkah 3: Rincian Pembayaran & Pilihan Saluran Midtrans
   - Langkah 4: Donut Chart Presensi & Rekap Nilai Materi (seperti screenshot 1 Zenius)
*/

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Lock,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Eye,
  Clock,
} from "lucide-react";

type Langkah = {
  tab: string;
  judul: string;
  url: string;
  windowJudul: string;
  desc: string;
  catatanKaki?: string;
};

function getLangkahData(isEn: boolean): Langkah[] {
  return [
    {
      tab: isEn ? "Step 1" : "Langkah 1",
      judul: isEn ? "Create parent account" : "Buat akun orang tua",
      url: "siedu.id/register",
      windowJudul: isEn ? "Enter credentials & address" : "Isi kredensial & domisili",
      desc: isEn
        ? "Sign up with email and password, then complete your WhatsApp contact and residential address for parent portal access."
        : "Daftar dengan email dan kata sandi, lalu lengkapi kontak WhatsApp serta alamat domisili untuk akses portal orang tua.",
      catatanKaki: isEn ? "No fees at this step." : "Belum ada biaya pada langkah ini.",
    },
    {
      tab: isEn ? "Step 2" : "Langkah 2",
      judul: isEn ? "Choose a class" : "Pilih kelas",
      url: "siedu.id/classes",
      windowJudul: isEn ? "Select class matching school level" : "Pilih kelas sesuai jenjang",
      desc: isEn
        ? "Filter classes by school level and subject, then check remaining seats. Seat quota is locked once enrolled."
        : "Saring kelas berdasarkan jenjang dan mata pelajaran, lalu periksa sisa kuotanya. Kuota langsung terkunci begitu pendaftaran dilakukan.",
      catatanKaki: isEn
        ? "Full classes cannot be selected, no hidden waitlists."
        : "Kelas yang sudah penuh tidak dapat dipilih, tanpa daftar tunggu tersembunyi.",
    },
    {
      tab: isEn ? "Step 3" : "Langkah 3",
      judul: isEn ? "Complete payment" : "Selesaikan pembayaran",
      url: "siedu.id/pembayaran",
      windowJudul: isEn ? "Full pay or DP + installments" : "Lunas atau DP + cicilan",
      desc: isEn
        ? "Pay via Midtrans, choose full payment or down payment with manual installments. Seven business days grace period with due dates tracked in parent portal."
        : "Pembayaran melalui Midtrans, pilih lunas atau DP dengan cicilan manual. Tenggang bayar tujuh hari kerja, jatuh temponya terlihat di portal orang tua.",
      catatanKaki: isEn
        ? "No auto-debit, complete payment breakdown is shown upfront."
        : "Tidak ada auto-debit, nominal tampil utuh sebelum membayar.",
    },
    {
      tab: isEn ? "Step 4" : "Langkah 4",
      judul: isEn ? "Track progress" : "Pantau progresnya",
      url: "siedu.id/portal",
      windowJudul: isEn ? "Attendance & grades" : "Presensi & nilai anak",
      desc: isEn
        ? "Teachers log attendance and grades every session. Everything is immediately visible on your account without having to ask in chat."
        : "Guru mengisi presensi dan nilai setiap pertemuan. Semuanya langsung terlihat di akun Anda tanpa perlu bertanya melalui chat.",
      catatanKaki: isEn
        ? "Grade history can only be corrected through official logged workflows."
        : "Riwayat nilai hanya dapat dikoreksi melalui alur resmi yang tercatat.",
    },
  ];
}

/* Palette section - sumber token Siedu di globals.css */
const BRAND = "#2563eb"; /* --brand (blue-600): panel, tab aktif */
const BRAND_LIGHT = "#dbeafe"; /* --brand-soft (blue-100): tab non-aktif, banner CTA */
const BRAND_DEEP = "#1e3a8a"; /* blue-900: teks judul tab non-aktif, teks banner CTA */

/* Dot kontrol jendela ala macOS, warna asli */
const MAC_DOTS = ["#ff5f57", "#febc2e", "#28c840"];

/* Komponen efek animasi ketik live (Typewriter Effect) untuk kolom form aktif */
function TypewriterPhone({ fullText = "0812-3456-7890" }: { fullText?: string }) {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (text.length < fullText.length) {
        timer = setTimeout(() => {
          setText(fullText.slice(0, text.length + 1));
        }, 110);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 3200);
      }
    } else {
      if (text.length > 0) {
        timer = setTimeout(() => {
          setText(fullText.slice(0, text.length - 1));
        }, 45);
      } else {
        timer = setTimeout(() => {
          setIsDeleting(false);
        }, 800);
      }
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, fullText]);

  return (
    <div className="flex items-center truncate">
      <span className="font-mono font-bold text-slate-900">
        {text || <span className="opacity-0">0</span>}
      </span>
      <span
        className="inline-block w-0.5 h-3.5 bg-slate-900 rounded-full ml-0.5 shrink-0"
        style={{ animation: "caretBlink 0.8s step-end infinite" }}
      />
    </div>
  );
}

/* Komponen Mockup Langkah 3 (Pilihan Final): Midtrans SNAP Gateway & Instant Digital Settlement */
function Step3PaymentMockup({ isEn }: { isEn: boolean }) {
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Berganti status setiap 3.5 detik (Fase 1: Midtrans QRIS SNAP -> Fase 2: Digital Settlement Verified)
    const timer = setInterval(() => {
      setIsSuccess((prev) => !prev);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-3.5 text-left py-1">
      <style>{`
        @keyframes qrLaserSweep {
          0% { top: 4%; opacity: 0.3; }
          15% { opacity: 1; }
          50% { top: 92%; opacity: 1; }
          85% { opacity: 1; }
          100% { top: 4%; opacity: 0.3; }
        }
        @keyframes successPop {
          0% { transform: scale(0.85); opacity: 0; }
          70% { transform: scale(1.03); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Header Dialog Sesuai Standar Langkah 1, 2, & 4 */}
      <div>
        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
          {isEn ? "Complete Payment via QRIS" : "Selesaikan Pembayaran via QRIS"}
        </h4>
        <p className="mt-0.5 text-[11px] sm:text-xs font-normal text-slate-500 leading-normal">
          {isEn
            ? "Scan official QRIS code with m-Banking or e-Wallet for instant automated verification"
            : "Pindai kode QRIS resmi dengan m-Banking atau e-Wallet untuk verifikasi instan"}
        </p>
      </div>

      {/* Konten Kasir Pembayaran (Fase 1: Scan QRIS & Langkah Bayar -> Fase 2: Settlement Selesai) */}
      <div className="relative min-h-[190px] sm:min-h-[200px]">
        {/* FASE 1: QRIS OFFICIAL CHECKOUT DENGAN 3 LANGKAH BAYAR LANGSUNG DI CANVAS */}
        <div
          className={`flex items-center gap-4 sm:gap-6 transition-all duration-300 ${
            isSuccess ? "opacity-0 pointer-events-none scale-95 absolute inset-0" : "opacity-100 scale-100"
          }`}
        >
          {/* Sisi Kiri: Kotak QR Code dengan Garis Laser Pemindai & Timer Batas Bayar */}
          <div className="shrink-0 flex flex-col items-center gap-1.5">
            <div className="relative size-26 sm:size-30 shrink-0 bg-white p-1.5 sm:p-2 rounded-xl border border-slate-200/90 flex items-center justify-center shadow-2xs">
              {/* Matriks QRIS Resmi Standar ISO/IEC 18004 (Level H Error Correction, Dapat Discan Nyata) */}
              <svg
                viewBox="0 0 33 33"
                className="size-full text-slate-900"
                fill="currentColor"
                shapeRendering="crispEdges"
                aria-hidden="true"
              >
                <path d="M0,0h7v1h-7zM11,0h1v1h-1zM16,0h2v1h-2zM19,0h2v1h-2zM22,0h1v1h-1zM24,0h1v1h-1zM26,0h7v1h-7zM0,1h1v1h-1zM6,1h1v1h-1zM8,1h1v1h-1zM10,1h3v1h-3zM14,1h3v1h-3zM19,1h1v1h-1zM26,1h1v1h-1zM32,1h1v1h-1zM0,2h1v1h-1zM2,2h3v1h-3zM6,2h1v1h-1zM8,2h2v1h-2zM12,2h1v1h-1zM15,2h1v1h-1zM17,2h1v1h-1zM19,2h3v1h-3zM24,2h1v1h-1zM26,2h1v1h-1zM28,2h3v1h-3zM32,2h1v1h-1zM0,3h1v1h-1zM2,3h3v1h-3zM6,3h1v1h-1zM8,3h2v1h-2zM13,3h3v1h-3zM17,3h2v1h-2zM20,3h4v1h-4zM26,3h1v1h-1zM28,3h3v1h-3zM32,3h1v1h-1zM0,4h1v1h-1zM2,4h3v1h-3zM6,4h1v1h-1zM8,4h3v1h-3zM16,4h8v1h-8zM26,4h1v1h-1zM28,4h3v1h-3zM32,4h1v1h-1zM0,5h1v1h-1zM6,5h1v1h-1zM8,5h3v1h-3zM13,5h1v1h-1zM15,5h1v1h-1zM18,5h1v1h-1zM23,5h1v1h-1zM26,5h1v1h-1zM32,5h1v1h-1zM0,6h7v1h-7zM8,6h1v1h-1zM10,6h1v1h-1zM12,6h1v1h-1zM14,6h1v1h-1zM16,6h1v1h-1zM18,6h1v1h-1zM20,6h1v1h-1zM22,6h1v1h-1zM24,6h1v1h-1zM26,6h7v1h-7zM9,7h1v1h-1zM11,7h5v1h-5zM19,7h2v1h-2zM22,7h3v1h-3zM2,8h1v1h-1zM5,8h4v1h-4zM11,8h1v1h-1zM19,8h1v1h-1zM24,8h2v1h-2zM27,8h5v1h-5zM0,9h6v1h-6zM10,9h1v1h-1zM12,9h2v1h-2zM15,9h1v1h-1zM20,9h1v1h-1zM22,9h6v1h-6zM32,9h1v1h-1zM0,10h1v1h-1zM3,10h1v1h-1zM6,10h3v1h-3zM10,10h1v1h-1zM12,10h5v1h-5zM20,10h4v1h-4zM26,10h5v1h-5zM32,10h1v1h-1zM0,11h1v1h-1zM2,11h2v1h-2zM5,11h1v1h-1zM9,11h1v1h-1zM11,11h1v1h-1zM14,11h3v1h-3zM20,11h1v1h-1zM22,11h1v1h-1zM27,11h1v1h-1zM29,11h1v1h-1zM31,11h2v1h-2zM0,12h1v1h-1zM6,12h1v1h-1zM8,12h4v1h-4zM21,12h2v1h-2zM24,12h1v1h-1zM26,12h1v1h-1zM28,12h2v1h-2zM31,12h2v1h-2zM0,13h3v1h-3zM4,13h1v1h-1zM7,13h1v1h-1zM9,13h2v1h-2zM21,13h6v1h-6zM29,13h2v1h-2zM32,13h1v1h-1zM1,14h3v1h-3zM6,14h1v1h-1zM8,14h1v1h-1zM10,14h1v1h-1zM23,14h4v1h-4zM28,14h2v1h-2zM32,14h1v1h-1zM0,15h1v1h-1zM2,15h1v1h-1zM5,15h1v1h-1zM8,15h4v1h-4zM22,15h3v1h-3zM26,15h1v1h-1zM31,15h2v1h-2zM0,16h8v1h-8zM9,16h1v1h-1zM11,16h1v1h-1zM22,16h1v1h-1zM26,16h2v1h-2zM29,16h3v1h-3zM0,17h1v1h-1zM8,17h2v1h-2zM11,17h1v1h-1zM23,17h1v1h-1zM26,17h2v1h-2zM30,17h1v1h-1zM32,17h1v1h-1zM1,18h3v1h-3zM6,18h1v1h-1zM9,18h1v1h-1zM21,18h1v1h-1zM23,18h1v1h-1zM28,18h3v1h-3zM32,18h1v1h-1zM2,19h1v1h-1zM5,19h1v1h-1zM10,19h1v1h-1zM23,19h1v1h-1zM26,19h4v1h-4zM31,19h1v1h-1zM0,20h3v1h-3zM6,20h6v1h-6zM22,20h2v1h-2zM27,20h1v1h-1zM31,20h2v1h-2zM2,21h1v1h-1zM4,21h2v1h-2zM11,21h4v1h-4zM17,21h1v1h-1zM19,21h2v1h-2zM27,21h1v1h-1zM30,21h3v1h-3zM0,22h10v1h-10zM11,22h2v1h-2zM17,22h3v1h-3zM22,22h2v1h-2zM25,22h2v1h-2zM28,22h1v1h-1zM30,22h1v1h-1zM32,22h1v1h-1zM5,23h1v1h-1zM8,23h1v1h-1zM10,23h1v1h-1zM13,23h1v1h-1zM17,23h2v1h-2zM27,23h1v1h-1zM29,23h1v1h-1zM31,23h2v1h-2zM0,24h3v1h-3zM5,24h4v1h-4zM10,24h1v1h-1zM12,24h4v1h-4zM20,24h1v1h-1zM23,24h7v1h-7zM8,25h2v1h-2zM12,25h1v1h-1zM16,25h4v1h-4zM21,25h1v1h-1zM23,25h2v1h-2zM28,25h2v1h-2zM31,25h2v1h-2zM0,26h7v1h-7zM8,26h1v1h-1zM13,26h1v1h-1zM15,26h1v1h-1zM17,26h2v1h-2zM24,26h1v1h-1zM26,26h1v1h-1zM28,26h1v1h-1zM30,26h1v1h-1zM32,26h1v1h-1zM0,27h1v1h-1zM6,27h1v1h-1zM8,27h3v1h-3zM13,27h1v1h-1zM15,27h1v1h-1zM18,27h1v1h-1zM21,27h1v1h-1zM23,27h2v1h-2zM28,27h2v1h-2zM31,27h2v1h-2zM0,28h1v1h-1zM2,28h3v1h-3zM6,28h1v1h-1zM10,28h1v1h-1zM12,28h1v1h-1zM15,28h1v1h-1zM18,28h1v1h-1zM21,28h1v1h-1zM23,28h7v1h-7zM0,29h1v1h-1zM2,29h3v1h-3zM6,29h1v1h-1zM9,29h2v1h-2zM12,29h1v1h-1zM16,29h1v1h-1zM19,29h1v1h-1zM21,29h1v1h-1zM23,29h1v1h-1zM25,29h1v1h-1zM27,29h5v1h-5zM0,30h1v1h-1zM2,30h3v1h-3zM6,30h1v1h-1zM8,30h1v1h-1zM10,30h1v1h-1zM12,30h1v1h-1zM14,30h1v1h-1zM16,30h2v1h-2zM19,30h2v1h-2zM23,30h2v1h-2zM28,30h2v1h-2zM31,30h2v1h-2zM0,31h1v1h-1zM6,31h1v1h-1zM9,31h1v1h-1zM11,31h2v1h-2zM16,31h2v1h-2zM19,31h2v1h-2zM22,31h1v1h-1zM24,31h2v1h-2zM29,31h2v1h-2zM0,32h7v1h-7zM9,32h2v1h-2zM12,32h2v1h-2zM15,32h1v1h-1zM17,32h1v1h-1zM23,32h2v1h-2zM26,32h1v1h-1zM28,32h3v1h-3zM32,32h1v1h-1z" />
              </svg>

              {/* Logo Siedu Resmi di Tengah QR Code (Clean & Borderless, Floating di Cutout Tengah, z-10) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-6 sm:size-7 flex items-center justify-center z-10 pointer-events-none">
                <svg viewBox="0 0 171 165" className="size-full" fill="none" aria-hidden="true">
                  <path d="M67.1851 45.5C67.1851 56.2696 58.4546 65 47.6851 65C36.9155 65 28.1851 56.2696 28.1851 45.5C28.1851 34.7304 36.9155 26 47.6851 26C58.4546 26 67.1851 34.7304 67.1851 45.5Z" fill="#1158E7"/>
                  <path d="M131.185 21.5C131.185 33.3741 121.559 43 109.685 43C97.8109 43 88.1851 33.3741 88.1851 21.5C88.1851 9.62588 97.8109 0 109.685 0C121.559 0 131.185 9.62588 131.185 21.5Z" fill="#F6A013"/>
                  <path d="M45.6851 80.0001C46.0932 74.0138 37.1851 67.2106 24.6851 70.5002C5.68512 75.5002 -10.6484 111 8.68486 140C29.6849 171.5 77.1849 172.5 100.685 140.501C116.685 117.5 107.185 108 99.6851 106.5C85.74 103.711 76.6851 119.644 57.6851 111.5C50.6851 108.5 44.0487 104 45.6851 80.0001Z" fill="#1158E7"/>
                  <path d="M121.685 91.5C114.199 84.9643 104.685 84.5 87.1849 91.9998C83.1551 93.7269 74.7852 91.9 75.1852 83.5C75.5852 75.1 85.8516 63.6665 91.185 58.9999C105.985 45.3999 123.685 43.9999 130.685 44.9999C186.685 52.9999 180.271 123.93 130.685 141C123.185 143.582 119.185 134 123.185 129.5C134.967 116.245 132.566 101 121.685 91.5Z" fill="#30ACF8"/>
                </svg>
              </div>

              {/* Garis Pemindai Laser QRIS di Layer Paling Atas (z-20) */}
              <div className="absolute inset-x-1.5 inset-y-1.5 pointer-events-none overflow-hidden rounded-md z-20">
                <div
                  className="absolute inset-x-0 h-0.5 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.7)]"
                  style={{
                    animation: "qrLaserSweep 2.2s ease-in-out infinite",
                  }}
                />
              </div>
            </div>

            {/* Total Tagihan & Timer Batas Bayar Bersanding Rapi di Bawah QR */}
            <div className="w-full flex flex-col items-center gap-1">
              <div className="text-center">
                <span className="block text-[10px] font-bold text-slate-400 tracking-wider uppercase leading-tight">
                  {isEn ? "Total Amount:" : "Total Tagihan:"}
                </span>
                <span className="block text-xs sm:text-sm font-black text-slate-900 tabular-nums tracking-tight mt-0.5">
                  Rp 150.000
                </span>
              </div>

              <div className="flex items-center gap-1 rounded-md border border-slate-200/90 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-700 font-bold">
                <Clock className="size-3 text-slate-500 shrink-0" />
                <span>{isEn ? "Expires: " : "Batas: "}</span>
                <span className="font-extrabold text-slate-900 tabular-nums">14:59</span>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Panduan Langkah demi Langkah Langsung di Canvas */}
          <div className="min-w-0 flex-1 space-y-2.5 text-left">
            <div>
              <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                {isEn ? "3 Easy Steps to Pay:" : "Langkah Pembayaran:"}
              </span>
            </div>

            {/* Daftar 3 Langkah Ringkas & Jelas */}
            <div className="space-y-2 text-xs">
              {/* Langkah 1 */}
              <div className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-slate-800 font-medium text-xs leading-snug">
                    {isEn ? "Open m-Banking or e-Wallet" : "Buka m-Banking atau e-Wallet"}
                  </p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {["BCA", "Mandiri", "BRI", "GoPay", "OVO", "Dana", isEn ? "+All" : "+Semua"].map((b) => (
                      <span
                        key={b}
                        className="rounded border border-slate-200/90 bg-slate-50 px-1.5 py-0.2 text-[9px] font-bold text-slate-700 shrink-0"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Langkah 2 */}
              <div className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p className="text-slate-800 font-medium text-xs leading-snug">
                  {isEn
                    ? "Scan QR code & verify the amount"
                    : "Pindai kode QR & pastikan nominal sesuai"}
                </p>
              </div>

              {/* Langkah 3 */}
              <div className="flex items-start gap-2">
                <span className="size-5 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p className="text-slate-800 font-medium text-xs leading-snug">
                  {isEn
                    ? "Enter PIN for instant verification"
                    : "Masukkan PIN untuk verifikasi otomatis"}
                </p>
              </div>
            </div>

            {/* Footer Note dengan Jaminan Keamanan (Strict 1 Line) */}
            <div className="pt-1.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
              <Lock className="size-3 text-slate-400 shrink-0" />
              <span className="text-slate-600 font-semibold truncate">
                {isEn ? "Instant clearing, no receipt upload required" : "Verifikasi instan tanpa perlu unggah bukti transfer"}
              </span>
            </div>
          </div>
        </div>

        {/* FASE 2: SETTLEMENT VERIFIED (KONDISI LUNAS) TERPUSAT ALA FINTECH RECEIPT */}
        <div
          className={`flex flex-col items-center justify-center text-center py-4 transition-all duration-300 ${
            isSuccess ? "opacity-100 scale-100" : "opacity-0 pointer-events-none scale-95 absolute inset-0"
          }`}
          style={{
            animation: isSuccess ? "successPop 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards" : "none",
          }}
        >
          {/* Ikon Centang Sukses dengan Ring Halus */}
          <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center ring-4 ring-emerald-50 shrink-0">
            <Check className="size-6 stroke-[2.75]" />
          </div>

          {/* Status & Nominal Besar */}
          <div className="mt-2.5">
            <p className="text-[10px] sm:text-[11px] font-bold text-emerald-700 tracking-widest uppercase">
              {isEn ? "Payment Verified" : "Pembayaran Terverifikasi"}
            </p>
            <h4 className="text-2xl sm:text-3xl font-black text-slate-900 tabular-nums tracking-tight mt-0.5">
              Rp 150.000
            </h4>
          </div>

          {/* Rincian Transaksi Minimalis (Satu Baris Bersih) */}
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-medium">
            <span className="font-bold text-slate-800">
              {isEn ? "Regular Grade 5" : "Reguler 5 SD"}
            </span>
            <span className="text-slate-300 font-bold">•</span>
            <span className="font-mono text-[11px] font-bold text-slate-600">
              TRX-SDU-88192
            </span>
            <span className="text-slate-300 font-bold">•</span>
            <span className="text-[11px] font-medium text-slate-500">
              QRIS Instant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LangkahTabs() {
  const locale = useLocale();
  const isEn = locale === "en";
  const steps = getLangkahData(isEn);
  const [aktif, setAktif] = useState(0);
  const s = steps[aktif];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Tampilan Desktop (lg: 1024px ke atas): 4 Tab Folder Penuh */}
      <div
        role="tablist"
        aria-label={isEn ? "Getting started steps at Siedu" : "Langkah mulai di Siedu"}
        className="hidden lg:flex flex-wrap gap-1.5"
      >
        {steps.map((l, i) => {
          const on = i === aktif;
          return (
            <button
              key={l.tab}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => setAktif(i)}
              className="rounded-t-xl px-5 pt-3.5 pb-3 text-left transition-colors cursor-pointer select-none"
              style={{ backgroundColor: on ? BRAND : BRAND_LIGHT }}
            >
              <span
                className="block text-[11px] font-medium"
                style={{ color: on ? "#bfdbfe" : "#60a5fa" }}
              >
                {l.tab}
              </span>
              <span
                className="block text-sm font-bold lg:text-base"
                style={{ color: on ? "#ffffff" : BRAND_DEEP }}
              >
                {l.judul}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tampilan iPad ke Mobile (< 1024px): Lingkaran-lingkaran Angka Saja (Aktif Tetap Lingkaran) */}
      <div
        role="tablist"
        aria-label={isEn ? "Getting started steps at Siedu" : "Langkah mulai di Siedu"}
        className="flex lg:hidden items-center gap-2 sm:gap-2.5 pb-2 sm:pb-2.5"
      >
        {steps.map((l, i) => {
          const on = i === aktif;
          return (
            <button
              key={l.tab}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => setAktif(i)}
              aria-label={`${l.tab}: ${l.judul}`}
              className={`size-10 sm:size-11 rounded-full flex items-center justify-center font-extrabold text-xs sm:text-sm cursor-pointer select-none transition-all active:scale-95 ${
                on
                  ? "shadow-sm ring-4 ring-blue-200/90 scale-105"
                  : "shadow-2xs opacity-90 hover:opacity-100"
              }`}
              style={{
                backgroundColor: on ? BRAND : BRAND_LIGHT,
                color: on ? "#ffffff" : BRAND_DEEP,
              }}
            >
              <span>{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Panel menyatu dengan tab: Berdampingan 2 Kolom mulai dari min-[740px] (iPad Mini & Surface Pro 10) */}
      <div
        role="tabpanel"
        className="rounded-2xl lg:rounded-none lg:rounded-b-2xl lg:rounded-tr-2xl p-5 sm:p-6 min-[740px]:p-6 lg:p-8"
        style={{ backgroundColor: BRAND }}
      >
        <div className="grid items-center gap-6 min-[740px]:gap-6 lg:gap-8 min-[740px]:grid-cols-2 lg:grid-cols-[1fr_1.1fr]">
          {/* Sisi Kiri: Judul, deskripsi, catatan kaki */}
          <div>
            <span className="lg:hidden block text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">
              {s.tab}
            </span>
            <h3 className="text-xl sm:text-2xl min-[740px]:text-xl lg:text-2xl font-black text-white">{s.judul}</h3>
            <p className="mt-2 sm:mt-2.5 text-sm sm:text-base min-[740px]:text-sm lg:text-base leading-relaxed text-[#e0efff]">{s.desc}</p>
            {s.catatanKaki && (
              <p className="mt-3.5 sm:mt-4 border-t border-white/25 pt-2.5 sm:pt-3 text-xs font-semibold text-[#bfdbfe]">
                {s.catatanKaki}
              </p>
            )}
          </div>

          {/* Sisi Kanan: Mock window ala referensi (Theme putih bersih, non-interaktif) */}
          <div className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-2xl">
            {/* Header Browser Window */}
            <div className="relative flex items-center justify-between border-b border-slate-200 bg-slate-100/90 px-3.5 sm:px-4 py-2.5">
              {/* Sisi Kiri: Mac Dots + Tombol Navigasi Browser (Berdampingan secara horizontal, tidak bertumpuk) */}
              <div className="flex items-center gap-2.5 z-10 shrink-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  {MAC_DOTS.map((c) => (
                    <span key={c} className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="hidden sm:flex items-center gap-0.5 text-slate-400 shrink-0">
                  <ChevronLeft className="size-3.5 shrink-0" />
                  <ChevronRight className="size-3.5 opacity-40 shrink-0" />
                </div>
              </div>

              {/* Sisi Tengah: Kapsul Alamat Safari Modern (Lock + URL + Reload Terintegrasi) */}
              <div className="absolute inset-x-0 flex items-center justify-center px-12 sm:px-24 pointer-events-none">
                <div className="flex items-center justify-between gap-2 w-full max-w-[210px] sm:max-w-[270px] rounded-lg border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 shadow-2xs whitespace-nowrap">
                  <Lock className="size-3 text-slate-400 shrink-0" />
                  <span className="text-[11px] leading-none inline-flex items-center">
                    <span className="font-semibold text-slate-700">siedu.id</span>
                    <span className="font-mono text-slate-400 font-medium">
                      {s.url.replace("siedu.id", "")}
                    </span>
                  </span>
                  <RotateCw className="size-3 text-slate-400 shrink-0" />
                </div>
              </div>

              {/* Sisi Kanan: Ruang Penyeimbang Header Window */}
              <div className="z-10 shrink-0 w-6 sm:w-12" aria-hidden="true" />
            </div>

            {/* Mockup Body - Non-interaktif (tidak bisa diklik oleh user) */}
            <div className="pointer-events-none select-none p-3.5 sm:p-5 min-[740px]:p-4 lg:p-5">

              {/* ============================================================== */}
              {/* MOCKUP LANGKAH 1: PENDAFTARAN AKUN ORANG TUA LENGKAP          */}
              {/* ============================================================== */}
              {aktif === 0 && (
                <div className="space-y-3.5 text-left py-1">
                  <style>{`
                    @keyframes caretBlink {
                      0%, 100% { opacity: 1; }
                      50% { opacity: 0; }
                    }
                  `}</style>

                  {/* Header Dialog Sesuai Standar Langkah 2 & 4 */}
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                      {isEn ? "Create Parent Account" : "Buat Akun Orang Tua"}
                    </h4>
                    <p className="mt-0.5 text-[11px] sm:text-xs font-normal text-slate-500 leading-normal">
                      {isEn
                        ? "Enter login credentials, personal contact, and residential address"
                        : "Lengkapi kredensial masuk, kontak pribadi, dan alamat domisili"}
                    </p>
                  </div>

                  {/* Blok 1: Kredensial Akun */}
                  <div>
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
                      {isEn ? "1. Account Credentials" : "1. Kredensial Akun"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1">
                          {isEn ? "Email Address" : "Alamat Email"}
                        </span>
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs">
                          <span className="truncate">hendrawan@email.com</span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1">
                          {isEn ? "Password" : "Kata Sandi"}
                        </span>
                        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs">
                          <span className="tracking-widest font-mono text-slate-800 text-xs sm:text-sm">••••••••••••</span>
                          <Eye className="size-3.5 text-slate-500 shrink-0 ml-1.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Garis Pemisah Halus */}
                  <div className="border-t border-slate-200/80" />

                  {/* Blok 2: Data Diri & Domisili (Sedang Diisi dengan Kursor Berkedip) */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
                      {isEn ? "2. Personal & Residential Details" : "2. Data Diri & Domisili"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Nama Lengkap: Terisi */}
                      <div>
                        <span className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1">
                          {isEn ? "Full Name" : "Nama Lengkap"}
                        </span>
                        <div className="flex items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs">
                          <span className="truncate">Hendrawan Pratama</span>
                        </div>
                      </div>

                      {/* Nomor HP: Sedang Diisi dengan Efek Mengetik Otomatis (Live Typewriter) */}
                      <div>
                        <span className="block text-[11px] sm:text-xs font-semibold text-blue-700 mb-1">
                          {isEn ? "Phone Number" : "Nomor HP / WhatsApp"}
                        </span>
                        <div className="flex items-center rounded-lg border border-blue-600 bg-white px-2.5 py-1.5 text-xs sm:text-sm font-bold text-slate-900 shadow-2xs ring-2 ring-blue-500/15">
                          <TypewriterPhone fullText="0812-3456-7890" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Kecamatan / Wilayah: Placeholder */}
                      <div>
                        <span className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1">
                          {isEn ? "District / Region" : "Kecamatan / Wilayah"}
                        </span>
                        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs sm:text-sm text-slate-500 font-medium">
                          <span className="truncate">{isEn ? "Select district / region..." : "Pilih kecamatan / wilayah..."}</span>
                        </div>
                      </div>

                      {/* Detail Alamat Rumah: Placeholder */}
                      <div>
                        <span className="block text-[11px] sm:text-xs font-semibold text-slate-600 mb-1">
                          {isEn ? "Street Address" : "Detail Alamat Rumah"}
                        </span>
                        <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs sm:text-sm text-slate-500 font-medium">
                          <span className="truncate">{isEn ? "e.g. Jl. Buring No. 15..." : "Contoh: Jl. Buring No. 15..."}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* MOCKUP LANGKAH 2: PILIH JENJANG & KELAS (Alur Modal Siedu)     */}
              {/* ============================================================== */}
              {aktif === 1 && (
                <div className="space-y-3.5 text-left py-1">
                  {/* Header Dialog Sesuai Web Siedu */}
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                      {isEn ? "Select Level & Grade" : "Pilih Jenjang & Kelas"}
                    </h4>
                    <p className="mt-0.5 text-[11px] sm:text-xs font-normal text-slate-500 leading-normal">
                      {isEn
                        ? "Filter class catalog matching school level and grade"
                        : "Saring katalog kelas sesuai jenjang dan tingkat anak"}
                    </p>
                  </div>

                  {/* Container Interaktif dengan Jejak Alur Kursor */}
                  <div className="relative">
                    {/* SVG Garis Titik-titik Berkelok Normal yang terhubung presisi ujung ke ujung */}
                    <svg
                      className="absolute inset-0 size-full pointer-events-none z-20 overflow-visible"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M 43.0 9.6 C 52.0 15.0, 63.0 30.0, 58.0 47.0 C 53.0 62.0, 66.0 73.0, 60.4 84.5"
                        fill="none"
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>

                    {/* Bagian 1: Pilihan Jenjang Khas Web Siedu */}
                    <div>
                      <div className="grid grid-cols-4 gap-2">
                        {["TK", "SD", "SMP", "SMA"].map((j) => {
                          const isSelected = j === "SD";
                          return (
                            <div
                              key={j}
                              className={`relative rounded-lg py-2 text-center text-xs font-bold transition-all ${
                                isSelected
                                  ? "border-2 border-blue-600 bg-blue-50 text-blue-800 font-extrabold shadow-2xs"
                                  : "border border-slate-200 bg-white text-slate-800"
                              }`}
                            >
                              <span>{j}</span>
                              {isSelected && (
                                /* Anchor Titik Interaksi SD: posisi nyaman di dalam tombol (right-6), tidak terlalu pinggir */
                                <div className="absolute top-1/2 right-6 -translate-y-1/2 pointer-events-none">
                                  {/* Solusi 3: Titik Sentuh Berdimensi (Versi Lebih Memudar) tepat konsentris di ujung kursor */}
                                  <div className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-70">
                                    <span
                                      className="size-3.5 rounded-full border shadow-2xs"
                                      style={{
                                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                                        borderColor: "#3b82f6",
                                        boxShadow: "0 0 0 2px rgba(191, 219, 254, 0.7)",
                                      }}
                                    />
                                    <span
                                      className="absolute size-1 rounded-full"
                                      style={{ backgroundColor: "#2563eb" }}
                                    />
                                  </div>

                                  {/* Ghost Cursor: ujung panah (tip) tepat di (0,0) titik riak */}
                                  <svg
                                    className="absolute size-4.5 text-slate-700 opacity-65 drop-shadow-2xs"
                                    style={{ top: "-1.5px", left: "-3px" }}
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    aria-hidden="true"
                                  >
                                    <path
                                      d="M4 2l12 11.5h-6l3.5 8-2.5 1-3.5-8-3.5 3.5V2z"
                                      stroke="white"
                                      strokeWidth="1.5"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Garis Pemisah */}
                    <div className="border-t border-slate-200 my-3.5" />

                    {/* Bagian 2: Pilihan Tingkat Kelas (6 Pilihan Sesuai Grid Referensi) */}
                    <div>
                      <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
                        {isEn ? "Elementary Grades (SD)" : "Tingkat Kelas SD"}
                      </p>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: isEn ? "Grade 1" : "Kelas 1", id: 1 },
                          { label: isEn ? "Grade 2" : "Kelas 2", id: 2 },
                          { label: isEn ? "Grade 3" : "Kelas 3", id: 3 },
                          { label: isEn ? "Grade 4" : "Kelas 4", id: 4 },
                          { label: isEn ? "Grade 5" : "Kelas 5", id: 5, selected: true },
                          { label: isEn ? "Grade 6" : "Kelas 6", id: 6 },
                        ].map((k) => (
                          <div
                            key={k.id}
                            className={`rounded-lg py-2.5 text-center text-xs font-bold transition-all ${
                              k.selected
                                ? "relative border-2 border-blue-600 bg-blue-50 text-blue-900 font-extrabold shadow-2xs z-10"
                                : "border border-slate-200 bg-slate-50/70 text-slate-800"
                            }`}
                          >
                            <span>{k.label}</span>
                            {k.selected && (
                              /* Anchor Titik Interaksi Kelas 5: posisi nyaman di dalam tombol (top-3 right-6), tidak terlalu pinggir */
                              <div className="absolute top-3 right-6 pointer-events-none z-30">
                                {/* Solusi 2: Riak Animasi Lembut (Live Active Pulse) tepat konsentris di ujung kursor */}
                                <div className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                                  <span
                                    className="absolute size-5 rounded-full animate-ping"
                                    style={{ backgroundColor: "rgba(96, 165, 250, 0.45)" }}
                                  />
                                  <span
                                    className="size-3.5 rounded-full border"
                                    style={{
                                      borderColor: "#60a5fa",
                                      backgroundColor: "rgba(219, 234, 254, 0.75)",
                                    }}
                                  />
                                  <span
                                    className="absolute size-1.5 rounded-full"
                                    style={{ backgroundColor: "#2563eb" }}
                                  />
                                </div>

                                {/* Mouse Cursor Pointer: ujung panah (tip) tepat di (0,0) titik riak */}
                                <svg
                                  className="absolute size-5 text-slate-900 drop-shadow-sm"
                                  style={{ top: "-1.67px", left: "-3.33px" }}
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  aria-hidden="true"
                                >
                                  <path
                                    d="M4 2l12 11.5h-6l3.5 8-2.5 1-3.5-8-3.5 3.5V2z"
                                    stroke="white"
                                    strokeWidth="1.5"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* MOCKUP LANGKAH 3: SIMULASI MIDTRANS SNAP & QRIS SCAN          */}
              {/* ============================================================== */}
              {aktif === 2 && <Step3PaymentMockup isEn={isEn} />}

              {/* ============================================================== */}
              {/* MOCKUP LANGKAH 4: EVALUASI & CAPAIAN BELAJAR (Referensi Zenius) */}
              {/* ============================================================== */}
              {aktif === 3 && (
                <div className="space-y-3.5 text-left py-1">
                  {/* Header Hasil Evaluasi */}
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                      {isEn ? "Learning Assessment Result #08" : "Hasil Evaluasi Belajar #08"}
                    </h4>
                    <p className="mt-0.5 text-[11px] sm:text-xs font-normal text-slate-500 leading-normal">
                      {isEn
                        ? "Student learning evaluation with final score of 75.00%"
                        : "Hasil evaluasi belajar siswa dengan nilai akhir 75.00%"}
                    </p>
                  </div>

                  {/* Donut Chart & Legend */}
                  <div className="flex items-center gap-4 sm:gap-6 py-0.5">
                    {/* Donut Chart Bersegmen Hijau & Merah Bata dengan Animasi Draw-in */}
                    <div className="relative size-24 shrink-0 flex items-center justify-center">
                      <svg className="size-24 -rotate-90 overflow-visible" viewBox="0 0 42 42">
                        {/* Lingkaran Merah (Salah 25%) */}
                        <circle
                          cx="21"
                          cy="21"
                          r="15"
                          fill="transparent"
                          stroke="#e05347"
                          strokeWidth="5"
                        />
                        {/* Lingkaran Hijau (Benar 75%): menyapu melingkar saat dibuka */}
                        <circle
                          cx="21"
                          cy="21"
                          r="15"
                          fill="transparent"
                          stroke="#16a34a"
                          strokeWidth="5"
                          strokeDasharray="70.69 94.25"
                          style={{
                            animation: "donutSweep 1.1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
                          }}
                        />
                      </svg>
                      {/* Angka Persentase di Tengah Donut Chart (Proporsional & Bernapas) */}
                      <span className="absolute text-sm sm:text-base font-bold text-slate-800 tabular-nums">
                        75%
                      </span>
                    </div>

                    {/* Legend */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-[#16a34a] shrink-0" />
                        <span className="font-bold text-slate-800">
                          {isEn ? "Correct: 30 (75.00%)" : "Benar: 30 (75.00%)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-[#e05347] shrink-0" />
                        <span className="font-bold text-slate-800">
                          {isEn ? "Incorrect: 10 (25.00%)" : "Salah: 10 (25.00%)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full bg-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800">
                          {isEn ? "Unanswered: 0" : "Kosong: 0"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Garis Pembatas */}
                  <div className="border-t border-slate-200" />

                  {/* Rekap Tiap Materi */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                      {isEn ? "Topic breakdown" : "Rekap tiap materi"}
                    </p>

                    {/* Scoped CSS Keyframes untuk animasi entrance sekali jalan */}
                    <style>{`
                      @keyframes donutSweep {
                        from { stroke-dashoffset: 70.69; }
                        to { stroke-dashoffset: 0; }
                      }
                      @keyframes barFill80 { from { width: 0%; } to { width: 80%; } }
                      @keyframes barFill75 { from { width: 0%; } to { width: 75%; } }
                      @keyframes barFill70 { from { width: 0%; } to { width: 70%; } }
                      @keyframes barFill60 { from { width: 0%; } to { width: 60%; } }
                    `}</style>

                    <div className="space-y-2">
                      {[
                        { label: isEn ? "General Reasoning" : "Penalaran Umum", skor: 80, delay: "0.2s" },
                        { label: isEn ? "Reading Literacy" : "Literasi Bacaan", skor: 75, delay: "0.35s" },
                        { label: isEn ? "Mathematical Reasoning" : "Penalaran Matematika", skor: 70, delay: "0.5s" },
                        { label: isEn ? "Quantitative Skill" : "Pemahaman Kuantitatif", skor: 60, delay: "0.65s" },
                      ].map((m) => (
                        <div key={m.label} className="flex items-center gap-3 text-xs">
                          <span className="w-28 sm:w-36 shrink-0 font-bold text-slate-700 truncate">
                            {m.label}
                          </span>
                          <div className="flex h-2.5 flex-1 overflow-hidden rounded-full bg-[#e05347]">
                            <div
                              className="h-full bg-[#16a34a] rounded-full"
                              style={{
                                width: `${m.skor}%`,
                                animation: `barFill${m.skor} 0.9s cubic-bezier(0.16, 1, 0.3, 1) ${m.delay} both`,
                              }}
                            />
                          </div>
                          <span className="w-8 shrink-0 text-right font-bold text-slate-900 tabular-nums">
                            {m.skor}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Banner CTA persis seperti sebelumnya */}
      <div
        className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl px-6 py-5 sm:flex-row sm:items-center sm:pl-8 sm:pr-3"
        style={{ backgroundColor: BRAND_LIGHT }}
      >
        <div className="max-w-2xl">
          <h3 className="text-base font-bold leading-snug sm:text-lg" style={{ color: BRAND_DEEP }}>
            {isEn
              ? "Everything runs seamlessly in one parent portal"
              : "Semua proses terintegrasi dalam satu portal orang tua"}
          </h3>
          <p className="mt-1 text-xs leading-relaxed sm:text-sm" style={{ color: "#3b5b91" }}>
            {isEn
              ? "Track class schedules, daily attendance, and learning progress transparently."
              : "Pantau jadwal kelas, presensi harian, dan capaian belajar anak secara transparan."}
          </p>
        </div>
        <Link
          href="/register"
          className="shrink-0 rounded-lg border-2 px-6 py-2.5 text-sm font-bold hover:bg-blue-50"
          style={{ backgroundColor: "#ffffff", borderColor: BRAND, color: BRAND }}
        >
          {isEn ? "Register now" : "Daftar sekarang"}
        </Link>
      </div>
    </div>
  );
}
