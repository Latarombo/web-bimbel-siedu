'use client';

import { useState, useEffect } from 'react';
import { Printer, ArrowLeft, Award, CheckCircle2, ShieldCheck, QrCode, Share2 } from 'lucide-react';
import { fmtTanggal } from '@/lib/format';

export interface OfficialCertificateData {
  pendaftaranId: number;
  nomorSertifikat: string;
  namaSiswa: string;
  namaMapel: string;
  jenjang: string;
  tingkat?: string | null;
  periodeNama: string;
  tanggalTerbit: string;
  persenKehadiran: number;
  rataRataNilai: number | null;
  predikat: string;
  namaGuru: string;
  backUrl: string;
}

export function OfficialCertificate({ data }: { data: OfficialCertificateData }) {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const shareText = encodeURIComponent(
    [
      `Yth. Bapak/Ibu Orang Tua Siswa,`,
      ``,
      `Selamat! Ananda ${data.namaSiswa} telah berhasil menyelesaikan program bimbingan belajar pada kelas ${data.namaMapel} (${data.jenjang}) di Siedu Learning Center dengan predikat: ${data.predikat}.`,
      ``,
      `• No. Sertifikat: ${data.nomorSertifikat}`,
      `• Kehadiran: ${data.persenKehadiran}%`,
      ...(data.rataRataNilai != null ? [`• Rata-rata Nilai: ${data.rataRataNilai}`] : []),
      ``,
      `Sertifikat kelulusan resmi dapat diakses dan diunduh di:`,
      currentUrl || data.backUrl,
      ``,
      `Terima kasih atas dedikasi dan prestasi belajar ananda.`,
      `Salam hormat,`,
      `Siedu Learning Center`,
    ].join('\n')
  );

  const waShareUrl = `https://wa.me/?text=${shareText}`;

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Action Bar (Hidden on Print) */}
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
            href={waShareUrl}
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

      {/* Main Certificate Sheet */}
      <div className="certificate-paper relative overflow-hidden rounded-2xl border-8 border-double border-amber-600/30 bg-white p-8 sm:p-14 shadow-2xl text-slate-900">
        {/* Subtle Watermark Background */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03]">
          <Award className="size-96 text-slate-900" />
        </div>

        {/* Certificate Inner Frame */}
        <div className="relative z-10 border border-amber-600/20 p-6 sm:p-10 rounded-xl flex flex-col items-center text-center">
          {/* Top Brand Header */}
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-xl bg-blue-600 text-white font-black text-xl shadow-xs">
              S
            </div>
            <div className="text-left">
              <span className="text-sm font-black tracking-widest text-slate-900 block uppercase">
                Siedu Learning Center
              </span>
              <span className="text-[10px] tracking-wider text-slate-500 font-semibold uppercase block">
                Pusat Pembelajaran & Bimbingan Belajar Terpadu
              </span>
            </div>
          </div>

          <div className="my-6 w-24 h-0.5 bg-amber-500/60" />

          {/* Certificate Main Title */}
          <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-wider text-slate-900 uppercase">
            Sertifikat Penyelesaian Belajar
          </h1>
          <p className="font-serif italic text-xs sm:text-sm text-slate-600 mt-1">
            Certificate of Program Completion
          </p>
          <p className="mt-2 font-mono text-[11px] tracking-widest text-slate-500 uppercase">
            No: {data.nomorSertifikat}
          </p>

          <p className="mt-8 text-xs sm:text-sm text-slate-600 font-medium">
            Dengan ini menerangkan bahwa peserta didik:
          </p>

          {/* Student Name */}
          <h2 className="mt-3 text-2xl sm:text-4xl font-black text-blue-900 tracking-tight border-b-2 border-slate-900/10 pb-2 px-8 min-w-[280px]">
            {data.namaSiswa}
          </h2>

          <p className="mt-6 max-w-2xl text-xs sm:text-sm text-slate-700 leading-relaxed">
            Telah menyelesaikan seluruh rangkaian kegiatan pembelajaran dan evaluasi akademik program{' '}
            <strong className="text-slate-950 font-bold">{data.namaMapel}</strong> tingkat jenjang{' '}
            <strong className="text-slate-950 font-bold">{data.jenjang}</strong> pada{' '}
            <span className="font-semibold text-slate-900">{data.periodeNama}</span>.
          </p>

          {/* Achievement Summary Pill Strip */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 sm:gap-6 border-y border-slate-200/80 py-4 w-full max-w-xl">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Predikat Kelulusan</p>
              <p className="text-sm font-black text-emerald-700 mt-0.5">{data.predikat}</p>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tingkat Kehadiran</p>
              <p className="text-sm font-black text-slate-900 mt-0.5 tabular-nums">{data.persenKehadiran}%</p>
            </div>
            {data.rataRataNilai != null && (
              <>
                <div className="w-px h-8 bg-slate-200" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Rata-Rata Nilai</p>
                  <p className="text-sm font-black text-slate-900 mt-0.5 tabular-nums">{data.rataRataNilai}</p>
                </div>
              </>
            )}
          </div>

          {/* Signatures & Seal Section */}
          <div className="mt-12 grid w-full grid-cols-3 gap-6 items-end pt-4">
            {/* Signature 1: Pengajar */}
            <div className="text-center">
              <div className="h-16 flex items-end justify-center pb-2">
                <span className="font-serif italic text-base text-slate-700 font-bold">{data.namaGuru}</span>
              </div>
              <div className="w-32 sm:w-44 mx-auto border-b border-slate-900" />
              <p className="mt-1 text-xs font-bold text-slate-900">{data.namaGuru}</p>
              <p className="text-[10px] text-slate-500">Guru Pengajar / Instruktur</p>
            </div>

            {/* Center: Digital Seal / Stamp */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative grid size-20 place-items-center rounded-full border-2 border-dashed border-amber-600/50 bg-amber-50/40 text-amber-800">
                <ShieldCheck className="size-8 stroke-[1.8] text-amber-700" />
                <span className="absolute -bottom-2 bg-amber-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider shadow-2xs">
                  SAH & VALID
                </span>
              </div>
              <p className="text-[10px] font-semibold text-slate-500 mt-3">
                {fmtTanggal(data.tanggalTerbit, 'id')}
              </p>
            </div>

            {/* Signature 2: Kepala Lembaga */}
            <div className="text-center">
              <div className="h-16 flex items-end justify-center pb-2">
                <span className="font-serif italic text-base text-slate-700 font-bold">Dr. H. Bambang S., M.Pd.</span>
              </div>
              <div className="w-32 sm:w-44 mx-auto border-b border-slate-900" />
              <p className="mt-1 text-xs font-bold text-slate-900">Dr. H. Bambang S., M.Pd.</p>
              <p className="text-[10px] text-slate-500">Kepala Lembaga Siedu</p>
            </div>
          </div>

          {/* Bottom Security Notice */}
          <div className="mt-10 pt-4 border-t border-slate-100 flex items-center justify-between w-full text-[10px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <QrCode className="size-3.5" />
              Verifikasi keaslian dokumen via sistem resmi siedu.id
            </span>
            <span className="font-mono">ID-{data.pendaftaranId}</span>
          </div>
        </div>
      </div>

      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
          .certificate-paper {
            border: 6px double #b45309 !important;
            box-shadow: none !important;
            padding: 24px !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
