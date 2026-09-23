"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { rupiah } from "@/lib/format";
import { SITE } from "@/lib/site";
import type { PaymentItem } from "./payment-types";
import { mulaiPembayaran, konfirmasiManual } from "@/app/actions/pembayaran";
import {
  X,
  CreditCard,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  Calendar,
  User,
  BookOpen,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useScrollLock } from "@/lib/use-scroll-lock";

interface Props {
  bill: PaymentItem | null;
  isOpen: boolean;
  onClose: () => void;
  isGatewayConfigured: boolean;
}

export function QuickPayModal({
  bill,
  isOpen,
  onClose,
  isGatewayConfigured,
}: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const redirectedRef = useRef(false);
  const t = useTranslations("parent");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "id-ID";

  // Kunci scroll body saat modal terbuka
  useScrollLock(isOpen);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !bill) return null;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // fallback
    }
  };

  const handleMulaiMidtrans = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("pembayaran_id", String(bill.id));
      const res = await mulaiPembayaran({ ok: false, error: "" }, formData);
      if (res.ok && res.url && !redirectedRef.current) {
        redirectedRef.current = true;
        window.location.assign(res.url);
      } else if (!res.ok) {
        setErrorMsg(res.error || t("quickPayGatewayStartError"));
      }
    });
  };

  const handleManualConfirm = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await konfirmasiManual(formData);
        onClose();
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : t("quickPayConfirmError"));
      }
    });
  };

  const tipeLabel =
    bill.tipe === "dp"
      ? t("billTypeDp")
      : bill.tipe === "cicilan"
      ? t("billTypeInstallment", { n: bill.cicilanKe ?? "-" })
      : t("billTypeFull");

  const bankAccount = "8290-1123-8899";
  const bankName = "BCA (Bank Central Asia)";
  const bankHolder = "Yayasan Siedu Indonesia";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-pay-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative border-b border-slate-100 bg-blue-700 px-6 py-5 text-white">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("quickPayCloseAria")}
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold text-blue-100 mb-2">
            <CreditCard className="size-3.5" />
            <span>{t("quickPayBadge")}</span>
          </div>
          <h2 id="quick-pay-title" className="text-xl font-bold tracking-tight">
            {t("quickPayTitle")}
          </h2>
          <p className="mt-1 text-xs text-blue-100/90">
            {t("quickPayDesc")}
          </p>
        </div>

        {/* Content Body */}
        <div data-lenis-prevent className="max-h-[75vh] overflow-y-auto p-6 space-y-5">
          {/* Info Siswa & Kelas */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <User className="size-3.5 text-slate-400" />
                {t("quickPayStudentName")}
              </span>
              <span className="font-bold text-slate-900">{bill.namaAnak}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <BookOpen className="size-3.5 text-slate-400" />
                {t("quickPayProgram")}
              </span>
              <span className="font-semibold text-slate-800">
                {bill.namaMapel}
                {bill.tingkat ? ` (${bill.tingkat})` : ""}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-slate-500">
                <Calendar className="size-3.5 text-slate-400" />
                {t("quickPayBillType")}
              </span>
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                {tipeLabel}
              </span>
            </div>
            {bill.jatuhTempo && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                <span className="font-medium text-slate-500">{t("quickPayDeadline")}</span>
                <span
                  className={`font-semibold ${
                    bill.isOverdue
                      ? "text-rose-600"
                      : bill.daysUntilDue !== null && bill.daysUntilDue <= 3
                      ? "text-amber-600"
                      : "text-slate-700"
                  }`}
                >
                  {new Date(bill.jatuhTempo).toLocaleDateString(dateLocale, {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {bill.isOverdue ? t("quickPayOverdue") : ""}
                </span>
              </div>
            )}
          </div>

          {/* Nominal Tagihan */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 text-center">
            <span className="text-xs font-semibold text-emerald-800">
              {t("quickPayTotalDue")}
            </span>
            <p className="mt-1 text-3xl font-black tracking-tight text-emerald-900 tabular-nums">
              {rupiah(bill.jumlah)}
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"
            >
              <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Payment Method Selector / Action */}
          {isGatewayConfigured ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Midtrans Payment Gateway
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {t("quickPayAutoBadge")}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {t("quickPayMethodsDesc")}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleMulaiMidtrans}
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 px-4 text-sm font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    {isPending ? (
                      <span>{t("quickPayPreparingGateway")}</span>
                    ) : (
                      <>
                        <span>{t("quickPayPayAmount", { amount: rupiah(bill.jumlah) })}</span>
                        <ArrowRight className="size-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
                <ShieldCheck className="size-3.5 text-emerald-600" />
                <span>{t("quickPaySecureNote")}</span>
              </div>
            </div>
          ) : (
            /* Fallback: Rekening Transfer Manual */
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-800">
                    {t("quickPayManualTitle")}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    {t("quickPayManualBadge")}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("quickPayBankLabel")}</span>
                    <span className="font-bold text-slate-900">{bankName}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("quickPayAccountLabel")}</span>
                    <div className="flex items-center gap-2">
                      <code className="rounded-md bg-slate-100 px-2 py-1 font-mono font-bold text-slate-900">
                        {bankAccount}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bankAccount, "acc")}
                        className="flex size-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                        title={t("quickPayCopyAccount")}
                      >
                        {copiedField === "acc" ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("quickPayHolderLabel")}</span>
                    <span className="font-semibold text-slate-800">
                      {bankHolder}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-500">{t("quickPayTransferAmount")}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-700">
                        {rupiah(bill.jumlah)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(String(bill.jumlah), "amt")
                        }
                        className="flex size-7 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                        title={t("quickPayCopyAmount")}
                      >
                        {copiedField === "amt" ? (
                          <Check className="size-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleManualConfirm} className="pt-2">
                  <input
                    type="hidden"
                    name="pembayaran_id"
                    value={bill.id}
                  />
                  <input
                    type="hidden"
                    name="pendaftaran_id"
                    value={bill.pendaftaranId}
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 px-4 text-sm font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                  >
                    {isPending ? (
                      <span>{t("quickPayVerifying")}</span>
                    ) : (
                      <>
                        <span>{t("quickPayConfirmTransfer")}</span>
                        <Check className="size-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              <p className="text-[11px] text-center text-slate-500">
                {t("quickPayWhatsappHelp", { phone: SITE.whatsapp })}
              </p>
            </div>
          )}

          {/* Direct Link to standard Pay Page */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <Link
              href={`/enrollments/${bill.pendaftaranId}/pay`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
            >
              <span>{t("quickPayFullInstructions")}</span>
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
