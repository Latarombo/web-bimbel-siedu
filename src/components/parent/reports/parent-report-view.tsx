'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { RaporDetailData } from '@/lib/rapor.ts';
import { Printer, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

interface Props {
  rapor: RaporDetailData;
  locale: string;
}

export function ParentReportView({ rapor, locale }: Props) {
  const isEn = locale === 'en';

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const formattedDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(isEn ? 'en-US' : 'id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:p-0 print:m-0">
      <div className="max-w-4xl mx-auto space-y-6 print:max-w-none print:m-0">
        {/* Top Control Bar — Hidden when printing */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs print:hidden">
          <Link
            href={`/enrollments/${rapor.pendaftaranId}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Kembali ke Pendaftaran</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="size-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* OFFICIAL ACADEMIC REPORT DOCUMENT CONTAINER (A4 PRINT READY)              */}
        {/* ========================================================================= */}
        <article className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-8 sm:p-12 space-y-8 print:border-none print:shadow-none print:p-6 print:rounded-none">
          {/* Header Lembaga & Rapor */}
          <header className="border-b-2 border-slate-900 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Image
                  src="/svg/symbol_siedu.svg"
                  alt="Siedu"
                  width={44}
                  height={44}
                  className="size-11 object-contain"
                  priority
                />
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none uppercase">
                    SIEDU LEARNING HUB
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Laporan Capaian Belajar Siswa Semester
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                  Status Dokumen
                </span>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 mt-0.5">
                  <CheckCircle2 className="size-3.5 text-emerald-600 print:hidden" />
                  <span>Resmi Diterbitkan</span>
                </div>
                {rapor.raporDiterbitkanPada && (
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {formattedDate(rapor.raporDiterbitkanPada)}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                RAPOR PERKEMBANGAN BELAJAR
              </h1>
              <p className="text-sm font-semibold text-slate-600 mt-0.5">
                Periode: {rapor.periodeNama}
              </p>
            </div>
          </header>

          {/* Data Identitas Siswa & Mata Pelajaran */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-2xl bg-slate-50 border border-slate-200/70 p-5 text-xs sm:text-sm print:bg-transparent print:border print:border-slate-300">
            <div className="space-y-2">
              <div className="flex">
                <span className="w-32 text-slate-500 shrink-0 font-medium">Nama Siswa</span>
                <span className="font-bold text-slate-900">: {rapor.namaSiswa}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 shrink-0 font-medium">Jenjang / Kelas</span>
                <span className="font-semibold text-slate-900">
                  : {rapor.jenjang} {rapor.tingkat ? `(${rapor.tingkat})` : ''}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 shrink-0 font-medium">No. Pendaftaran</span>
                <span className="font-mono text-slate-700">: #{rapor.pendaftaranId}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex">
                <span className="w-32 text-slate-500 shrink-0 font-medium">Mata Pelajaran</span>
                <span className="font-bold text-slate-900">: {rapor.namaMapel}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 shrink-0 font-medium">Guru Pengampu</span>
                <span className="font-semibold text-slate-900">: {rapor.namaGuru}</span>
              </div>
              <div className="flex">
                <span className="w-32 text-slate-500 shrink-0 font-medium">Orang Tua / Wali</span>
                <span className="font-semibold text-slate-900">: {rapor.namaWali}</span>
              </div>
            </div>
          </section>

          {/* Ringkasan Metrik Utama (Type, not tiles) */}
          <section className="grid grid-cols-2 gap-4 border-y border-slate-200 py-5">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Rata-Rata Nilai Tugas / Asesmen
              </p>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-nums mt-1">
                {rapor.rataRataNilai != null ? rapor.rataRataNilai : '-'}
                <span className="text-base sm:text-lg font-bold text-slate-400 font-normal"> / 100</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Dihitung dari {rapor.assessments.length} tugas/asesmen aktif
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                Persentase Kehadiran
              </p>
              <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-nums mt-1">
                {rapor.persenKehadiran}%
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Hadir: <b>{rapor.hadir}</b> dari <b>{rapor.totalSesi}</b> total sesi pertemuan
                {rapor.izin > 0 ? ` · Izin: ${rapor.izin}` : ''}
                {rapor.sakit > 0 ? ` · Sakit: ${rapor.sakit}` : ''}
                {rapor.alpa > 0 ? ` · Alpa: ${rapor.alpa}` : ''}
              </p>
            </div>
          </section>

          {/* Tabel Rincian Asesmen / Tugas */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              A. Rincian Capaian Asesmen & Tugas
            </h3>

            {rapor.assessments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-3">
                Belum ada rincian tugas yang diterbitkan guru pada periode ini.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">No</th>
                      <th className="py-2.5 px-3">Nama Tugas / Asesmen</th>
                      <th className="py-2.5 px-3 w-28">Tanggal</th>
                      <th className="py-2.5 px-3 w-24 text-right">Nilai</th>
                      <th className="py-2.5 px-3 w-24 text-right">Maks</th>
                      <th className="py-2.5 px-3">Catatan Pembelajaran</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {rapor.assessments.map((a, idx) => (
                      <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-500 font-medium">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{a.nama}</td>
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{a.tanggal}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 tabular-nums">
                          {a.nilai != null ? a.nilai : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-500 tabular-nums">{a.nilaiMaksimum}</td>
                        <td className="py-2.5 px-3 text-slate-600 text-xs">
                          {a.catatanSiswa || a.catatanTugas || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Evaluasi Subjektif & Catatan Rapor Guru */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              B. Evaluasi Guru & Catatan Perkembangan
            </h3>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-slate-800 text-sm leading-relaxed print:bg-transparent print:border print:border-slate-300">
              {rapor.catatanRapor ? (
                <p className="whitespace-pre-line font-medium italic">
                  &ldquo;{rapor.catatanRapor}&rdquo;
                </p>
              ) : (
                <p className="text-slate-500 italic">
                  Guru pengampu belum menyertakan catatan khusus untuk rapor semester ini.
                </p>
              )}
            </div>
          </section>

          {/* Kolom Tanda Tangan Resmi Pengesahan */}
          <footer className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs sm:text-sm">
            <div>
              <p className="text-slate-500">Mengetahui,</p>
              <p className="font-semibold text-slate-800 mt-1">Koordinator Akademik Siedu</p>
              <div className="h-16 sm:h-20" />
              <p className="font-bold text-slate-900 border-t border-slate-300 pt-1.5 inline-block min-w-[160px]">
                Akademik Siedu
              </p>
            </div>

            <div>
              <p className="text-slate-500">Pengampu Kelas,</p>
              <p className="font-semibold text-slate-800 mt-1">Guru Mata Pelajaran</p>
              <div className="h-16 sm:h-20" />
              <p className="font-bold text-slate-900 border-t border-slate-300 pt-1.5 inline-block min-w-[160px]">
                {rapor.namaGuru}
              </p>
            </div>
          </footer>
        </article>
      </div>
    </div>
  );
}

export default ParentReportView;
