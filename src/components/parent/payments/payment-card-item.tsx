"use client";

import { useTranslations, useLocale } from "next-intl";
import { rupiah } from "@/lib/format";
import type { PaymentItem } from "./payment-types";
import {
  CreditCard,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  RefreshCw,
} from "lucide-react";

interface Props {
  bill: PaymentItem;
  onPayClick: (bill: PaymentItem) => void;
  onReceiptClick: (bill: PaymentItem) => void;
}

export function PaymentCardItem({ bill, onPayClick, onReceiptClick }: Props) {
  const t = useTranslations("parent");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "id-ID";
  const isPending = bill.status === "pending";
  const isFailed = bill.status === "gagal";
  const isPaid = bill.status === "berhasil";

  const tipeLabel =
    bill.tipe === "dp"
      ? t("billTypeDp")
      : bill.tipe === "cicilan"
      ? t("billTypeInstallment", { n: bill.cicilanKe ?? "-" })
      : t("billTypeFull");

  const dueDateFormatted = bill.jatuhTempo
    ? new Date(bill.jatuhTempo).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

  const paidDateFormatted = bill.dibayarPada
    ? new Date(bill.dibayarPada).toLocaleDateString(dateLocale, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200/80 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-xs">
      {/* Left: Info Tagihan & Due Date */}
      <div className="space-y-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-900 tracking-tight">
            {tipeLabel}
          </span>

          {/* Status Badge */}
          {isPaid && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="size-3" />
              <span>{t("text148")}</span>
            </span>
          )}

          {isPending && bill.isOverdue && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
              <AlertTriangle className="size-3" />
              <span>{t("billStatusLate")}</span>
            </span>
          )}

          {isPending && !bill.isOverdue && bill.daysUntilDue !== null && bill.daysUntilDue <= 3 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200">
              <Clock className="size-3" />
              <span>
                {bill.daysUntilDue === 0
                  ? t("billDueToday")
                  : t("billDaysLeft", { n: bill.daysUntilDue })}
              </span>
            </span>
          )}

          {isPending && !bill.isOverdue && (bill.daysUntilDue === null || bill.daysUntilDue > 3) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
              <span>{t("text149")}</span>
            </span>
          )}

          {isFailed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
              <AlertTriangle className="size-3" />
              <span>{t("text150")}</span>
            </span>
          )}
        </div>

        {/* Date line */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {isPaid ? (
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-slate-400" />
              <span>{t("billPaidOn", { date: paidDateFormatted })}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5 text-slate-400" />
              <span>
                {t("billDueOn")}{" "}
                <strong className={bill.isOverdue ? "text-rose-600 font-bold" : "text-slate-700 font-semibold"}>
                  {dueDateFormatted}
                </strong>
              </span>
            </span>
          )}

          {bill.referensiGateway && (
            <span className="hidden sm:inline-block font-mono text-[11px] text-slate-400">
              Ref: {bill.referensiGateway}
            </span>
          )}
        </div>
      </div>

      {/* Right: Nominal & Action Buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <div className="text-left sm:text-right">
          <span className="text-[10px] font-semibold text-slate-400 block sm:hidden">
            {t("billAmountLabel")}
          </span>
          <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 tabular-nums">
            {rupiah(bill.jumlah)}
          </span>
        </div>

        <div>
          {isPending && (
            <button
              type="button"
              onClick={() => onPayClick(bill)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-blue-700 active:scale-[0.98] cursor-pointer"
            >
              <CreditCard className="size-3.5" />
              <span>{t("payNowButton")}</span>
            </button>
          )}

          {isFailed && (
            <button
              type="button"
              onClick={() => onPayClick(bill)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-rose-700 active:scale-[0.98] cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              <span>{t("billPayRetry")}</span>
            </button>
          )}

          {isPaid && (
            <button
              type="button"
              onClick={() => onReceiptClick(bill)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <Receipt className="size-3.5" />
              <span>{t("billViewReceipt")}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
