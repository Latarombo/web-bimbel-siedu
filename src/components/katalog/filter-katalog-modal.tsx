"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";

export type FilterKatalogModalProps = {
  isOpen: boolean;
  onClose: () => void;
  currentJenjang: string;
  currentTingkat?: string;
  currentQ?: string;
  currentSort?: string;
  translations: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    chooseClass: string;
    applyFilterSelection: string;
    resetFilter: string;
    allLevelsFull: string;
  };
};

type JenjangKey = "TK" | "SD" | "SMP" | "SMA" | "Semua";

const JENJANG_BUTTONS: Array<{ id: JenjangKey; label: string; badge?: string }> = [
  { id: "TK", label: "TK" },
  { id: "SD", label: "SD" },
  { id: "SMP", label: "SMP" },
  { id: "SMA", label: "SMA" },
  { id: "Semua", label: "Semua Jenjang" },
];

const KELAS_PER_JENJANG: Record<JenjangKey, Array<{ value: string; label: string }>> = {
  TK: [
    { value: "TK A", label: "TK A" },
    { value: "TK B", label: "TK B" },
    { value: "Semua", label: "Semua Kelas TK" },
  ],
  SD: [
    { value: "Kelas 1", label: "Kelas 1" },
    { value: "Kelas 2", label: "Kelas 2" },
    { value: "Kelas 3", label: "Kelas 3" },
    { value: "Kelas 4", label: "Kelas 4" },
    { value: "Kelas 5", label: "Kelas 5" },
    { value: "Kelas 6", label: "Kelas 6" },
    { value: "Semua", label: "Semua Kelas SD" },
  ],
  SMP: [
    { value: "Kelas 7", label: "Kelas 7" },
    { value: "Kelas 8", label: "Kelas 8" },
    { value: "Kelas 9", label: "Kelas 9" },
    { value: "Semua", label: "Semua Kelas SMP" },
  ],
  SMA: [
    { value: "Kelas 10", label: "Kelas 10" },
    { value: "Kelas 11", label: "Kelas 11" },
    { value: "Kelas 12", label: "Kelas 12" },
    { value: "Semua", label: "Semua Kelas SMA" },
  ],
  Semua: [
    { value: "Semua", label: "Semua Kelas & Jenjang" },
  ],
};

export function FilterKatalogModal({
  isOpen,
  onClose,
  currentJenjang,
  currentTingkat,
  currentQ = "",
  currentSort = "terbaru",
  translations,
}: FilterKatalogModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedJenjang, setSelectedJenjang] = useState<JenjangKey>(
    currentJenjang === "TK" || currentJenjang === "SD" || currentJenjang === "SMP" || currentJenjang === "SMA"
      ? currentJenjang
      : "Semua",
  );
  const [selectedTingkat, setSelectedTingkat] = useState<string>(
    currentTingkat || "Semua",
  );

  // Sinkronisasi state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const validJenjang =
        currentJenjang === "TK" || currentJenjang === "SD" || currentJenjang === "SMP" || currentJenjang === "SMA"
          ? currentJenjang
          : "Semua";
      setSelectedJenjang(validJenjang);
      setSelectedTingkat(currentTingkat || "Semua");
    }
  }, [isOpen, currentJenjang, currentTingkat]);

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

  function handleSelectJenjang(jenjang: JenjangKey) {
    setSelectedJenjang(jenjang);
    setSelectedTingkat("Semua");
  }

  function handleApplyWith(
    targetJenjang: JenjangKey,
    targetTingkat: string,
  ) {
    const params = new URLSearchParams();
    if (currentQ) params.set("q", currentQ);
    if (targetJenjang !== "Semua") params.set("jenjang", targetJenjang);
    if (targetTingkat && targetTingkat !== "Semua") params.set("tingkat", targetTingkat);
    if (currentSort !== "terbaru") params.set("sort", currentSort);

    startTransition(() => {
      router.push(`/classes${params.size ? `?${params.toString()}` : ""}`);
      onClose();
    });
  }

  function handleApply() {
    handleApplyWith(selectedJenjang, selectedTingkat);
  }

  function handleClassClick(val: string) {
    setSelectedTingkat(val);
    handleApplyWith(selectedJenjang, val);
  }

  function handleReset() {
    setSelectedJenjang("Semua");
    setSelectedTingkat("Semua");
    startTransition(() => {
      router.push("/classes");
      onClose();
    });
  }

  const kelasOptions = KELAS_PER_JENJANG[selectedJenjang] ?? KELAS_PER_JENJANG.Semua;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="filter-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl transition-all border border-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Tombol Tutup Silang di pojok kanan atas */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup dialog"
          className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Header Dialog */}
        <div className="pr-6">
          <h2
            id="filter-dialog-title"
            className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
          >
            {translations.welcomeTitle}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {translations.welcomeSubtitle}
          </p>
        </div>

        {/* Bagian 1: Pilihan Jenjang */}
        <div className="mt-5">
          <div className="grid grid-cols-2 gap-2.5">
            {JENJANG_BUTTONS.map((item) => {
              const isActive = selectedJenjang === item.id;
              const isSemua = item.id === "Semua";
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectJenjang(item.id)}
                  className={`rounded-lg py-2.5 px-4 text-center text-sm font-semibold transition-colors cursor-pointer ${
                    isSemua ? "col-span-2" : ""
                  } ${
                    isActive
                      ? "border-2 border-brand bg-brand-soft text-brand font-bold"
                      : "border border-border bg-white text-foreground hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bagian 2: Pilih Kelas */}
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {translations.chooseClass}
          </h3>

          <div className="grid grid-cols-2 gap-2">
            {kelasOptions.map((opt) => {
              const isClassActive = selectedTingkat === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleClassClick(opt.value)}
                  className={`rounded-lg py-2 px-3 text-center text-sm font-medium transition-colors cursor-pointer ${
                    isClassActive
                      ? "border-2 border-brand bg-brand-soft text-brand font-bold"
                      : "border border-border bg-white text-body hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bagian 3: Tombol Aksi Bawah */}
        <div className="mt-6 pt-4 border-t border-border flex items-center gap-2.5">
          <button
            type="button"
            disabled={isPending}
            onClick={handleApply}
            className="flex-1 rounded-lg bg-brand hover:bg-brand-strong text-white py-2.5 px-4 font-bold text-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isPending ? "Memuat..." : translations.applyFilterSelection}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-border py-2.5 px-4 text-xs font-semibold text-muted hover:bg-slate-50 hover:text-foreground transition-colors cursor-pointer"
          >
            {translations.resetFilter}
          </button>
        </div>
      </div>
    </div>
  );
}
