"use client";

import { useState, useTransition } from "react";
import { Link, useRouter } from "@/i18n/navigation";
import { ArrowLeft, Printer, Check, Loader2 } from "lucide-react";
import { simpanRaporSiswa, tarikRaporSiswa } from "@/app/actions/teacher";
import type { RaporDetailData } from "@/lib/rapor";

interface ReportEditorViewProps {
  data: RaporDetailData;
  classId: number;
}

export function ReportEditorView({ data, classId }: ReportEditorViewProps) {
  const router = useRouter();
  const [catatan, setCatatan] = useState(data.catatanRapor ?? "");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = (terbitkan: boolean) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await simpanRaporSiswa({
        pendaftaranId: data.pendaftaranId,
        catatanRapor: catatan,
        terbitkan,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(
          terbitkan
            ? "Rapor berhasil diterbitkan ke orang tua!"
            : "Draf catatan rapor berhasil disimpan.",
        );
        router.refresh();
      }
    });
  };

  const handleUnpublish = () => {
    if (!window.confirm("Tarik kembali rapor ini menjadi draf? Orang tua tidak akan dapat melihatnya hingga diterbitkan ulang.")) {
      return;
    }
    setErrorMsg(null);
    setSuccessMsg(null);
    startTransition(async () => {
      const res = await tarikRaporSiswa({
        pendaftaranId: data.pendaftaranId,
      });

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg("Rapor berhasil ditarik menjadi draf.");
        router.refresh();
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation & Actions (Hidden during print) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <Link
            href={`/teacher/classes/${classId}/reports`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Kembali ke Daftar Rapor Kelas</span>
          </Link>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            Rapor Belajar Siswa
          </h1>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Evaluasi akhir semester untuk {data.namaSiswa} ({data.namaMapel})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="size-4" />
            <span>Cetak / Unduh PDF</span>
          </button>

          {data.isDiterbitkan ? (
            <button
              type="button"
              disabled={isPending}
              onClick={handleUnpublish}
              className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <span>Tarik Jadi Draf</span>
            </button>
          ) : null}

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSave(false)}
            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Menyimpan..." : "Simpan Draf"}
          </button>

          <button
            type="button"
            disabled={isPending}
            onClick={() => handleSave(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
            <span>{data.isDiterbitkan ? "Perbarui & Terbitkan" : "Terbitkan ke Orang Tua"}</span>
          </button>
        </div>
      </div>

      {/* Alert Banners (Hidden during print) */}
      {errorMsg ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 print:hidden">
          {errorMsg}
        </div>
      ) : null}
      {successMsg ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300 print:hidden">
          {successMsg}
        </div>
      ) : null}

      {/* Status Bar (Hidden during print) */}
      <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 p-4 print:hidden">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Status Rapor:
          </span>
          {data.isDiterbitkan ? (
            <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <span className="size-2 rounded-full bg-emerald-500" />
              Diterbitkan ke Orang Tua
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
              <span className="size-2 rounded-full bg-amber-500" />
              Draf Guru (Belum Terbit)
            </span>
          )}
        </div>
        {data.raporDiterbitkanPada ? (
          <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
            Diterbitkan: {new Date(data.raporDiterbitkanPada).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        ) : null}
      </div>

      {/* DOCUMENT CARD (Printed Area) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 shadow-sm print:shadow-none print:border-none print:p-0">
        {/* Kop Resmi Bimbel / Institusi */}
        <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-5 text-center">
          <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-slate-950 dark:text-slate-50">
            Siedu Learning Hub
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Laporan Capaian Belajar & Perkembangan Siswa Semester
          </p>
          <span className="inline-block mt-2 font-mono text-2xs uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Periode: {data.periodeNama} ({data.tanggalMulai} s.d. {data.tanggalSelesai})
          </span>
        </div>

        {/* Identitas Siswa & Kelas */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 p-4 text-xs">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-28 text-slate-500 dark:text-slate-400">Nama Siswa:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{data.namaSiswa}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500 dark:text-slate-400">Jenjang / Tingkat:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {data.jenjang} {data.tingkat ? `· ${data.tingkat}` : ""}
              </span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500 dark:text-slate-400">Wali Murid:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{data.namaWali}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-28 text-slate-500 dark:text-slate-400">Mata Pelajaran:</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{data.namaMapel}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500 dark:text-slate-400">Guru Pengampu:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{data.namaGuru}</span>
            </div>
            <div className="flex">
              <span className="w-28 text-slate-500 dark:text-slate-400">No. Pendaftaran:</span>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums">
                REG#{data.pendaftaranId}
              </span>
            </div>
          </div>
        </div>

        {/* Bagian 1: Ringkasan Presensi Terhitung Otomatis */}
        <div className="mt-8 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            A. Rekapitulasi Presensi Belajar
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 text-left">Total Sesi Pertemuan</th>
                  <th className="py-2.5 px-4 text-center">Hadir</th>
                  <th className="py-2.5 px-4 text-center">Izin</th>
                  <th className="py-2.5 px-4 text-center">Sakit</th>
                  <th className="py-2.5 px-4 text-center">Alpa</th>
                  <th className="py-2.5 px-4 text-right">Persentase Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td className="py-2.5 px-4 font-semibold tabular-nums">{data.totalSesi} Sesi</td>
                  <td className="py-2.5 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {data.hadir}
                  </td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-700 dark:text-slate-300">{data.izin}</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-slate-700 dark:text-slate-300">{data.sakit}</td>
                  <td className="py-2.5 px-4 text-center tabular-nums text-rose-600 dark:text-rose-400">{data.alpa}</td>
                  <td className="py-2.5 px-4 text-right font-bold text-slate-950 dark:text-slate-50 tabular-nums text-sm">
                    {data.persenKehadiran}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Bagian 2: Hasil Tugas & Asesmen Terhitung Otomatis */}
        <div className="mt-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              B. Daftar Tugas & Penilaian Akademik
            </h3>
            <div className="text-xs text-slate-600 dark:text-slate-400">
              Nilai Rata-rata Terhitung:{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums text-sm">
                {data.rataRataNilai != null ? `${data.rataRataNilai} / 100` : "—"}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-4 text-center w-12">#</th>
                  <th className="py-2.5 px-4 text-left">Nama Tugas / Kuis</th>
                  <th className="py-2.5 px-4 text-left">Tanggal</th>
                  <th className="py-2.5 px-4 text-right">Nilai Maks.</th>
                  <th className="py-2.5 px-4 text-right">Skor Siswa</th>
                  <th className="py-2.5 px-4 text-left">Catatan Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.assessments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 dark:text-slate-400">
                      Belum ada tugas atau asesmen yang dicatat pada kelas ini.
                    </td>
                  </tr>
                ) : (
                  data.assessments.map((a, idx) => (
                    <tr key={a.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-4 text-center font-medium text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        {a.nama}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 tabular-nums">
                        {a.tanggal}
                      </td>
                      <td className="py-2.5 px-4 text-right text-slate-500 tabular-nums">
                        {a.nilaiMaksimum}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums text-sm">
                        {a.nilai != null ? a.nilai : a.statusHasil === "tidak_ikut" ? "Tidak Ikut" : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400 italic">
                        {a.catatanSiswa || a.catatanTugas || "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bagian 3: Nilai Subjektif / Catatan Evaluasi Guru */}
        <div className="mt-8 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            C. Catatan Perkembangan & Nilai Subjektif Guru
          </h3>

          {/* Form input (Hidden during print) */}
          <div className="print:hidden space-y-2">
            <textarea
              rows={4}
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              disabled={isPending}
              placeholder="Tuliskan evaluasi subjektif mengenai sikap, keaktifan, kemajuan belajar, dan saran peningkatan untuk siswa ini..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 transition-colors resize-y leading-relaxed"
            />
            <p className="text-right text-2xs text-slate-400 tabular-nums">
              {catatan.length} / 2000 karakter
            </p>
          </div>

          {/* Cetak Display (Hanya tampil saat dicetak atau pratinjau) */}
          <div className="hidden print:block rounded-lg border border-slate-300 p-4 text-xs leading-relaxed text-slate-800">
            {catatan.trim() ? (
              <p className="whitespace-pre-line">{catatan}</p>
            ) : (
              <p className="italic text-slate-500">Siswa telah menyelesaikan pembelajaran semester ini dengan baik.</p>
            )}
          </div>
        </div>

        {/* Bagian 4: Lembar Tanda Tangan */}
        <div className="mt-14 hidden print:grid grid-cols-2 text-center text-xs">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-semibold text-slate-900 mt-0.5">Orang Tua / Wali Murid</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-900">{data.namaWali}</p>
          </div>
          <div>
            <p className="text-slate-600">Diberikan di Tempat,</p>
            <p className="font-semibold text-slate-900 mt-0.5">Guru Pengajar</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-900">{data.namaGuru}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
