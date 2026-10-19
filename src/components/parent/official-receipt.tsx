'use client';

import { useState, useEffect } from 'react';
import { Printer, ArrowLeft, CheckCircle2, ShieldCheck, QrCode, Share2 } from 'lucide-react';
import { rupiah, fmtTanggal } from '@/lib/format';
import { terbilangRupiah } from '@/lib/terbilang';
import { createReceiptPaidWaLink } from '@/lib/whatsapp';

export interface OfficialReceiptData {
  nomorKuitansi: string;
  tanggalBayar: string;
  referensiGateway: string | null;
  namaOrangTua: string;
  emailOrangTua: string;
  teleponOrangTua: string;
  namaSiswa: string;
  jenjangSiswa: string;
  pendaftaranId: number;
  namaMapel: string;
  namaGuru: string;
  periodeNama: string;
  tipeTagihan: string;
  cicilanKe: number | null;
  totalCicilan: number | null;
  jumlah: number;
  metodeBayar: string;
  backUrl: string;
}

export function OfficialReceipt({ data }: { data: OfficialReceiptData }) {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const terbilangTeks = terbilangRupiah(data.jumlah);

  const waLink = createReceiptPaidWaLink({
    phone: data.teleponOrangTua,
    parentName: data.namaOrangTua,
    studentName: data.namaSiswa,
    className: `${data.namaMapel} (${data.jenjangSiswa})`,
    receiptNumber: data.nomorKuitansi,
    amount: data.jumlah,
    paidDate: fmtTanggal(data.tanggalBayar, "id"),
    receiptUrl: currentUrl || data.backUrl,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
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

      {/* Main Printable Receipt Card */}
      <div className="receipt-paper relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-lg text-slate-900">
        {/* Kop Lembaga */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-slate-900/80 pb-6 gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid size-12 place-items-center rounded-xl bg-blue-600 text-white font-black text-xl shadow-xs">
              S
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                SIEDU LEARNING CENTER
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pusat Pembelajaran & Bimbingan Belajar Terpadu
              </p>
              <p className="text-[11px] text-slate-400">
                Jl. Pendidikan No. 42, Jakarta · support@siedu.id · (021) 8765-4321
              </p>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
              <CheckCircle2 className="size-3.5 stroke-[2.5]" />
              <span>PEMBAYARAN SAH / LUNAS</span>
            </span>
            <p className="mt-1.5 text-xs font-mono font-bold text-slate-700">
              {data.nomorKuitansi}
            </p>
          </div>
        </div>

        {/* Receipt Heading */}
        <div className="mt-6 text-center">
          <h2 className="text-base font-extrabold tracking-wider uppercase text-slate-900">
            Kuitansi Pembayaran Resmi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tanggal Transaksi: {fmtTanggal(data.tanggalBayar)}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-xs">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Diterima Dari
            </span>
            <p className="mt-1 font-bold text-slate-900 text-sm">{data.namaOrangTua}</p>
            <p className="text-slate-600 mt-0.5">{data.emailOrangTua}</p>
            <p className="text-slate-600">{data.teleponOrangTua}</p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Data Murid & Pendaftaran
            </span>
            <p className="mt-1 font-bold text-slate-900 text-sm">{data.namaSiswa}</p>
            <p className="text-slate-600 mt-0.5">
              Jenjang: {data.jenjangSiswa} · ID #{data.pendaftaranId}
            </p>
            <p className="text-slate-600">
              Periode: {data.periodeNama}
            </p>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-100/80 font-bold uppercase tracking-wider text-slate-600">
              <tr>
                <th className="px-4 py-3">Uraian Pembayaran</th>
                <th className="px-4 py-3 text-center">Metode</th>
                <th className="px-4 py-3 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-3.5">
                  <p className="font-bold text-slate-900 text-sm">{data.namaMapel}</p>
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    Pengajar: {data.namaGuru}
                  </p>
                  <p className="text-slate-500 text-[11px]">
                    Rincian: {data.tipeTagihan}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-center text-slate-600 font-medium">
                  {data.metodeBayar === 'dp_cicilan' ? 'DP / Cicilan' : 'Pembayaran Lunas'}
                </td>
                <td className="px-4 py-3.5 text-right font-mono font-bold text-slate-900 text-sm">
                  {rupiah(data.jumlah)}
                </td>
              </tr>
            </tbody>
            <tfoot className="border-t-2 border-slate-200 bg-slate-50/80">
              <tr>
                <th colSpan={2} className="px-4 py-3 text-right font-bold text-slate-700">
                  Total Dibayar:
                </th>
                <th className="px-4 py-3 text-right font-mono text-base font-black text-blue-700">
                  {rupiah(data.jumlah)}
                </th>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Terbilang Block */}
        <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 text-xs">
          <span className="font-bold text-slate-700">Terbilang: </span>
          <span className="italic font-medium text-slate-800 capitalize">
            {terbilangTeks}
          </span>
        </div>

        {/* Reference & Security Details */}
        <div className="mt-4 flex flex-wrap items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-4 gap-2">
          <span>
            Ref Gateway: <span className="font-mono font-semibold text-slate-700">{data.referensiGateway || 'MIDTRANS-VA-SETTLED'}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-slate-500">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>Verifikasi Keamanan Terenkripsi</span>
          </span>
        </div>

        {/* Signature & Authentication Stamp */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="border border-slate-200 rounded-lg p-2 bg-slate-50">
              <QrCode className="size-14 text-slate-800" />
            </div>
            <div className="text-[10px] leading-tight">
              <p className="font-semibold text-slate-600">Verifikasi Dokumen Digital</p>
              <p>Scan untuk validasi keaslian pembayaran di portal resmi Siedu.</p>
              <p className="text-slate-400 mt-0.5">Berlaku tanpa tanda tangan basah.</p>
            </div>
          </div>

          <div className="text-center sm:text-right min-w-[180px]">
            <p className="text-xs text-slate-500">Jakarta, {fmtTanggal(data.tanggalBayar)}</p>
            <div className="my-2 flex justify-center sm:justify-end">
              <div className="inline-flex items-center gap-1 rounded border border-emerald-400 bg-emerald-50/60 px-3 py-1 font-mono text-[10px] font-black uppercase text-emerald-800 tracking-widest rotate-[-4deg]">
                LUNAS · SIEDU
              </div>
            </div>
            <p className="text-xs font-bold text-slate-800">Bagian Keuangan Siedu</p>
            <p className="text-[10px] text-slate-400">Finance & Student Administration</p>
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
          .receipt-paper {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
