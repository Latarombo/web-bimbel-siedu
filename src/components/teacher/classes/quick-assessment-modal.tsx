"use client";

import { useState, useTransition } from "react";
import { X, Loader2 } from "lucide-react";
import { savePenilaianBatch } from "@/app/actions/teacher";
import { NativeDialog } from "@/components/common/native-dialog";
import { DatePicker } from "@/components/ui/date-picker";

export interface AssessmentInitialData {
  id: number;
  nama: string;
  tanggal: string;
  nilaiMaksimum: number;
  sesiPertemuanId?: number | null;
  draf: boolean;
  catatan?: string | null;
}

interface QuickAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId?: number;
  classes?: { id: number; nama: string; jenjang: string }[];
  sessions?: { id: number; label: string }[];
  defaultSesiId?: number;
  initialData?: AssessmentInitialData | null;
  onSuccess: () => void;
}

export function QuickAssessmentModal({
  isOpen,
  onClose,
  classId,
  classes,
  sessions = [],
  defaultSesiId,
  initialData,
  onSuccess,
}: QuickAssessmentModalProps) {
  const [selectedClassId, setSelectedClassId] = useState<number>(() => {
    return classId ?? (classes?.[0]?.id ?? 0);
  });
  const [nama, setNama] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [nilaiMaksimum, setNilaiMaksimum] = useState("100");
  const [catatan, setCatatan] = useState("");
  const [isDraft, setIsDraft] = useState(false);
  const [sesiId, setSesiId] = useState<number | null>(defaultSesiId ?? null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isEditMode = Boolean(initialData?.id);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      if (initialData) {
        setNama(initialData.nama);
        setTanggal(initialData.tanggal);
        setNilaiMaksimum(String(initialData.nilaiMaksimum));
        setCatatan(initialData.catatan ?? "");
        setIsDraft(initialData.draf);
        setSesiId(initialData.sesiPertemuanId ?? null);
      } else {
        setNama("");
        setTanggal(new Date().toISOString().slice(0, 10));
        setNilaiMaksimum("100");
        setCatatan("");
        setIsDraft(false);
        setSesiId(defaultSesiId ?? null);
      }
      setErrorMsg(null);
      if (classId) {
        setSelectedClassId(classId);
      } else if (classes?.[0]?.id) {
        setSelectedClassId(classes[0].id);
      }
    }
  }

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveClassId = classId ?? selectedClassId;
    if (!effectiveClassId) {
      setErrorMsg("Pilih kelas terlebih dahulu.");
      return;
    }
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
      formData.append("kelas_id", String(effectiveClassId));
      if (initialData?.id) {
        formData.append("penilaian_id", String(initialData.id));
      }
      if (sesiId) {
        formData.append("sesi_id", String(sesiId));
      }
      formData.append("nama", nama.trim());
      formData.append("tanggal", tanggal);
      formData.append("catatan_tugas", catatan.trim());
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
    <NativeDialog
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="quick-assessment-title"
      preventClose={isPending}
    >
      <div className="w-full max-w-lg rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3
              id="quick-assessment-title"
              className="text-base font-semibold text-slate-950 dark:text-slate-50 tracking-tight"
            >
              {isEditMode ? "Ubah Tugas / Asesmen" : "Buat Tugas Baru"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isEditMode
                ? "Perbarui rincian, sesi pertemuan, atau catatan tugas ini."
                : "Tambah tugas atau kuis baru untuk kelas ini secara cepat."}
            </p>
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            aria-label="Tutup dialog tugas"
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

            {/* Pilihan Kelas (Jika classId tidak dipatok) */}
            {!classId && classes && classes.length > 0 ? (
              <div className="space-y-2">
                <label
                  htmlFor="assessment-class-select"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Kelas / Rombongan Belajar <span className="text-red-500">*</span>
                </label>
                <select
                  id="assessment-class-select"
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(Number(e.target.value))}
                  disabled={isPending}
                  className="w-full h-11 sm:h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-base sm:text-sm text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nama} · {c.jenjang}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            {/* Nama Tugas */}
            <div className="space-y-2">
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
                maxLength={100}
                placeholder="Contoh: Kuis Aljabar Bab 2, Tugas Proyek…"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                disabled={isPending}
                className="w-full h-11 sm:h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
              />
            </div>

            {/* Tanggal Pelaksanaan */}
            <div className="space-y-2">
              <label
                htmlFor="assessment-tanggal"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Tanggal Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <DatePicker
                id="assessment-tanggal"
                value={tanggal}
                onChange={setTanggal}
                disabled={isPending}
                required
              />
            </div>

            {/* Sesi Pertemuan Terkait (Opsional) */}
            {sessions.length > 0 && (
              <div className="space-y-2">
                <label
                  htmlFor="assessment-sesi"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Terkait Sesi Pertemuan (Opsional)
                </label>
                <select
                  id="assessment-sesi"
                  value={sesiId ?? ""}
                  onChange={(e) => setSesiId(e.target.value ? Number(e.target.value) : null)}
                  disabled={isPending}
                  className="w-full h-11 sm:h-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-base sm:text-sm text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-500 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors cursor-pointer"
                >
                  <option value="">Umum (Tanpa Sesi Tertentu)</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Catatan / Instruksi Tugas (Opsional) */}
            <div className="space-y-2">
              <label
                htmlFor="assessment-catatan"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Catatan / Instruksi Tugas (Opsional)
              </label>
              <textarea
                id="assessment-catatan"
                rows={3}
                placeholder="Catatan pengerjaan, bab materi, atau instruksi untuk siswa..."
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                disabled={isPending}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 p-3 text-base sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors resize-y"
              />
            </div>

            {/* Status Publikasi */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
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
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
            >
              <span>Batal</span>
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs sm:text-sm font-medium text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
              <span>{isPending ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Buat Tugas"}</span>
            </button>
          </div>
        </form>
      </div>
    </NativeDialog>
  );
}
