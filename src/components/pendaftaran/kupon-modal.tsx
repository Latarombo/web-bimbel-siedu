"use client";

import { useState, useEffect } from "react";
import { Ticket, X, Check, Tag } from "lucide-react";
import { rupiah } from "@/lib/format";
import { useScrollLock } from "@/lib/use-scroll-lock";

export type Kupon = {
  kode: string;
  judul: string;
  deskripsi: string;
  tipe: "nominal" | "persen";
  nilai: number; // nominal rupiah atau persen
  maksimalPotongan?: number;
  berlakuHingga: string;
};

export const DAFTAR_KUPON: Kupon[] = [
  {
    kode: "SIEDUJUARA",
    judul: "Semangat Juara Semester Baru",
    deskripsi: "Potongan langsung Rp 150.000 untuk paket bimbingan belajar reguler.",
    tipe: "nominal",
    nilai: 150000,
    berlakuHingga: "31 Des 2026",
  },
  {
    kode: "BIMBELHEMAT",
    judul: "Diskon Murid Baru Siedu",
    deskripsi: "Hemat Rp 100.000 pendaftaran pertama bagi putra-putri tercinta.",
    tipe: "nominal",
    nilai: 100000,
    berlakuHingga: "31 Des 2026",
  },
  {
    kode: "PROMOSEMESTER",
    judul: "Promo Kilat Semester Ganjil",
    deskripsi: "Diskon 10% (maksimal Rp 250.000) untuk seluruh jenjang pendidikan.",
    tipe: "persen",
    nilai: 10,
    maksimalPotongan: 250000,
    berlakuHingga: "31 Des 2026",
  },
];

export function hitungPotonganKupon(kupon: Kupon | null, subtotal: number): number {
  if (!kupon || subtotal <= 0) return 0;
  if (kupon.tipe === "nominal") {
    return Math.min(kupon.nilai, subtotal);
  }
  if (kupon.tipe === "persen") {
    const pot = Math.floor((subtotal * kupon.nilai) / 100);
    return kupon.maksimalPotongan ? Math.min(pot, kupon.maksimalPotongan) : pot;
  }
  return 0;
}

export type KuponModalProps = {
  isOpen: boolean;
  onClose: () => void;
  kuponTerpilih: Kupon | null;
  onPilihKupon: (kupon: Kupon) => void;
};

export default function KuponModal({
  isOpen,
  onClose,
  kuponTerpilih,
  onPilihKupon,
}: KuponModalProps) {
  const [kodeInput, setKodeInput] = useState("");
  const [errorText, setErrorText] = useState("");

  // Kunci scroll body saat modal terbuka
  useScrollLock(isOpen);

  // Tutup dengan tombol Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTerapkanManual = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText("");
    const clean = kodeInput.trim().toUpperCase();
    if (!clean) return;

    const match = DAFTAR_KUPON.find((k) => k.kode === clean);
    if (match) {
      onPilihKupon(match);
      setKodeInput("");
      onClose();
    } else {
      setErrorText("Kode kupon tidak valid atau sudah kadaluarsa.");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-kupon-title"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        data-lenis-prevent
        className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl transition-all duration-200 z-10 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-teal-50 text-teal-600">
              <Ticket className="size-5" />
            </div>
            <div>
              <h3 id="modal-kupon-title" className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Pilih Kupon Hemat
              </h3>
              <p className="text-xs text-slate-500">Gunakan kupon untuk hemat biaya belajar</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Input Manual Kode Kupon */}
        <div className="pt-4 pb-2">
          <form onSubmit={handleTerapkanManual} className="flex gap-2">
            <div className="relative flex-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Tag className="size-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={kodeInput}
                onChange={(e) => {
                  setKodeInput(e.target.value.toUpperCase());
                  setErrorText("");
                }}
                placeholder="Masukkan kode promo"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2.5 text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
            <button
              type="submit"
              disabled={!kodeInput.trim()}
              className="rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              style={{ backgroundColor: "#f26d0f" }}
            >
              Terapkan
            </button>
          </form>
          {errorText ? (
            <p className="mt-1.5 text-xs text-rose-600">{errorText}</p>
          ) : null}
        </div>

        {/* List Kupon Tersedia */}
        <div data-lenis-prevent className="mt-2 overflow-y-auto pr-1 space-y-3 flex-1">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            Kupon Tersedia Untuk Anda
          </p>

          {DAFTAR_KUPON.map((k) => {
            const isSelected = kuponTerpilih?.kode === k.kode;

            return (
              <div
                key={k.kode}
                className={`rounded-2xl border-2 p-4 transition-all ${
                  isSelected
                    ? "border-teal-500 bg-teal-50/40"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 rounded-md bg-teal-100/80 px-2 py-0.5 text-[11px] font-extrabold text-teal-800 tracking-wider">
                      <Tag className="size-3" />
                      {k.kode}
                    </div>
                    <h4 className="mt-1.5 text-sm font-bold text-slate-900">
                      {k.judul}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {k.deskripsi}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-2">
                      Berlaku hingga {k.berlakuHingga}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onPilihKupon(k);
                      onClose();
                    }}
                    className={`shrink-0 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-teal-600 text-white shadow-xs"
                        : "border border-teal-600 text-teal-700 hover:bg-teal-50"
                    }`}
                  >
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="size-3.5 stroke-[3]" /> Terpasang
                      </span>
                    ) : (
                      "Gunakan"
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
