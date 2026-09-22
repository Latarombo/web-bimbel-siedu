"use client";

import { useState, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type {
  EnrollmentBillingGroup,
  PaymentItem,
  PaymentStats,
} from "./payment-types";
import { PaymentSummaryStrip } from "./payment-summary-strip";
import { EnrollmentGroupCard } from "./enrollment-group-card";
import { QuickPayModal } from "./quick-pay-modal";
import { ReceiptModal } from "./receipt-modal";
import {
  Search,
  CheckCircle2,
  Receipt,
  Sparkles,
  Calendar,
  X,
  BookOpen,
  Filter,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface Props {
  initialTab?: string;
  initialAnakId?: string;
  anakList: { id: number; nama: string }[];
  groups: EnrollmentBillingGroup[];
  stats: PaymentStats;
  isGatewayConfigured: boolean;
  parentName: string;
}

export function PaymentCenterClient({
  initialTab = "belum-lunas",
  initialAnakId,
  anakList,
  groups,
  stats,
  isGatewayConfigured,
  parentName,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Tab state: "belum-lunas" or "riwayat"
  const [tab, setTab] = useState<"belum-lunas" | "riwayat">(
    initialTab === "riwayat" ? "riwayat" : "belum-lunas"
  );

  // Selected Child Filter: "all" or anakId
  const [selectedAnak, setSelectedAnak] = useState<number | "all">(() => {
    if (initialAnakId && !isNaN(Number(initialAnakId))) {
      return Number(initialAnakId);
    }
    return "all";
  });

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [payModalBill, setPayModalBill] = useState<PaymentItem | null>(null);
  const [receiptModalBill, setReceiptModalBill] = useState<PaymentItem | null>(null);

  // Helper to sync URL params smoothly
  const syncUrl = (newTab: string, newAnak: number | "all") => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTab === "riwayat") {
      params.set("tab", "riwayat");
    } else {
      params.delete("tab");
    }

    if (newAnak !== "all") {
      params.set("anak", String(newAnak));
    } else {
      params.delete("anak");
    }

    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleTabChange = (nextTab: "belum-lunas" | "riwayat") => {
    setTab(nextTab);
    syncUrl(nextTab, selectedAnak);
  };

  const handleAnakChange = (nextAnak: number | "all") => {
    setSelectedAnak(nextAnak);
    syncUrl(tab, nextAnak);
  };

  // Filter groups according to active Tab, Selected Child, and Search Query
  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return groups
      .map((group) => {
        // Child filter
        if (selectedAnak !== "all" && group.anakId !== selectedAnak) {
          return null;
        }

        // Tab filter for bills
        const targetBills = group.tagihan.filter((b) => {
          if (tab === "belum-lunas") {
            return b.status === "pending" || b.status === "gagal";
          } else {
            return b.status === "berhasil";
          }
        });

        if (targetBills.length === 0) return null;

        // Search query filter
        if (q) {
          const matchGroup =
            group.namaAnak.toLowerCase().includes(q) ||
            group.namaMapel.toLowerCase().includes(q) ||
            (group.tingkat && group.tingkat.toLowerCase().includes(q));

          const matchingBills = targetBills.filter(
            (b) =>
              matchGroup ||
              b.tipe.toLowerCase().includes(q) ||
              (b.referensiGateway && b.referensiGateway.toLowerCase().includes(q))
          );

          if (matchingBills.length === 0) return null;

          return {
            ...group,
            tagihan: matchingBills,
          };
        }

        return {
          ...group,
          tagihan: targetBills,
        };
      })
      .filter((g): g is EnrollmentBillingGroup => g !== null);
  }, [groups, tab, selectedAnak, searchQuery]);

  const totalBillsCount = useMemo(() => {
    return filteredGroups.reduce((acc, g) => acc + g.tagihan.length, 0);
  }, [filteredGroups]);

  const hasAnyEnrollment = groups.length > 0;

  return (
    <div className="min-h-full bg-slate-50/50 pb-20">
      {/* 1. Hero Header (Persis Desain Halaman Home Orang Tua & Katalog) */}
      <section className="relative overflow-hidden bg-[#1d4ed8] text-white pt-8 pb-10 sm:pt-10 sm:pb-12 shadow-xs border-b border-blue-900/20">
        {/* Gelombang sudut tanpa gradient persis halaman home / katalog */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <svg
            className="absolute -right-8 -top-8 w-72 sm:w-96 md:w-[480px]"
            viewBox="0 0 400 280"
            fill="none"
          >
            <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="white" fillOpacity="0.05" />
            <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="white" fillOpacity="0.07" />
            <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="white" fillOpacity="0.09" />
          </svg>

          <svg
            className="absolute -left-8 -bottom-8 w-64 sm:w-80 md:w-[420px]"
            viewBox="0 0 360 260"
            fill="none"
          >
            <path d="M0 60 C90 105, 180 175, 280 260 L0 260 Z" fill="white" fillOpacity="0.05" />
            <path d="M0 120 C75 155, 145 205, 210 260 L0 260 Z" fill="white" fillOpacity="0.07" />
            <path d="M0 180 C50 205, 100 230, 140 260 L0 260 Z" fill="white" fillOpacity="0.08" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3 py-1 text-xs font-semibold text-white/95 mb-3 backdrop-blur-sm">
            <ShieldCheck className="size-3.5 text-emerald-300" />
            <span>Portal Orang Tua • Finansial Siedu</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Riwayat & Tagihan Pembayaran
          </h1>
          <p className="mt-2.5 max-w-2xl text-xs sm:text-sm lg:text-base text-blue-100/90 leading-relaxed font-medium">
            Pantau rincian biaya kursus semua anak Anda, lakukan pelunasan instan
            via Midtrans / transfer, dan unduh kwitansi digital resmi.
          </p>
        </div>
      </section>

      {/* 2. Main Content Container (aligned with Navbar max-w-7xl px-4 sm:px-6 lg:px-8) */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* 3-Card Financial Metric Strip */}
        <PaymentSummaryStrip stats={stats} />

        {/* Filter Controls: Tabs + Child Switcher + Search Bar */}
        <section className="space-y-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Tabs */}
          <nav aria-label="Tab Status Pembayaran" className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleTabChange("belum-lunas")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                tab === "belum-lunas"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Belum Lunas</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  tab === "belum-lunas"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {stats.totalPendingCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange("riwayat")}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                tab === "riwayat"
                  ? "bg-white text-blue-600 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Riwayat Lunas</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  tab === "riwayat"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {stats.totalPaidCount}
              </span>
            </button>
          </nav>

          {/* Search Bar Input */}
          <div className="relative w-full lg:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari anak, kelas, mapel..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-8 text-xs sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Child Filter Chips (Pill Row) */}
        {anakList.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex items-center flex-wrap gap-2">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
              <Filter className="size-3 text-slate-400" />
              Filter Anak:
            </span>

            <button
              type="button"
              onClick={() => handleAnakChange("all")}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                selectedAnak === "all"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua Anak ({anakList.length})
            </button>

            {anakList.map((anak) => (
              <button
                key={anak.id}
                type="button"
                onClick={() => handleAnakChange(anak.id)}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-colors cursor-pointer ${
                  selectedAnak === anak.id
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {anak.nama}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* 4. Content Area: Grouped Cards or Empty States */}
      {!hasAnyEnrollment ? (
        /* Zero State: Belum ada pendaftaran sama sekali */
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-4 shadow-xs">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <BookOpen className="size-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-slate-900">
              Belum Ada Pendaftaran Kelas
            </h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Putra-putri Anda belum terdaftar pada kelas bimbel. Daftarkan anak
              ke kelas pilihan untuk melihat jadwal dan tagihan pembayaran.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-blue-700 transition-colors"
            >
              <span>Jelajahi Katalog Kelas</span>
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      ) : filteredGroups.length === 0 ? (
        /* Contextual Empty State */
        tab === "belum-lunas" && stats.totalPendingCount === 0 ? (
          /* Semua Tagihan Lunas (Appreciative) */
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-b from-emerald-50/40 to-white p-10 text-center space-y-4 shadow-xs">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-xs">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-bold text-emerald-800">
                <Sparkles className="size-3" />
                <span>Semua Tagihan Beres!</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Tidak Ada Tagihan Belum Dibayar
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Luar biasa! Seluruh pembayaran kursus putra-putri Anda telah lunas.
                Anak Anda siap mengikuti seluruh sesi pembelajaran dengan tenang.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/schedule-attendance"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
              >
                <Calendar className="size-4" />
                <span>Lihat Jadwal & Presensi Anak</span>
              </Link>
              <button
                type="button"
                onClick={() => handleTabChange("riwayat")}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Receipt className="size-4 text-slate-500" />
                <span>Buka Riwayat Kwitansi Lunas</span>
              </button>
            </div>
          </div>
        ) : tab === "riwayat" && stats.totalPaidCount === 0 ? (
          /* Belum Ada Riwayat Lunas */
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3 shadow-xs">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Receipt className="size-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Belum Ada Riwayat Pembayaran
              </h3>
              <p className="text-xs text-slate-500">
                Setelah pembayaran pertama diverifikasi berhasil, kwitansi dan
                arsip transaksi akan tersimpan rapi di sini.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleTabChange("belum-lunas")}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                <span>Lihat tagihan yang perlu dibayar</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Empty Search / Filter Result */
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center space-y-3 shadow-xs">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Search className="size-7" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Tidak Ada Tagihan Ditemukan
              </h3>
              <p className="text-xs text-slate-500">
                Tidak ada data yang sesuai dengan kata kunci pencarian atau filter
                anak yang dipilih.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedAnak("all");
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Reset Filter Pencarian
              </button>
            </div>
          </div>
        )
      ) : (
        /* Render Enrollment Groups */
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>
              Menampilkan {filteredGroups.length} program kelas ({totalBillsCount} tagihan)
            </span>
          </div>

          <div className="space-y-6">
            {filteredGroups.map((group) => (
              <EnrollmentGroupCard
                key={group.pendaftaranId}
                group={group}
                onPayClick={(b) => setPayModalBill(b)}
                onReceiptClick={(b) => setReceiptModalBill(b)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 5. Modals */}
      <QuickPayModal
        bill={payModalBill}
        isOpen={!!payModalBill}
        onClose={() => setPayModalBill(null)}
        isGatewayConfigured={isGatewayConfigured}
      />

      <ReceiptModal
        bill={receiptModalBill}
        parentName={parentName}
        isOpen={!!receiptModalBill}
        onClose={() => setReceiptModalBill(null)}
      />
      </div>
    </div>
  );
}
