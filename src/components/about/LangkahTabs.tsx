"use client";

/* Section "Cara mulainya" — mengadaptasi public/images/section_steps.png
   (pola Zenius): tab folder menyatu ke panel, tab aktif biru, mock window
   browser gelap di kanan panel, banner CTA gelap di bawah. Disesuaikan ke
   panggung putih halaman (di Zenius aslinya panggung gelap, kita sudah punya
   dua bar gelap: pull-quote teal dan section guru).

   14 Sep 2026 (permintaan user): semua aksen amber section ini jadi biru
   mengikuti token palette (--brand / --brand-soft).
   16 Sep 2026 (permintaan user): mock window beralih ke theme putih —
   bar judul slate terang, isi putih; dot macOS pakai warna aslinya. */

import { useState } from "react";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";

type Langkah = {
  tab: string;
  judul: string;
  url: string;
  windowJudul: string;
  desc: string;
  mock: { label: string; aktif?: boolean }[];
  catatanKaki?: string;
};

function getLangkahData(isEn: boolean): Langkah[] {
  return [
    {
      tab: isEn ? "Step 1" : "Langkah 1",
      judul: isEn ? "Create parent account" : "Buat akun orang tua",
      url: "siedu.id/register",
      windowJudul: isEn ? "Enter parent & child details" : "Isi data Anda dan anak",
      desc: isEn
        ? "Sign up with email, then complete child profile: name, date of birth, and school level. One account can be used for multiple children."
        : "Daftar dengan email, lalu lengkapi profil anak: nama, tanggal lahir, dan jenjang. Satu akun bisa dipakai untuk beberapa anak.",
      mock: [
        { label: isEn ? "Parent name" : "Nama orang tua" },
        { label: "Email" },
        { label: isEn ? "Child name" : "Nama anak", aktif: true },
        { label: isEn ? "Date of birth" : "Tanggal lahir" },
        { label: "TK" },
        { label: "SD" },
        { label: "SMP" },
        { label: "SMA" },
      ],
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
      mock: [
        { label: isEn ? "Elementary Math" : "Matematika SD" },
        { label: isEn ? "High School Physics" : "Fisika SMA", aktif: true },
        { label: isEn ? "Junior High English" : "B. Inggris SMP" },
        { label: isEn ? "Kindergarten Math" : "Matematika TK" },
        { label: isEn ? "High School Chem" : "Kimia SMA" },
        { label: isEn ? "Junior High Math" : "Matematika SMP" },
      ],
      catatanKaki: isEn ? "Full classes cannot be selected, no hidden waitlists." : "Kelas yang sudah penuh tidak dapat dipilih, tanpa daftar tunggu tersembunyi.",
    },
    {
      tab: isEn ? "Step 3" : "Langkah 3",
      judul: isEn ? "Complete payment" : "Selesaikan pembayaran",
      url: "siedu.id/pembayaran",
      windowJudul: isEn ? "Full pay or DP + installments" : "Lunas atau DP + cicilan",
      desc: isEn
        ? "Pay via Midtrans, choose full payment or down payment with manual installments. Seven business days grace period with due dates tracked in parent portal."
        : "Pembayaran melalui Midtrans, pilih lunas atau DP dengan cicilan manual. Tenggang bayar tujuh hari kerja, jatuh temponya terlihat di portal orang tua.",
      mock: [
        { label: isEn ? "Full Pay" : "Lunas" },
        { label: isEn ? "DP + Installment" : "DP + cicilan", aktif: true },
        { label: isEn ? "Bank Transfer" : "Transfer bank" },
        { label: "QRIS" },
        { label: isEn ? "Convenience Store" : "Minimarket" },
      ],
      catatanKaki: isEn ? "No auto-debit, complete payment breakdown is shown upfront." : "Tidak ada auto-debit, nominal tampil utuh sebelum membayar.",
    },
    {
      tab: isEn ? "Step 4" : "Langkah 4",
      judul: isEn ? "Track progress" : "Pantau progresnya",
      url: "siedu.id/portal",
      windowJudul: isEn ? "Attendance & grades" : "Presensi & nilai anak",
      desc: isEn
        ? "Teachers log attendance and grades every session. Everything is immediately visible on your account without having to ask in chat."
        : "Guru mengisi presensi dan nilai setiap pertemuan. Semuanya langsung terlihat di akun Anda tanpa perlu bertanya melalui chat.",
      mock: [
        { label: isEn ? "Present — Sep 12" : "Hadir — 12 Sep", aktif: true },
        { label: isEn ? "Score 86 — Algebra" : "Nilai 86 — Aljabar" },
        { label: isEn ? "Present — Sep 5" : "Hadir — 5 Sep" },
        { label: isEn ? "Score 91 — Functions" : "Nilai 91 — Fungsi" },
        { label: isEn ? "Excused — Aug 29" : "Izin — 29 Agu" },
        { label: isEn ? "Score 78 — Geometry" : "Nilai 78 — Geometri" },
      ],
      catatanKaki: isEn ? "Grade history can only be corrected through official logged workflows." : "Riwayat nilai hanya dapat dikoreksi melalui alur resmi yang tercatat.",
    },
  ];
}

/* Palette section — sumber: token Siedu di globals.css */
const BRAND = "#2563eb"; /* --brand (blue-600): panel, tab aktif */
const BRAND_LIGHT = "#dbeafe"; /* --brand-soft (blue-100): tab non-aktif, banner CTA */
const BRAND_DEEP = "#1e3a8a"; /* blue-900: teks judul tab non-aktif, teks banner CTA */

/* Dot kontrol jendela ala macOS, warna asli (bar sudah terang) */
const MAC_DOTS = ["#ff5f57", "#febc2e", "#28c840"];

export default function LangkahTabs() {
  const locale = useLocale();
  const isEn = locale === 'en';
  const steps = getLangkahData(isEn);
  const [aktif, setAktif] = useState(0);
  const s = steps[aktif];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Tab folder */}
      <div role="tablist" aria-label={isEn ? "Getting started steps at Siedu" : "Langkah mulai di Siedu"} className="flex flex-wrap gap-1.5">
        {steps.map((l, i) => {
          const on = i === aktif;
          return (
            <button
              key={l.tab}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => setAktif(i)}
              className="rounded-t-xl px-5 pt-3.5 pb-3 text-left transition-colors"
              style={{ backgroundColor: on ? BRAND : BRAND_LIGHT }}
            >
              <span
                className="block text-[11px] font-medium"
                style={{ color: on ? "#bfdbfe" : "#60a5fa" }}
              >
                {l.tab}
              </span>
              <span
                className="block text-sm font-bold sm:text-base"
                style={{ color: on ? "#ffffff" : BRAND_DEEP }}
              >
                {l.judul}
              </span>
            </button>
          );
        })}
      </div>

      {/* Panel menyatu dengan tab aktif */}
      <div role="tabpanel" className="rounded-b-2xl rounded-tr-2xl p-6 sm:p-8" style={{ backgroundColor: BRAND }}>
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">{s.judul}</h3>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-[#e0efff]">{s.desc}</p>
            {s.catatanKaki && (
              <p className="mt-4 border-t border-white/25 pt-3 text-xs font-semibold text-[#bfdbfe]">
                {s.catatanKaki}
              </p>
            )}
          </div>

          {/* Mock window ala referensi — theme putih */}
          <div className="overflow-hidden rounded-lg border border-white/60 bg-white shadow-xl">
            <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-100 px-4 py-2.5">
              {MAC_DOTS.map((c) => (
                <span key={c} className="size-2.5 rounded-full" style={{ backgroundColor: c }} />
              ))}
              <span className="ml-3 truncate text-[11px] text-slate-500">{s.url}</span>
            </div>
            <div className="p-5">
              <p className="text-sm font-semibold text-slate-900">{s.windowJudul}</p>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {s.mock.map((m) => (
                  <span
                    key={m.label}
                    className="rounded-md border px-2 py-2.5 text-center text-[11px] font-semibold sm:text-xs"
                    style={
                      m.aktif
                        ? { backgroundColor: BRAND_LIGHT, borderColor: BRAND_LIGHT, color: "#0f172a" }
                        : { borderColor: "#cbd5e1", color: "#334155" }
                    }
                  >
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner CTA — 14 Sep: navy gelap jadi blue-100 segar keluarga biru;
          teks brand-deep, tombol putih+garis biru supaya kontras ke panel
          blue-600 persis di atasnya tidak leleh. */}
      <div className="mt-5 flex flex-col items-start justify-between gap-4 rounded-2xl px-6 py-5 sm:flex-row sm:items-center sm:pl-8 sm:pr-3" style={{ backgroundColor: BRAND_LIGHT }}>
        <div>
          <p className="text-sm font-bold sm:text-base" style={{ color: BRAND_DEEP }}>
            {isEn
              ? "All four steps run inside one account, none through chat."
              : "Keempat langkah berjalan dalam satu akun, tidak ada yang melalui chat."}
          </p>
          <p className="mt-0.5 text-xs italic sm:text-sm" style={{ color: "#3b5b91" }}>
            {isEn
              ? "You can explore the class list first, with no account and no fees."
              : "Anda dapat melihat daftar kelas lebih dulu, tanpa akun dan tanpa biaya."}
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
