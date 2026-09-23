"use client";

import { rupiah } from "@/lib/format";
import type { PaymentStats } from "./payment-types";
import { Wallet, CalendarClock, CheckCircle2, AlertTriangle, Sparkles } from "lucide-react";

interface Props {
  stats: PaymentStats;
}

export function PaymentSummaryStrip({ stats }: Props) {
  const hasOverdue = stats.overdueCount > 0;
  const isUrgent =
    stats.daysUntilEarliestDue !== null && stats.daysUntilEarliestDue <= 3;

  const dueLabel = stats.earliestDueDate
    ? new Date(stats.earliestDueDate).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* 1. Total Tagihan Aktif */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            Total Tagihan Aktif
          </span>
          <div className="flex size-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Wallet className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
            {rupiah(stats.totalPendingAmount)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block size-2 rounded-full bg-blue-500" />
            <span>
              {stats.totalPendingCount} tagihan pending / belum lunas
            </span>
          </div>
        </div>
      </div>

      {/* 2. Jatuh Tempo Terdekat */}
      <div
        className={`relative overflow-hidden rounded-2xl border p-5 shadow-xs transition-all hover:shadow-md ${
          hasOverdue
            ? "border-rose-200 bg-rose-50/30"
            : isUrgent
            ? "border-amber-200 bg-amber-50/30"
            : "border-slate-200/90 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold ${
              hasOverdue
                ? "text-rose-700"
                : isUrgent
                ? "text-amber-700"
                : "text-slate-500"
            }`}
          >
            Jatuh Tempo Terdekat
          </span>
          <div
            className={`flex size-9 items-center justify-center rounded-xl ${
              hasOverdue
                ? "bg-rose-100 text-rose-600"
                : isUrgent
                ? "bg-amber-100 text-amber-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {hasOverdue ? (
              <AlertTriangle className="size-4" />
            ) : (
              <CalendarClock className="size-4" />
            )}
          </div>
        </div>
        <div className="mt-3">
          <p
            className={`text-2xl sm:text-3xl font-black tracking-tight tabular-nums ${
              hasOverdue
                ? "text-rose-900"
                : isUrgent
                ? "text-amber-900"
                : "text-slate-900"
            }`}
          >
            {hasOverdue
              ? `${stats.overdueCount} Tagihan Terlambat`
              : stats.earliestDueDate
              ? dueLabel
              : "Semua Aman"}
          </p>
          <p
            className={`mt-1 text-xs ${
              hasOverdue
                ? "font-semibold text-rose-700"
                : isUrgent
                ? "font-semibold text-amber-700"
                : "text-slate-500"
            }`}
          >
            {hasOverdue
              ? "Segera selesaikan untuk menghindari pembatalan kelas"
              : isUrgent && stats.daysUntilEarliestDue !== null
              ? stats.daysUntilEarliestDue === 0
                ? "Jatuh tempo hari ini!"
                : `Jatuh tempo dalam ${stats.daysUntilEarliestDue} hari lagi`
              : stats.earliestDueDate
              ? `Batas waktu: ${dueLabel}`
              : "Tidak ada tagihan mendesak saat ini"}
          </p>
        </div>
      </div>

      {/* 3. Total Investasi Belajar / Terbayar */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700">
            Total Terbayar
          </span>
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 tabular-nums">
            {rupiah(stats.totalPaidAmount)}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700">
            <Sparkles className="size-3.5 shrink-0" />
            <span>{stats.totalPaidCount} pembayaran berhasil diselesaikan</span>
          </div>
        </div>
      </div>
    </section>
  );
}
