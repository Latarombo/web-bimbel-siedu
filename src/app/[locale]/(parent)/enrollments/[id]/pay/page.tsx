import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

/**
 * Halaman /pay dialihkan langsung ke halaman utama /enrollments/[id]
 * yang kini telah mengintegrasikan kasir pembayaran instan Midtrans (Pola Ruangguru).
 */
export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const locale = await getLocale();
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  return redirect({ href: `/enrollments/${pid}`, locale });
}
