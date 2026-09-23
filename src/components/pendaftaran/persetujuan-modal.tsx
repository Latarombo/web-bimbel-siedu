"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X, Check, Loader2 } from "lucide-react";
import { useScrollLock } from "@/lib/use-scroll-lock";

export type PersetujuanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
  namaAnak?: string;
};

export default function PersetujuanModal({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting = false,
  namaAnak,
}: PersetujuanModalProps) {
  const tCommon = useTranslations("common");
  const [checkedPribadi, setCheckedPribadi] = useState(false);
  const [checkedSyarat, setCheckedSyarat] = useState(false);

  // Kunci scroll body saat modal terbuka
  useScrollLock(isOpen);

  // Reset checkboxes when modal opens
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCheckedPribadi(false);
      setCheckedSyarat(false);
    }
  }

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const canProceed = checkedPribadi && checkedSyarat && !isSubmitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-persetujuan-title"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
        aria-hidden="true"
      />

      {/* Modal Dialog Content: Bottom Sheet di HP, Floating Popover di Desktop */}
      <div
        data-lenis-prevent
        className="relative w-full max-h-[92vh] overflow-y-auto rounded-t-[28px] rounded-b-none sm:rounded-3xl sm:max-w-lg bg-white p-5 pb-8 sm:p-7 shadow-2xl border-t sm:border border-slate-100/80 transition-all z-10 animate-in slide-in-from-bottom duration-300 ease-out sm:slide-in-from-bottom-0 sm:zoom-in-95 sm:fade-in-0 sm:duration-200"
      >
        {/* Drag handle pill bar untuk Bottom Sheet di Mobile */}
        <div className="mx-auto -mt-1 mb-3.5 h-1.5 w-12 rounded-full bg-slate-300 sm:hidden" aria-hidden="true" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 sm:pb-4 border-b border-slate-100">
          <div>
            <h3 id="modal-persetujuan-title" className="text-base sm:text-lg font-bold text-slate-900">
              Persetujuan Pembelian
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
              Konfirmasi komitmen bimbingan belajar siswa
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label={tCommon("closeDialog")}
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="py-5 space-y-4">
          {/* Checkbox 1: Izin Pemrosesan Data Pribadi Anak */}
          <label className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer select-none">
            <div className="relative flex items-center mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={checkedPribadi}
                onChange={(e) => setCheckedPribadi(e.target.checked)}
                disabled={isSubmitting}
                className="sr-only"
              />
              <div
                className={`grid size-5.5 place-items-center rounded-lg border-2 transition-all ${
                  checkedPribadi
                    ? "border-[#00a299] bg-[#00a299] text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {checkedPribadi && <Check className="size-3.5 stroke-[3]" />}
              </div>
            </div>
            <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Saya adalah orang tua atau wali sah{namaAnak ? ` dari ${namaAnak}` : ""}, memberikan persetujuan atas pemrosesan data pribadi anak saya sesuai dengan{" "}
              <Link
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-2 inline-flex items-baseline"
              >
                Kebijakan Privasi
              </Link>.
            </span>
          </label>

          {/* Checkbox 2: Persetujuan Pembelian & Ketentuan */}
          <label className="flex items-start gap-3.5 p-3 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer select-none">
            <div className="relative flex items-center mt-0.5 shrink-0">
              <input
                type="checkbox"
                checked={checkedSyarat}
                onChange={(e) => setCheckedSyarat(e.target.checked)}
                disabled={isSubmitting}
                className="sr-only"
              />
              <div
                className={`grid size-5.5 place-items-center rounded-lg border-2 transition-all ${
                  checkedSyarat
                    ? "border-[#00a299] bg-[#00a299] text-white"
                    : "border-slate-300 bg-white"
                }`}
              >
                {checkedSyarat && <Check className="size-3.5 stroke-[3]" />}
              </div>
            </div>
            <span className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              Saya selaku orang tua/wali menyatakan telah membaca, memahami, dan menyetujui pembelian paket bimbingan belajar ini atas nama anak saya, sesuai{" "}
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-teal-700 hover:text-teal-800 underline underline-offset-2 inline-flex items-baseline"
              >
                Kebijakan Penukaran & Syarat Ketentuan
              </Link>.
            </span>
          </label>
        </div>

        {/* Footer CTA Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canProceed}
            className="w-full flex min-h-12 items-center justify-center rounded-2xl py-3.5 text-base font-bold text-white shadow-md transition-all active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            style={{ backgroundColor: "#f26d0f" }}
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="size-5 animate-spin" />
                Memproses Pendaftaran...
              </span>
            ) : (
              "Lanjut"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
