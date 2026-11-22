"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/i18n/navigation";
import { saveSingleStudentGrade } from "@/app/actions/teacher";
import { Loader2, Check } from "lucide-react";

interface StudentGradeItemEditorProps {
  kelasId: number;
  pendaftaranId: number;
  penilaianId: number;
  penilaianNama: string;
  nilaiMaksimum: number;
  initialStatus: "belum_dinilai" | "dinilai" | "tidak_ikut";
  initialNilai: string;
  initialCatatan: string;
}

export function StudentGradeItemEditor({
  kelasId,
  pendaftaranId,
  penilaianId,
  nilaiMaksimum,
  initialStatus,
  initialNilai,
  initialCatatan,
}: StudentGradeItemEditorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [statusHasil, setStatusHasil] = useState<"dinilai" | "tidak_ikut">(
    initialStatus === "tidak_ikut" ? "tidak_ikut" : "dinilai"
  );
  const [nilai, setNilai] = useState(initialNilai);
  const [catatan, setCatatan] = useState(initialCatatan);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (statusHasil === "dinilai" && nilai.trim()) {
      const num = Number(nilai);
      if (isNaN(num) || num < 0 || num > nilaiMaksimum) {
        setErrorMsg(`Nilai harus berupa angka antara 0 sampai ${nilaiMaksimum}.`);
        return;
      }
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("kelas_id", String(kelasId));
      formData.append("pendaftaran_id", String(pendaftaranId));
      formData.append("penilaian_id", String(penilaianId));
      formData.append("status_hasil", statusHasil);
      if (statusHasil === "dinilai" && nilai.trim()) {
        formData.append("nilai", nilai.trim());
      }
      if (catatan.trim()) {
        formData.append("catatan", catatan.trim());
      }

      const res = await saveSingleStudentGrade({}, formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Nilai berhasil disimpan!");
        router.refresh();
        setTimeout(() => setIsOpen(false), 600);
      }
    });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
      >
        Ubah Nilai / Catatan
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSave}
      className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4 space-y-3"
    >
      {errorMsg ? (
        <p
          className="text-xs text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/40 p-2 rounded-md font-medium"
          role="alert"
        >
          {errorMsg}
        </p>
      ) : null}
      {successMsg ? (
        <p
          className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg font-medium"
          role="status"
        >
          <Check className="size-4" />
          {successMsg}
        </p>
      ) : null}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <span className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Status Keikutsertaan
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStatusHasil("dinilai")}
              className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                statusHasil === "dinilai"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              Dinilai
            </button>
            <button
              type="button"
              onClick={() => setStatusHasil("tidak_ikut")}
              className={`flex-1 py-2 px-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                statusHasil === "tidak_ikut"
                  ? "bg-rose-600 text-white border-rose-600"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
              }`}
            >
              Tidak Ikut
            </button>
          </div>
        </div>

        {statusHasil === "dinilai" ? (
          <div>
            <label
              htmlFor={`nilai-input-${penilaianId}`}
              className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Nilai
            </label>
            <input
              id={`nilai-input-${penilaianId}`}
              type="number"
              inputMode="decimal"
              min="0"
              max={nilaiMaksimum}
              step="0.5"
              value={nilai}
              onChange={(e) => setNilai(e.target.value)}
              disabled={isPending}
              className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-base sm:text-sm font-bold tabular-nums text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 transition-colors"
            />
          </div>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={`catatan-input-${penilaianId}`}
          className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          Catatan Umpan Balik Guru
        </label>
        <textarea
          id={`catatan-input-${penilaianId}`}
          rows={2}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          disabled={isPending}
          placeholder="Tuliskan catatan kemajuan atau catatan evaluasi untuk siswa ini…"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 text-base sm:text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 hover:border-slate-400 dark:hover:border-slate-600 focus-visible:outline-none focus-visible:border-blue-600 focus-visible:ring-2 focus-visible:ring-blue-600/20 resize-none transition-colors"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          disabled={isPending}
          onClick={() => setIsOpen(false)}
          className="px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 rounded-lg transition-colors cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
        >
          {isPending ? <Loader2 className="size-3 animate-spin" /> : null}
          Simpan Perubahan
        </button>
      </div>
    </form>
  );
}
