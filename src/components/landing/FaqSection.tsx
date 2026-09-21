/**
 * Section 07 — FAQ, mengikuti contohFAQ.png (user):
 * panel teal #13939e dengan lingkaran transparan bertumpuk; heading putih
 * "Paling sering ditanyakan" tengah (tanpa sub); baris pertanyaan = bilah
 * abu terang #f2f5fa tanpa border, radius kecil, min-h 63px, jarak antar
 * baris 12px, pertanyaan serif-di-desain-asli (di sini tetap sans brand biar
 * konsisten), chevron gelap di kanan; penutup "Baca Selengkapnya ↓" = teks
 * putih tebal di atas latar (tanpa bentuk tombol) yang memunculkan sisa
 * pertanyaan di tempat (contoh punya 9 baris; yang awal 5, sisanya numpuk).
 * Jawaban tidak ada di contoh → didraft dari logika bisnis, tetap dibuka
 * per baris seperti akordeon normal.
 */
"use client";
import { useTranslations } from "next-intl";


import { useState } from "react";
import { ChevronDown } from "lucide-react";

const TEAL = "#13939e";
const BARIS = "#f2f5fa";
const AWAL = 5;



/** Lingkaran dekoratif latar: warna teal seturun-an / putih transparan. */
function Circles() {
 const c = (cls: string, style: React.CSSProperties) => (
 <div aria-hidden className={`absolute rounded-full ${cls}`} style={style} />
 );
 return (
 <>
 {c("size-[560px] bg-white/10", { top: "-160px", left: "-140px" })}
 {c("size-[420px] bg-cyan-300/20", { top: "24%", left: "-180px" })}
 {c("size-[640px] bg-cyan-500/25", { top: "-220px", right: "-220px" })}
 {c("size-[360px] bg-white/10", { bottom: "16%", right: "-120px" })}
 {c("size-[520px] bg-teal-800/30", { bottom: "-200px", left: "18%" })}
 {c("size-[300px] bg-cyan-200/15", { bottom: "-90px", right: "26%" })}
 </>
 );
}

function FaqItem({
  q,
  a,
  isOpen,
  onToggle,
  id,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
  id: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-xl transition-shadow duration-200"
      style={{ backgroundColor: BARIS }}
    >
      <button
        type="button"
        id={`faq-btn-${id}`}
        aria-expanded={isOpen}
        aria-controls={`faq-content-${id}`}
        onClick={onToggle}
        className="flex min-h-[63px] w-full cursor-pointer items-center justify-between gap-4 px-4 py-3.5 text-left text-[15px] font-semibold text-[#2c313a] transition-colors hover:text-slate-900 sm:px-6"
      >
        <span className="leading-snug">{q}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-slate-500 transition-transform duration-300 ease-out ${
            isOpen ? "rotate-180 text-teal-700" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Smooth Expand/Collapse via CSS Grid template rows */}
      <div
        id={`faq-content-${id}`}
        role="region"
        aria-labelledby={`faq-btn-${id}`}
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="px-4 pb-5 pt-1 text-sm leading-relaxed text-slate-600 sm:px-6 sm:text-[14.5px]">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FaqSection() {
 const tr = useTranslations("public");
const faq: [string, string][] = [
 [
 tr("text3"),
 tr("text4"),
 ],
 [
 tr("text5"),
 tr("text6"),
 ],
 [
 tr("text7"),
 tr("text8"),
 ],
 [
 tr("text9"),
 tr("text10"),
 ],
 [
 tr("text11"),
 tr("text12"),
 ],
 // ---- muncul setelah "Baca Selengkapnya" ----
 [
 tr("text13"),
 tr("text14"),
 ],
 [
 tr("text15"),
 tr("text16"),
 ],
 [
 tr("text17"),
 tr("text18"),
 ],
 [
 tr("text19"),
 tr("text20"),
 ],
 [
 tr("text21"),
 tr("text22"),
 ],
];

  const [semua, setSemua] = useState(false);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const awalFaq = faq.slice(0, AWAL);
  const sisaFaq = faq.slice(AWAL);

  const handleToggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const handleToggleSemua = () => {
    setSemua((prev) => {
      const next = !prev;
      // Jika disembunyikan dan item yang terbuka berada di sisa FAQ (index >= AWAL), tutup item tersebut
      if (!next && openIndex !== null && openIndex >= AWAL) {
        setOpenIndex(null);
      }
      return next;
    });
  };

  return (
    <section
      id="faq"
      className="relative scroll-mt-20 overflow-hidden"
      style={{ backgroundColor: TEAL }}
    >
      <Circles />
      <div className="relative mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
          {tr("text23")}
        </h2>

        {/* 5 FAQ Pertama */}
        <div className="mt-10 space-y-3">
          {awalFaq.map(([q, a], idx) => (
            <FaqItem
              key={q}
              id={String(idx)}
              q={q}
              a={a}
              isOpen={openIndex === idx}
              onToggle={() => handleToggle(idx)}
            />
          ))}
        </div>

        {/* Sisa FAQ dengan Animasi Smooth Slide Down/Up via CSS Grid */}
        <div
          className={`grid transition-all duration-500 ease-in-out ${
            semua ? "grid-rows-[1fr] opacity-100 mt-3" : "grid-rows-[0fr] opacity-0 mt-0"
          }`}
        >
          <div className="overflow-hidden">
            <div className="space-y-3 pt-0">
              {sisaFaq.map(([q, a], idx) => {
                const actualIndex = AWAL + idx;
                return (
                  <FaqItem
                    key={q}
                    id={String(actualIndex)}
                    q={q}
                    a={a}
                    isOpen={openIndex === actualIndex}
                    onToggle={() => handleToggle(actualIndex)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={handleToggleSemua}
            className="group inline-flex cursor-pointer items-center gap-2 text-[15px] font-bold text-white transition-colors hover:text-cyan-100"
            aria-expanded={semua}
          >
            <span>{semua ? tr("faqHide") : tr("text24")}</span>
            <ChevronDown
              className={`size-4 text-cyan-200 transition-transform duration-300 ease-out ${
                semua ? "rotate-180 text-white" : "group-hover:translate-y-0.5"
              }`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </section>
  );
}
