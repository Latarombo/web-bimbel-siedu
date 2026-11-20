"use client";

import { useActionState, useEffect, useState, useRef } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { mulaiPembayaran, konfirmasiManual, type PayState } from "@/app/actions/pembayaran";
import { rupiah } from "@/lib/format";

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: unknown) => void;
          onPending?: (result: unknown) => void;
          onError?: (result: unknown) => void;
          onClose?: () => void;
        },
      ) => void;
    };
  }
}

export interface SnapCashierProps {
  pendaftaranId: number;
  pembayaranId: number;
  nominal: number;
  tipe: string;
  cicilanKe: number | null;
  jatuhTempo: string | null;
  batasWaktuTimeoutIso: string;
  clientKey: string;
  snapScriptUrl: string;
  midtransReady: boolean;
  finishUrl: string;
}

export function SnapCashier({
  pendaftaranId,
  pembayaranId,
  nominal,
  tipe,
  cicilanKe,
  batasWaktuTimeoutIso,
  clientKey,
  snapScriptUrl,
  midtransReady,
  finishUrl,
}: SnapCashierProps) {
  const [payState, formAction, isPending] = useActionState<PayState, FormData>(
    mulaiPembayaran,
    { ok: false, error: "" },
  );

  const [sisaWaktu, setSisaWaktu] = useState<{ jam: number; menit: number; detik: number; expired: boolean } | null>(null);
  const [menungguBayar, setMenungguBayar] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const tokenDiproses = useRef<string | null>(null);

  // Countdown timer 1x24 jam (BR#2)
  useEffect(() => {
    const target = new Date(batasWaktuTimeoutIso).getTime();

    function updateTimer() {
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setSisaWaktu({ jam: 0, menit: 0, detik: 0, expired: true });
        return;
      }
      const jam = Math.floor(diff / (1000 * 60 * 60));
      const menit = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const detik = Math.floor((diff % (1000 * 60)) / 1000);
      setSisaWaktu({ jam, menit, detik, expired: false });
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [batasWaktuTimeoutIso]);

  // Efek memicu popup Snap begitu token berhasil diperoleh
  useEffect(() => {
    if (payState.ok && payState.token && tokenDiproses.current !== payState.token) {
      tokenDiproses.current = payState.token;

      if (window.snap?.pay) {
        window.snap.pay(payState.token, {
          onSuccess: () => {
            window.location.assign(finishUrl);
          },
          onPending: () => {
            setMenungguBayar(true);
          },
          onError: () => {
            setClientError("Pembayaran gagal atau dibatalkan oleh gateway.");
          },
          onClose: () => {
            // Pengguna menutup modal tanpa bayar; tetap di kasir
            setMenungguBayar(true);
          },
        });
      } else {
        // Fallback jika skrip snap.js terhalang blocker
        window.location.assign(payState.redirectUrl || payState.url);
      }
    }
  }, [payState, finishUrl]);

  const labelTipe =
    tipe === "dp"
      ? "Uang Muka (DP)"
      : tipe === "cicilan"
        ? `Cicilan Ke-${cicilanKe ?? 1}`
        : "Pelunasan Penuh";

  return (
    <>
      {clientKey && snapScriptUrl ? (
        <Script
          src={snapScriptUrl}
          data-client-key={clientKey}
          strategy="afterInteractive"
        />
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Ringkasan Nominal */}
        <div className="border-b border-slate-100 pb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Tagihan ({labelTipe})
          </p>
          <p className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-900 tabular-nums">
            {rupiah(nominal)}
          </p>
        </div>

        {/* Timer Batas Waktu 1x24 Jam */}
        {sisaWaktu ? (
          <div className="mt-4 rounded-lg bg-amber-50/70 border border-amber-200/60 p-3.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-amber-900">Batas Waktu Pembayaran:</span>
              <span className="font-semibold text-amber-950 tabular-nums">
                {sisaWaktu.expired ? (
                  <span className="text-rose-600">Waktu Pembayaran Berakhir</span>
                ) : (
                  `${String(sisaWaktu.jam).padStart(2, "0")}:${String(sisaWaktu.menit).padStart(2, "0")}:${String(sisaWaktu.detik).padStart(2, "0")}`
                )}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-amber-800/80 leading-relaxed">
              Selesaikan transaksi sebelum batas waktu agar kuota kelas tidak dilepas otomatis oleh sistem.
            </p>
          </div>
        ) : null}

        {/* Status Menunggu / Instruksi VA */}
        {menungguBayar ? (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900">
            <p className="font-semibold">Menunggu Pembayaran</p>
            <p className="mt-1 leading-relaxed text-blue-800">
              Instruksi Virtual Account atau QRIS telah dibuat. Silakan selesaikan transfer dari aplikasi perbankan atau e-wallet Anda. Jika jendela tertutup, tekan tombol di bawah untuk membuka kembali kasir.
            </p>
          </div>
        ) : null}

        {/* Pesan Error */}
        {(!payState.ok && payState.error) || clientError ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800" role="alert">
            {clientError || (!payState.ok ? payState.error : "")}
          </div>
        ) : null}

        {/* Form Aksi Bayar */}
        <div className="mt-6">
          {midtransReady ? (
            <form action={formAction}>
              <input type="hidden" name="pembayaran_id" value={pembayaranId} />
              <Button
                type="submit"
                disabled={isPending || (sisaWaktu?.expired ?? false)}
                className="w-full min-h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-all shadow-sm"
              >
                {isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Menghubungkan ke Kasir...</span>
                  </span>
                ) : (
                  menungguBayar ? "Buka Kembali Jendela Kasir" : "Lanjutkan Pembayaran via Midtrans"
                )}
              </Button>
            </form>
          ) : (
            /* Fallback Mode Dev: Konfirmasi Manual */
            <div className="space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
                <p className="font-semibold text-slate-900">Mode Pengembangan (Gateway Belum Dikonfigurasi)</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Untuk menguji alur lunas tanpa API key gateway nyata, Anda dapat menekan tombol konfirmasi langsung di bawah ini.
                </p>
              </div>
              <form action={konfirmasiManual}>
                <input type="hidden" name="pembayaran_id" value={pembayaranId} />
                <input type="hidden" name="pendaftaran_id" value={pendaftaranId} />
                <input type="hidden" name="redirect_to" value={finishUrl} />
                <Button
                  type="submit"
                  variant="outline"
                  className="w-full min-h-11 rounded-lg font-medium text-xs border-slate-300 hover:bg-slate-50"
                >
                  Simulasikan Lunas (Khusus Dev)
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Garansi Keamanan & Kanal Info */}
        <div className="mt-5 border-t border-slate-100 pt-4 text-center">
          <p className="text-[11px] text-slate-400">
            Metode resmi: Virtual Account Bank (BCA, Mandiri, BRI, BNI), QRIS, & GoPay.
          </p>
        </div>
      </div>
    </>
  );
}
