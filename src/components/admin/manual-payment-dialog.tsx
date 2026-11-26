"use client";

import { useState, useTransition } from "react";
import { konfirmasiPembayaranManualAdmin } from "@/app/actions/admin";
import { rupiah } from "@/lib/format/format";

export function ManualPaymentDialog({
  pembayaranId,
  nominal,
  cicilanKe,
  tipe,
}: {
  pembayaranId: number;
  nominal: number;
  cicilanKe?: number | null;
  tipe: string;
}) {
  const [open, setOpen] = useState(false);
  const [catatan, setCatatan] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const labelTipe = tipe === "dp" ? "Uang Muka (DP)" : tipe === "cicilan" ? `Cicilan #${cicilanKe}` : "Pelunasan";

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await konfirmasiPembayaranManualAdmin(
        pembayaranId,
        catatan.trim() || `Pembayaran manual ${labelTipe} diterima di kantor bimbel`
      );
      if (res?.error) {
        setError(res.error);
      } else {
        setOpen(false);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        Konfirmasi Bayar
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-pay-title"
          >
            <h2 id="manual-pay-title" className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
              Konfirmasi Pembayaran Manual
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Konfirmasi penerimaan pembayaran secara tunai atau transfer langsung untuk tagihan <strong>{labelTipe}</strong> sebesar <strong>{rupiah(nominal)}</strong>.
            </p>

            {error ? (
              <div className="mt-3 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                {error}
              </div>
            ) : null}

            <div className="mt-4">
              <label htmlFor="catatan-manual" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Catatan Penerimaan (Opsional)
              </label>
              <textarea
                id="catatan-manual"
                rows={2}
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                placeholder="Contoh: Diterima tunai di meja kasir kantor bimbel"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                {isPending ? "Memproses..." : "Ya, Konfirmasi Lunas"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
