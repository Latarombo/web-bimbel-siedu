"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { rupiah } from "@/lib/format";
import type { EnrollmentBillingGroup, PaymentItem } from "./payment-types";
import { PaymentCardItem } from "./payment-card-item";
import { ArrowUpRight, CheckCircle, Clock } from "lucide-react";
import { StudentAvatar } from "@/components/parent/student-avatar";

interface Props {
  group: EnrollmentBillingGroup;
  onPayClick: (bill: PaymentItem) => void;
  onReceiptClick: (bill: PaymentItem) => void;
}

export function EnrollmentGroupCard({
  group,
  onPayClick,
  onReceiptClick,
}: Props) {
  const t = useTranslations("parent");
  const isInstallment = group.metodeBayar === "dp_cicilan";
  const allPaid = group.countLunas === group.countTotal && group.countTotal > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all hover:shadow-sm">
      {/* Header Grup Pendaftaran */}
      <div className="border-b border-slate-100 bg-slate-50/60 p-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Foto anak — StudentAvatar, komponen sama dgn halaman home */}
            <StudentAvatar
              nama={group.namaAnak}
              jenjang={group.jenjang}
              size="sm"
            />

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 tracking-tight text-sm sm:text-base">
                  {group.namaAnak}
                </h3>
                <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                  {group.namaMapel}
                  {group.tingkat ? ` • ${group.tingkat}` : ""}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("groupMethodLabel")}{" "}
                <span className="font-medium text-slate-700">
                  {isInstallment
                    ? t("groupMethodInstallment", { tenor: group.tenorBulan ?? "-" })
                    : t("groupMethodFull")}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/enrollments/${group.pendaftaranId}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span>{t("text074")}</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>

        {/* Progress Bar Cicilan */}
        {isInstallment && (
          <div className="mt-3.5 pt-3 border-t border-slate-200/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                {allPaid ? (
                  <CheckCircle className="size-3.5 text-emerald-600" />
                ) : (
                  <Clock className="size-3.5 text-blue-600" />
                )}
                <span>
                  {t("groupPaymentProgress", {
                    done: group.countLunas,
                    total: group.countTotal,
                  })}
                </span>
              </span>
              <span className="font-bold text-slate-800 tabular-nums">
                {group.percentLunas}% ({rupiah(group.totalLunas)} / {rupiah(group.totalBiaya)})
              </span>
            </div>
            {/* Progress Track */}
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  allPaid ? "bg-emerald-500" : "bg-blue-600"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, group.percentLunas))}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Bill Items List */}
      <div className="p-4 sm:p-6 space-y-3">
        {group.tagihan.map((bill) => (
          <PaymentCardItem
            key={bill.id}
            bill={bill}
            onPayClick={onPayClick}
            onReceiptClick={onReceiptClick}
          />
        ))}
      </div>
    </div>
  );
}
