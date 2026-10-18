'use client';

import { useState, useEffect } from 'react';
import { Printer, ArrowLeft, CheckCircle2, Award, Calendar, BookOpen, UserCheck, ShieldCheck, QrCode, Share2 } from 'lucide-react';
import { fmtTanggal } from '@/lib/format';
import { createReportCardWaLink } from '@/lib/whatsapp';

export interface AssessmentItem {
  id: number;
  nama: string;
  tanggal: string;
  nilai: number | null;
  nilaiMaksimum: number;
  statusHasil: string;
  catatan?: string | null;
}

export interface QualitativeReportItem {
  id: number;
  tanggal: string;
  judul: string;
  laporanOrtu: string;
}

export interface OfficialReportCardData {
  pendaftaranId: number;
  namaSiswa: string;
  jenjang: string;
  tingkat?: string | null;
  namaMapel: string;
  deskripsiMapel?: string | null;
  namaGuru: string;
  periodeNama: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  // Presensi stats
  totalSesi: number;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  persenKehadiran: number;
  // Nilai stats
  assessments: AssessmentItem[];
  rataRataNilai: number | null;
  // Laporan kualitatif
  laporanPerkembangan: QualitativeReportItem[];
  backUrl: string;
}

export function OfficialReportCard({ data }: { data: OfficialReportCardData }) {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const getGradeCategory = (score: number | null) => {
    if (score == null) return { label: 'Belum Dinilai', color: 'text-slate-600' };
    if (score >= 90) return { label: 'A (Sangat Memuaskan)', color: 'text-emerald-700' };
    if (score >= 80) return { label: 'B (Baik / Memuaskan)', color: 'text-blue-700' };
    if (score >= 70) return { label: 'C (Cukup)', color: 'text-amber-700' };
    return { label: 'D (Perlu Pendampingan Khusus)', color: 'text-rose-700' };
  };

  const gradeCategory = getGradeCategory(data.rataRataNilai);

  const waLink = createReportCardWaLink({
    studentName: data.namaSiswa,
    className: `${data.namaMapel} (${data.jenjang})`,
    averageScore: data.rataRataNilai,
    attendancePercent: data.persenKehadiran,
    reportUrl: currentUrl || data.backUrl,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:py-10">
      {/* Top Action Bar (Hidden on Print) */}
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <a
          href={data.backUrl}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Kembali</span>
        </a>

        <div className="flex items-center gap-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            <Share2 className="size-4" />
            <span>Bagikan ke WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Printer className="size-4" />
            <span>Cetak / Simpan PDF</span>
          </button>
        </div>
      </div>

      {/* Main Printable Document Sheet */}
      <div className="report-paper relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-12 shadow-lg text-slate-900">
        {/* Kop Lembaga Resmi */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-slate-900 pb-5 gap-4">
          <div className="flex items-center gap-4">
            <div className="grid size-14 place-items-center rounded-2xl bg-blue-600 text-white font-black text-2xl shadow-xs">
              S
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                SIEDU LEARNING CENTER
              </h1>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Lembaga Pendidikan & Bimbingan Belajar Berkualitas
              </p>
              <p className="text-[11px] text-slate-400">
                Izin Operasional Lembaga No. 421.9/882/Dikpora · info@siedu.id · www.siedu.id
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-block rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-[11px] font-mono font-bold text-blue-900">
              DOKUMEN RESMI
            </span>
            <p className="text-xs font-mono text-slate-500 mt-1">
              ID: RAPOR-{data.pendaftaranId.toString().padStart(6, '0')}
            </p>
          </div>
        </div>

        {/* Judul Rapor */}
        <div className="mt-6 text-center">
          <h2 className="text-base sm:text-lg font-black tracking-wide uppercase text-slate-900">
            Laporan Hasil Belajar & Perkembangan Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Periode: {data.periodeNama} ({fmtTanggal(data.tanggalMulai)} s.d. {fmtTanggal(data.tanggalSelesai)})
          </p>
        </div>

        {/* Biodata Siswa & Kelas */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs">
          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 text-slate-500 font-medium">Nama Siswa</span>
              <span className="font-bold text-slate-900">: {data.namaSiswa}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500 font-medium">Jenjang / Tingkat</span>
              <span className="font-semibold text-slate-800">
                : {data.jenjang} {data.tingkat ? `(${data.tingkat})` : ''}
              </span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500 font-medium">Nomor Pendaftaran</span>
              <span className="font-mono text-slate-800">: #{data.pendaftaranId}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex">
              <span className="w-32 text-slate-500 font-medium">Mata Pelajaran</span>
              <span className="font-bold text-slate-900">: {data.namaMapel}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500 font-medium">Guru Pembimbing</span>
              <span className="font-semibold text-slate-800">: {data.namaGuru}</span>
            </div>
            <div className="flex">
              <span className="w-32 text-slate-500 font-medium">Status Program</span>
              <span className="font-semibold text-emerald-700">: Aktif Terdaftar</span>
            </div>
          </div>
        </div>

        {/* Bagian 1: Ringkasan Presensi & Kehadiran */}
        <div className="mt-8">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <UserCheck className="size-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-800">
              I. Ringkasan Kehadiran & Kedisiplinan
            </h3>
          </div>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-semibold text-slate-500">Total Sesi</p>
              <p className="mt-1 text-xl font-black text-slate-900 tabular-nums">{data.totalSesi}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3">
              <p className="text-[11px] font-semibold text-emerald-800">Hadir</p>
              <p className="mt-1 text-xl font-black text-emerald-700 tabular-nums">{data.hadir}</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
              <p className="text-[11px] font-semibold text-amber-800">Izin</p>
              <p className="mt-1 text-xl font-black text-amber-700 tabular-nums">{data.izin}</p>
            </div>
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3">
              <p className="text-[11px] font-semibold text-blue-800">Sakit</p>
              <p className="mt-1 text-xl font-black text-blue-700 tabular-nums">{data.sakit}</p>
            </div>
            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-3">
              <p className="text-[11px] font-semibold text-rose-800">Alpa</p>
              <p className="mt-1 text-xl font-black text-rose-700 tabular-nums">{data.alpa}</p>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2 text-xs">
            <span className="text-slate-600 font-medium">Persentase Tingkat Kehadiran:</span>
            <span className="font-extrabold text-blue-700 text-sm tabular-nums">
              {data.persenKehadiran}%
            </span>
          </div>
        </div>

        {/* Bagian 2: Hasil Penilaian Tugas & Kuis */}
        <div className="mt-8">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <Award className="size-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-800">
              II. Capaian Hasil Belajar & Penilaian
            </h3>
          </div>

          {data.assessments.length > 0 ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-100/90 font-bold uppercase tracking-wider text-slate-600">
                  <tr>
                    <th className="px-4 py-2.5">No</th>
                    <th className="px-4 py-2.5">Tugas / Penilaian</th>
                    <th className="px-4 py-2.5 text-center">Tanggal</th>
                    <th className="px-4 py-2.5 text-center">Skor</th>
                    <th className="px-4 py-2.5">Catatan Evaluasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.assessments.map((item, idx) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 text-slate-500 tabular-nums">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{item.nama}</td>
                      <td className="px-4 py-3 text-center text-slate-600 tabular-nums">
                        {fmtTanggal(item.tanggal)}
                      </td>
                      <td className="px-4 py-3 text-center font-bold tabular-nums text-slate-900">
                        {item.statusHasil === 'dinilai'
                          ? `${item.nilai ?? '-'} / ${item.nilaiMaksimum}`
                          : item.statusHasil === 'tidak_ikut'
                            ? 'Tidak Hadir'
                            : 'Belum Dinilai'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.catatan || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                  <tr>
                    <th colSpan={3} className="px-4 py-3 text-right font-bold text-slate-700">
                      Rata-Rata Capaian Nilai:
                    </th>
                    <th className="px-4 py-3 text-center font-mono text-base font-black text-blue-700">
                      {data.rataRataNilai != null ? data.rataRataNilai : '-'}
                    </th>
                    <th className="px-4 py-3 font-semibold text-slate-700">
                      Predikat: <span className={`font-bold ${gradeCategory.color}`}>{gradeCategory.label}</span>
                    </th>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-500">
              Belum ada riwayat tugas atau penilaian resmi yang dicatat pada periode ini.
            </div>
          )}
        </div>

        {/* Bagian 3: Laporan Perkembangan Kualitatif & Rekomendasi Guru */}
        <div className="mt-8">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <BookOpen className="size-4 text-blue-600" />
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wide text-slate-800">
              III. Catatan Perkembangan & Rekomendasi Belajar
            </h3>
          </div>

          {data.laporanPerkembangan.length > 0 ? (
            <div className="mt-3 space-y-3">
              {data.laporanPerkembangan.map((lap) => (
                <div key={lap.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200/80 pb-2 mb-2">
                    <span className="font-bold text-slate-900">{lap.judul}</span>
                    <span className="text-[11px] text-slate-500">{fmtTanggal(lap.tanggal)}</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed text-slate-700">
                    {lap.laporanOrtu}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center text-xs text-slate-500">
              Belum ada catatan laporan perkembangan kualitatif yang diterbitkan.
            </div>
          )}
        </div>

        {/* Bagian 4: Lembar Tanda Tangan & Pengesahan */}
        <div className="mt-12 pt-6 border-t-2 border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center text-xs">
            <div>
              <p className="text-slate-500">Mengetahui,</p>
              <p className="font-semibold text-slate-700 mt-1">Orang Tua / Wali Murid</p>
              <div className="h-16 flex items-end justify-center">
                <div className="w-36 border-b border-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">( Tanda Tangan & Nama Terang )</p>
            </div>

            <div>
              <p className="text-slate-500">Jakarta, {fmtTanggal(new Date().toISOString())}</p>
              <p className="font-semibold text-slate-700 mt-1">Guru Pengajar</p>
              <div className="h-16 flex items-end justify-center">
                <p className="font-bold text-slate-900 underline underline-offset-4">{data.namaGuru}</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">Instruktur Bidang Studi</p>
            </div>

            <div>
              <p className="text-slate-500">Mengesahkan,</p>
              <p className="font-semibold text-slate-700 mt-1">Kepala Cabang Siedu</p>
              <div className="h-16 flex items-end justify-center">
                <div className="inline-flex items-center gap-1 rounded border border-blue-300 bg-blue-50/50 px-2.5 py-1 font-mono text-[9px] font-black uppercase text-blue-800 tracking-wider">
                  TERVALIDASI DIGITAL
                </div>
              </div>
              <p className="font-bold text-slate-900 mt-1">Dr. H. Hendra Setiawan, M.Pd.</p>
              <p className="text-[11px] text-slate-400">Head of Academic Affairs</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="size-3.5 text-emerald-600" />
              <span>Dokumen Sah & Terverifikasi Sistem Informasi Siedu</span>
            </span>
            <span>Halaman 1 dari 1</span>
          </div>
        </div>
      </div>

      {/* Print-specific style */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.5cm;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .report-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
