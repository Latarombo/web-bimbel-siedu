"use client";

import { useState, useEffect, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { savePenilaianBatch } from "@/app/actions/teacher";
import { useScrollLock } from "@/lib/use-scroll-lock";

interface QuickAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: number;
  onSuccess: () => void;
}

export function QuickAssessmentModal({
  isOpen,
  onClose,
  classId,
  onSuccess,
}: QuickAssessmentModalProps) {
  const [nama, setNama] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [nilaiMaksimum, setNilaiMaksimum] = useState("100");
  const [isDraft, setIsDraft] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      setNama("");
      setTanggal(new Date().toISOString().slice(0, 10));
      setNilaiMaksimum("100");
      setIsDraft(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setErrorMsg("Nama tugas wajib diisi.");
      return;
    }
    const maxScore = Number(nilaiMaksimum);
    if (isNaN(maxScore) || maxScore <= 0) {
      setErrorMsg("Nilai maksimum harus berupa angka lebih besar dari 0.");
      return;
    }

    setErrorMsg(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("kelas_id", String(classId));
      formData.append("nama", nama.trim());
      formData.append("tanggal", tanggal);
      formData.append("nilai_maksimum", String(maxScore));
      formData.append("aksi", isDraft ? "simpan_draf" : "terbitkan");

      const res = await savePenilaianBatch(formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        onSuccess();
        onClose();
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-assessment-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3
              id="quick-assessment-title"
              className="text-base font-semibold text-slate-950 dark:text-slate-50 tracking-tight"
            >
              Buat Tugas Baru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Tambah tugas atau kuis baru untuk kelas ini secara cepat.
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            aria-label="Tutup dialog buat tugas"
            className="grid size-8 place-items-center rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4">
            {errorMsg ? (
              <div
                role="alert"
                className="p-3 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"
              >
                {errorMsg}
              </div>
            ) : null}

            {/* Nama Tugas */}
            <div className="space-y-1.5">
              <label
                htmlFor="assessment-nama"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Nama Tugas / Asesmen <span className="text-red-500">*</span>
              </label>
              <input
                id="assessment-nama"
                type="text"
                required
                placeholder="Contoh: Kuis Aljabar Bab 2, Tugas Proyek..."
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                disabled={isPending}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-600 focus:outline-hidden"
              />
            </div>

            {/* Tanggal & Nilai Maksimum */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label
                  htmlFor="assessment-tanggal"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Tanggal Pelaksanaan <span className="text-red-500">*</span>
                </label>
                <input
                  id="assessment-tanggal"
                  type="date"
                  required
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="assessment-max"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Nilai Maksimum
                </label>
                <input
                  id="assessment-max"
                  type="number"
                  min="1"
                  max="1000"
                  value={nilaiMaksimum}
                  onChange={(e) => setNilaiMaksimum(e.target.value)}
                  disabled={isPending}
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs sm:text-sm text-slate-900 dark:text-slate-100 tabular-nums focus:border-blue-600 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Status Publikasi */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDraft}
                  onChange={(e) => setIsDraft(e.target.checked)}
                  disabled={isPending}
                  className="size-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300">
                  Simpan sebagai <strong>Draf</strong> (belum dapat dilihat oleh orang tua / siswa)
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-md transition-colors disabled:opacity-40 cursor-pointer"
            >
              <span>Batal</span>
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              <span>{isPending ? "Menyimpan..." : "Buat Tugas"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
