import Image from "next/image";
import Link from "next/link";

/**
 * Root fallback Not Found untuk request di luar jangkauan matcher proxy/next-intl.
 * Karena berada di luar app/[locale], komponen ini harus menyertakan tag <html> dan <body>.
 */
export default function RootNotFound() {
  return (
    <html lang="id">
      <body className="flex min-h-screen flex-col items-center justify-center bg-white p-4 font-sans text-center text-slate-900 antialiased">
        <div className="mx-auto flex w-full max-w-xl flex-col items-center">
          {/* 404 Illustration */}
          <div className="mb-6 w-full px-2">
            <Image
              src="/404.png"
              alt="Halaman Tidak Ditemukan"
              width={1774}
              height={887}
              className="h-auto w-full object-contain"
              priority
            />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Halaman Tidak Ditemukan
          </h1>
          <p className="mb-8 mt-2 max-w-md text-sm text-slate-600">
            Halaman yang Anda tuju tidak tersedia atau tautan salah.
          </p>
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-600 px-6 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </body>
    </html>
  );
}
