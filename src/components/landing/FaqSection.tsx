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

function Item({ q, a }: { q: string; a: string }) {
 return (
 <details className="group">
 <summary
 className="flex min-h-[63px] cursor-pointer list-none items-center justify-between gap-4 rounded-lg px-4 py-3 text-[15px] font-semibold text-[#2c313a] group-open:rounded-b-none sm:px-6 [&::-webkit-details-marker]:hidden"
 style={{ backgroundColor: BARIS }}
 >
 {q}
 <ChevronDown
 className="size-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
 aria-hidden
 />
 </summary>
 <p
 className="-mt-px rounded-b-lg px-4 pb-5 pt-1 text-sm leading-relaxed text-pretty text-gray-600 sm:px-6"
 style={{ backgroundColor: BARIS }}
 >
 {a}
 </p>
 </details>
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
 const tampil = semua ? faq : faq.slice(0, AWAL);

 return (
 <section
 id="faq"
 className="relative scroll-mt-20 overflow-hidden"
 style={{ backgroundColor: TEAL }}
 >
 <Circles />
 <div className="relative mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
 <h2 className="text-center text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl">
 {tr("text23")}</h2>

 <div className="mt-10 space-y-3">
 {tampil.map(([q, a]) => (
 <Item key={q} q={q} a={a} />
 ))}
 </div>

 <div className="mt-10 text-center">
 <button
 type="button"
 onClick={() => setSemua((v) => !v)}
 className="inline-flex items-center gap-2 text-[15px] font-bold text-white"
 aria-expanded={semua}
 >
 {semua ? tr("faqHide") : tr("text24")}
 <ChevronDown
 className={`size-4 text-cyan-200 transition-transform ${semua ? "rotate-180" : ""}`}
 aria-hidden
 />
 </button>
 </div>
 </div>
 </section>
 );
}
