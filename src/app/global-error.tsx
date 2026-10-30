'use client';

import { useEffect } from "react";
import Link from "next/link";

/**
 * Global Error Boundary untuk menangani crash pada root layout.
 * Komponen ini menggantikan root layout sehingga wajib menyertakan tag <html> dan <body>.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("[Siedu Global Error]:", error);
  }, [error]);

  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white p-4 font-sans text-center text-slate-900 antialiased">
        <div className="mx-auto flex max-w-md flex-col items-center">
          <span className="mb-3 inline-flex items-center rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-rose-700">
            500 Fatal Error
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Terjadi Kesalahan Sistem
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Aplikasi mengalami kendala kritis saat memuat kerangka utama. Silakan coba muat ulang halaman.
          </p>

          {error.digest ? (
            <div className="mt-4 rounded border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-mono text-slate-500">
              ID Pelaporan: #{error.digest}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => retry()}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700 cursor-pointer"
            >
              Muat Ulang Halaman
            </button>
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
