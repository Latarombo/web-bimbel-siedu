import { notFound } from "next/navigation";

/**
 * Catch-all route untuk menangkap semua URL tak dikenal di bawah rute [locale].
 * Sesuai panduan resmi next-intl & Next.js App Router, pemanggilan notFound() di sini
 * akan langsung mengalirkan render ke app/[locale]/not-found.tsx.
 */
export default function CatchAllNotFound() {
  notFound();
}
