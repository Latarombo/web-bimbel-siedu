import Link from "next/link";

/**
 * Root fallback Not Found untuk request di luar jangkauan matcher proxy/next-intl.
 * Karena berada di luar app/[locale], komponen ini harus menyertakan tag <html> dan <body>.
 */
export default function RootNotFound() {
  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white p-4 font-sans text-center text-slate-900">
        <span className="mb-2 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-600">
          404 Error
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-2 max-w-md text-sm text-slate-600">
          Halaman yang Anda tuju tidak tersedia atau tautan salah.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          Kembali ke Beranda
        </Link>
      </body>
    </html>
  );
}
