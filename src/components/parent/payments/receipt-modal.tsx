"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { rupiah } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { PaymentItem } from "./payment-types";
import { X, Printer, CheckCircle2, ShieldCheck } from "lucide-react";
import { useScrollLock } from "@/lib/use-scroll-lock";

interface Props {
  bill: PaymentItem | null;
  parentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ReceiptModal({ bill, parentName, isOpen, onClose }: Props) {
  const t = useTranslations("parent");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "id-ID";
  // Kunci scroll body saat modal terbuka
  useScrollLock(isOpen);

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceNo = `INV-${new Date(
    bill.dibayarPada || bill.createdAt
  ).getFullYear()}${String(
    new Date(bill.dibayarPada || bill.createdAt).getMonth() + 1
  ).padStart(2, "0")}-${String(bill.id).padStart(5, "0")}`;

  const tanggalBayar = bill.dibayarPada
    ? new Date(bill.dibayarPada).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date(bill.createdAt).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const tipeLabel =
    bill.tipe === "dp"
      ? t("billTypeDp")
      : bill.tipe === "cicilan"
      ? t("billTypeInstallment", { n: bill.cicilanKe ?? "-" })
      : t("billTypeFullReceipt");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
    >
      {/* Backdrop — hidden during print */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        data-lenis-prevent
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 print:m-0 print:w-full print:max-w-none print:max-h-none print:overflow-visible print:rounded-none print:border-none print:shadow-none"
      >
        {/* Top Control Bar — hidden during print */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-3.5 print:hidden">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>{t("receiptOfficial")}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <Printer className="size-3.5" />
              <span>{t("receiptPrintPdf")}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("receiptCloseAria")}
              className="flex size-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200/70 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="p-6 sm:p-8 space-y-6 print:p-8">
          {/* Header Kop Surat Kwitansi */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-sm">
                  S
                </div>
                <span className="text-xl font-black tracking-tight text-slate-900">
                  {SITE.nama}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {t("receiptTagline")}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {SITE.alamat.join(", ")}
              </p>
              <p className="text-[11px] text-slate-400">
                Telp: {SITE.telepon} · WhatsApp: {SITE.whatsapp}
              </p>
            </div>

            <div className="sm:text-right">
              <span className="inline-block rounded-md bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                {t("receiptPaidProof")}
              </span>
              <h3
                id="receipt-title"
                className="mt-1 text-sm font-bold text-slate-800"
              >
                No. {invoiceNo}
              </h3>
              <p className="text-xs text-slate-500">
                {t("receiptTransactionTime", { time: tanggalBayar })}
              </p>
            </div>
          </div>

          {/* Data Pembayar & Siswa Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl border border-slate-200/90 bg-slate-50/50 p-4 text-xs">
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-400 text-[10px]">
                {t("receiptReceivedFrom")}
              </span>
              <p className="text-sm font-bold text-slate-900">{parentName}</p>
              <p className="text-slate-500">{t("receiptParentRole")}</p>
            </div>

            <div className="space-y-1.5 sm:border-l sm:border-slate-200 sm:pl-4">
              <span className="font-semibold text-slate-400 text-[10px]">
                {t("receiptStudentData")}
              </span>
              <p className="text-sm font-bold text-slate-900">{bill.namaAnak}</p>
              <p className="text-slate-600 font-medium">
                {bill.namaMapel}
                {bill.tingkat ? ` (${bill.tingkat})` : ""}
              </p>
            </div>
          </div>

          {/* Rincian Transaksi Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600">
                  <th className="py-2.5 px-4">{t("receiptDescription")}</th>
                  <th className="py-2.5 px-4 text-center">{t("receiptMethod")}</th>
                  <th className="py-2.5 px-4 text-right">{t("receiptAmount")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
                <tr>
                  <td className="py-3 px-4">
                    <p className="font-bold text-slate-900">{tipeLabel}</p>
                    <p className="text-[11px] text-slate-500">
                      {t("receiptProgramLine", { mapel: bill.namaMapel, name: bill.namaAnak })}
                    </p>
                    {bill.referensiGateway && (
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {t("receiptRefGateway", { ref: bill.referensiGateway })}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                      {bill.referensiGateway ? t("receiptMethodGateway") : t("receiptMethodBank")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900 tabular-nums text-sm">
                    {rupiah(bill.jumlah)}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                  <td colSpan={2} className="py-3 px-4 text-right text-xs">
                    {t("receiptTotalPaid")}
                  </td>
                  <td className="py-3 px-4 text-right text-base text-emerald-700 tabular-nums">
                    {rupiah(bill.jumlah)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Cap Stempel Digital & Catatan Sah */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
            <div className="space-y-1 text-center sm:text-left max-w-sm">
              <p className="text-[11px] font-bold text-slate-700">
                {t("receiptLegalNoticeTitle")}
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                {t("receiptLegalNoticeDesc")}
              </p>
            </div>

            {/* Visual LUNAS Stamp */}
            <div className="relative flex size-28 items-center justify-center rounded-full border-4 border-dashed border-emerald-600 p-2 text-center text-emerald-700 select-none rotate-[-6deg]">
              <div className="space-y-0.5">
                <CheckCircle2 className="mx-auto size-5 text-emerald-600" />
                <span className="block text-sm font-bold">
                  {t("receiptStampPaid")}
                </span>
                <span className="block text-[10px] font-semibold text-emerald-800">
                  {t("receiptStampBrand")}
                </span>
                <span className="block text-[7px] text-emerald-600 font-mono">
                  {new Date(bill.dibayarPada || bill.createdAt).toISOString().slice(0, 10)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions — hidden during print */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            {t("receiptClose")}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="size-3.5" />
            <span>{t("receiptPrint")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
