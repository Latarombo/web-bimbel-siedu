"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import type { KelasKatalog } from "@/lib/kelas";

type Props = {
  currentClassId: number;
  currentJenjang: string;
  currentTingkat?: string | null;
  currentMapel?: string;
  classes: KelasKatalog[];
};

const JENJANG_BUTTONS = [
  { id: "TK", label: "TK" },
  { id: "SD", label: "SD" },
  { id: "SMP", label: "SMP" },
  { id: "SMA", label: "SMA" },
] as const;

const KELAS_PER_JENJANG: Record<string, Array<{ value: string; label: string }>> = {
  SD: [
    { value: "Kelas 1", label: "Kelas 1" },
    { value: "Kelas 2", label: "Kelas 2" },
    { value: "Kelas 3", label: "Kelas 3" },
    { value: "Kelas 4", label: "Kelas 4" },
    { value: "Kelas 5", label: "Kelas 5" },
    { value: "Kelas 6", label: "Kelas 6" },
  ],
  SMP: [
    { value: "Kelas 1", label: "Kelas 1" },
    { value: "Kelas 2", label: "Kelas 2" },
    { value: "Kelas 3", label: "Kelas 3" },
  ],
  SMA: [
    { value: "Kelas 1", label: "Kelas 1" },
    { value: "Kelas 2", label: "Kelas 2" },
    { value: "Kelas 3", label: "Kelas 3" },
  ],
  TK: [
    { value: "TK A", label: "TK A" },
    { value: "TK B", label: "TK B" },
  ],
};

function matchesTingkat(cTingkat: string | null | undefined, targetTingkat: string, jenjang: string): boolean {
  if (!cTingkat) return false;
  const t = cTingkat.trim().toLowerCase();
  const target = targetTingkat.trim().toLowerCase();
  if (t === target) return true;

  // SMP: Kelas 1 <-> Kelas 7, Kelas 2 <-> Kelas 8, Kelas 3 <-> Kelas 9
  if (jenjang.toUpperCase() === "SMP") {
    if (target === "kelas 1" && (t === "kelas 7" || t.includes("7"))) return true;
    if (target === "kelas 2" && (t === "kelas 8" || t.includes("8"))) return true;
    if (target === "kelas 3" && (t === "kelas 9" || t.includes("9"))) return true;
  }

  // SMA: Kelas 1 <-> Kelas 10, Kelas 2 <-> Kelas 11, Kelas 3 <-> Kelas 12
  if (jenjang.toUpperCase() === "SMA") {
    if (target === "kelas 1" && (t === "kelas 10" || t.includes("10"))) return true;
    if (target === "kelas 2" && (t === "kelas 11" || t.includes("11"))) return true;
    if (target === "kelas 3" && (t === "kelas 12" || t.includes("12"))) return true;
  }

  return false;
}

function resolveInitialTingkat(currentTingkat: string | null | undefined, jenjang: string): string {
  const options = KELAS_PER_JENJANG[jenjang.toUpperCase()] || KELAS_PER_JENJANG.SD;
  if (!currentTingkat) return options[0]?.value ?? "Kelas 1";
  const found = options.find((opt) => matchesTingkat(currentTingkat, opt.value, jenjang));
  return found ? found.value : options[0]?.value ?? "Kelas 1";
}

export function ModalPilihKelas({
  currentClassId,
  currentJenjang,
  currentTingkat,
  currentMapel,
  classes,
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedJenjang, setSelectedJenjang] = useState<string>(currentJenjang || "SD");
  const [selectedTingkat, setSelectedTingkat] = useState<string>(() =>
    resolveInitialTingkat(currentTingkat, currentJenjang)
  );

  // Sinkronisasi jenjang & tingkat saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const validJenjang = currentJenjang || "SD";
      setSelectedJenjang(validJenjang);
      setSelectedTingkat(resolveInitialTingkat(currentTingkat, validJenjang));
    }
  }, [isOpen, currentJenjang, currentTingkat]);

  // Tutup dengan tombol Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  const normalizedJenjang = selectedJenjang.toUpperCase();
  const kelasOptions = KELAS_PER_JENJANG[normalizedJenjang] || KELAS_PER_JENJANG.SD;

  function findTargetClass(jenjang: string, tingkat: string) {
    // 1. Cari kelas dengan mata pelajaran yang sama
    const sameMapel = classes.find(
      (c) =>
        c.jenjang.toUpperCase() === jenjang.toUpperCase() &&
        matchesTingkat(c.tingkat, tingkat, jenjang) &&
        (!currentMapel || c.mapel.toLowerCase() === currentMapel.toLowerCase())
    );
    if (sameMapel) return sameMapel;

    // 2. Cari kelas apapun di tingkat tersebut
    return classes.find(
      (c) =>
        c.jenjang.toUpperCase() === jenjang.toUpperCase() &&
        matchesTingkat(c.tingkat, tingkat, jenjang)
    );
  }

  function handleSelectJenjang(jenjangId: string) {
    setSelectedJenjang(jenjangId);
    const opts = KELAS_PER_JENJANG[jenjangId.toUpperCase()] || [];
    if (opts.length > 0) {
      setSelectedTingkat(opts[0].value);
    }
  }

  function handleClassClick(tingkatVal: string) {
    setSelectedTingkat(tingkatVal);
    const target = findTargetClass(selectedJenjang, tingkatVal);
    if (target) {
      setIsOpen(false);
      if (target.id !== currentClassId) {
        router.push(`/classes/${target.id}`);
      }
    }
  }

  function handleApply() {
    const target = findTargetClass(selectedJenjang, selectedTingkat);
    if (target) {
      setIsOpen(false);
      if (target.id !== currentClassId) {
        router.push(`/classes/${target.id}`);
      }
    } else {
      // Fallback: kelas apapun pada jenjang ini
      const fallback = classes.find(
        (c) => c.jenjang.toUpperCase() === selectedJenjang.toUpperCase()
      );
      if (fallback) {
        setIsOpen(false);
        if (fallback.id !== currentClassId) {
          router.push(`/classes/${fallback.id}`);
        }
      }
    }
  }

  return (
    <>
      {/* Tombol filter di seberang judul Detail Pelaksanaan Kelas */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand hover:text-brand hover:bg-blue-50/40 shadow-2xs transition-colors cursor-pointer"
        aria-label="Ubah kelas yang dipilih"
      >
        <SlidersHorizontal className="size-3.5 text-slate-500" aria-hidden="true" />
        <span>Ubah Kelas</span>
      </button>

      {/* Modal Dialog Berdesain Mirip Filter Tab Katalog */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="filter-detail-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl transition-all border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Tombol Tutup Silang di pojok kanan atas */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Tutup dialog"
              className="absolute top-5 right-5 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="size-5" />
            </button>

            {/* Header Dialog */}
            <div className="pr-6">
              <h2
                id="filter-detail-dialog-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
              >
                Pilih Jenjang & Kelas
              </h2>
              <p className="mt-1 text-sm text-muted">
                Pilih jenjang dan tingkat kelas yang diinginkan
              </p>
            </div>

            {/* Bagian 1: Pilihan Jenjang (Sesuai Gaya Katalog) */}
            <div className="mt-5">
              <div className="grid grid-cols-2 gap-2.5">
                {JENJANG_BUTTONS.map((item) => {
                  const isActive = selectedJenjang.toUpperCase() === item.id.toUpperCase();
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectJenjang(item.id)}
                      className={`rounded-lg py-2.5 px-4 text-center text-sm font-semibold transition-colors cursor-pointer ${
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

            {/* Bagian 2: Pilih Kelas (Sesuai Gaya Katalog) */}
            <div className="mt-6 pt-4 border-t border-border">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Pilih kelas
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {kelasOptions.map((opt) => {
                  const target = findTargetClass(selectedJenjang, opt.value);
                  const isAvailable = Boolean(target);
                  const isCurrent = isAvailable && target?.id === currentClassId;
                  const isSelected = selectedTingkat === opt.value || isCurrent;

                  if (!isAvailable) {
                    return (
                      <div
                        key={opt.value}
                        className="rounded-lg py-2 px-3 text-center text-sm font-medium border border-dashed border-border/70 bg-slate-50 text-slate-300 select-none cursor-not-allowed flex items-center justify-between"
                      >
                        <span>{opt.label}</span>
                        <span className="text-[10px] text-slate-400">Belum ada</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleClassClick(opt.value)}
                      className={`rounded-lg py-2 px-3 text-center text-sm font-medium transition-colors cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "border-2 border-brand bg-brand-soft text-brand font-bold"
                          : "border border-border bg-white text-body hover:bg-slate-50"
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isCurrent ? (
                        <span className="text-[10px] text-brand font-bold">Saat Ini</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bagian 3: Tombol Aksi Bawah */}
            <div className="mt-6 pt-4 border-t border-border flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 rounded-lg bg-brand hover:bg-brand-strong text-white py-2.5 px-4 font-bold text-sm transition-colors cursor-pointer"
              >
                Terapkan Pilihan
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg border border-border py-2.5 px-4 text-xs font-semibold text-muted hover:bg-slate-50 hover:text-foreground transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
