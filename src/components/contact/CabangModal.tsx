"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, MapPin, Phone, MessageCircle, ExternalLink, X } from "lucide-react";
import { DAFTAR_CABANG, type Cabang } from "@/lib/cabang";
import { useScrollLock } from "@/lib/use-scroll-lock";

export function CabangModalTrigger() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Kunci scroll body saat modal terbuka
  useScrollLock(isOpen);

  // Tutup dialog dengan tombol ESC
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const filteredCabang = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return DAFTAR_CABANG;
    return DAFTAR_CABANG.filter(
      (c) =>
        c.nama.toLowerCase().includes(q) ||
        c.wilayah.toLowerCase().includes(q) ||
        c.alamat.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mt-1 inline-flex items-center gap-1.5 font-bold text-brand hover:text-brand-dark hover:underline transition-colors text-sm cursor-pointer"
      >
        <span>lihat kantor cabang</span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cabang-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
        >
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Box */}
          <div className="relative flex max-h-[90vh] sm:max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all animate-in zoom-in-95 overflow-hidden">
            {/* Header Dialog */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-6 sm:py-4.5 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="grid size-9 place-items-center rounded-xl bg-brand-soft text-brand shrink-0">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <h3 id="modal-cabang-title" className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                    Daftar Kantor Cabang Siedu
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500">
                    Temukan lokasi bimbingan belajar Siedu terdekat di wilayah Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
                aria-label="Tutup dialog"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-6 sm:py-3.5 shrink-0">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari berdasarkan nama cabang, wilayah, atau jalan..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
                  autoFocus
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                  >
                    Hapus
                  </button>
                )}
              </div>
              <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] sm:text-xs text-slate-500">
                <span>Menampilkan {filteredCabang.length} dari {DAFTAR_CABANG.length} kantor cabang</span>
                <span className="font-medium text-slate-600">Wilayah Malang Raya & Sekitarnya</span>
              </div>
            </div>

            {/* List Cabang Scrollable */}
            <div data-lenis-prevent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-3.5 min-h-[220px] sm:min-h-[260px]">
              {filteredCabang.length > 0 ? (
                filteredCabang.map((cabang) => {
                  const waUrl = cabang.wa
                    ? `https://wa.me/${cabang.wa}?text=${encodeURIComponent(
                        `Halo Kak, saya tertarik dan ingin bertanya mengenai program bimbingan belajar Siedu di cabang ${cabang.nama}!`
                      )}`
                    : null;

                  return (
                    <div
                      key={cabang.id}
                      className="group flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4.5 shadow-2xs hover:border-brand/40 hover:shadow-sm transition-all"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-brand transition-colors">
                            {cabang.nama}
                          </h4>
                          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                            {cabang.wilayah}
                          </span>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600">
                          {cabang.alamat}
                        </p>
                        {cabang.telepon && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-0.5">
                            <Phone className="size-3 text-slate-400" />
                            <span>Telp: {cabang.telepon}</span>
                          </div>
                        )}
                      </div>

                      {/* Tombol Aksi */}
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
                        <a
                          href={cabang.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                          <ExternalLink className="size-3 text-slate-400" />
                          <span>Maps</span>
                        </a>

                        {waUrl ? (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 sm:py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-2xs"
                          >
                            <MessageCircle className="size-3 text-white" />
                            <span>WhatsApp</span>
                          </a>
                        ) : (
                          <div />
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 mb-3">
                    <Search className="size-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">
                    Cabang tidak ditemukan
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    Tidak ada cabang yang cocok dengan kata kunci &quot;{search}&quot;. Coba cari dengan nama wilayah lain.
                  </p>
                </div>
              )}
            </div>

            {/* Footer Dialog */}
            <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-500 text-center sm:text-left shrink-0">
              <span>Butuh bantuan memilih cabang terdekat?</span>
              <a
                href="https://wa.me/6283846480817?text=Halo%20Admin%20Siedu%2C%20saya%20ingin%20konsultasi%20mengenai%20cabang%20terdekat"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-brand hover:underline inline-flex items-center justify-center sm:justify-start gap-1"
              >
                Tanya Admin Pusat
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
