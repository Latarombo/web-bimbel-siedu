"use client";

import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { useScrollLock } from "@/lib/use-scroll-lock";

export type ExportType = "summary" | "attendance" | "grades";

interface ExportClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  initialType?: ExportType;
}

const EXPORT_OPTIONS: {
  id: ExportType;
  title: string;
  description: string;
}[] = [
  {
    id: "summary",
    title: "Rekap Ringkasan Kelas",
    description: "Rata-rata nilai, persentase kehadiran, dan ringkasan kuota rombel.",
  },
  {
    id: "attendance",
    title: "Rekap Riwayat Presensi",
    description: "Log kehadiran per sesi pertemuan beserta status dan catatan absensi.",
  },
  {
    id: "grades",
    title: "Rekap Nilai & Asesmen",
    description: "Seluruh entri nilai tugas, asesmen, dan progres belajar siswa.",
  },
];

export function ExportClassModal({
  isOpen,
  onClose,
  classId,
  initialType = "summary",
}: ExportClassModalProps) {
  const [selectedType, setSelectedType] = useState<ExportType>(initialType);
  const modalRef = useRef<HTMLDivElement>(null);

  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType);
    }
  }, [isOpen, initialType]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const downloadUrl = `/api/export/class/${classId}?type=${selectedType}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3
              id="export-modal-title"
              className="text-base font-semibold text-slate-950 dark:text-slate-50 tracking-tight"
            >
              Ekspor Data Kelas
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Unduh data rombongan belajar dalam format spreadsheet (CSV).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog ekspor"
            className="grid size-8 place-items-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body: Radio options */}
        <div className="p-5 space-y-2.5">
          {EXPORT_OPTIONS.map((opt) => {
            const isSelected = selectedType === opt.id;
            return (
              <label
                key={opt.id}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected
                    ? "border-blue-600 bg-blue-50/40 dark:border-blue-500 dark:bg-blue-950/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                }`}
              >
                <input
                  type="radio"
                  name="exportType"
                  value={opt.id}
                  checked={isSelected}
                  onChange={() => setSelectedType(opt.id)}
                  className="mt-0.5 size-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                    {opt.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {opt.description}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-md transition-colors cursor-pointer"
          >
            <span>Batal</span>
          </button>

          <a
            href={downloadUrl}
            download
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors cursor-pointer"
          >
            <span>Unduh Berkas (.csv)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
