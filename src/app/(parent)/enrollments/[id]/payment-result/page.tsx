import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { rupiah } from "@/lib/format";
import { SITE } from "@/lib/site";
import { midtransConfigured, snapStatus, isFinalStatus } from "@/lib/midtrans";
import {
  ORDER_ID,
  terapkanStatusMidtrans,
  tagihanBerikutinya,
} from "@/lib/services/pembayaran";

export const dynamic = "force-dynamic";

// C5 — Halaman kembali (finish URL Midtrans) + ringkasan status. Webhook adalah
// sumber kebenaran; halaman ini hanya menyegar satu transaksi kalau Midtrans
// mengirim order_id & statusnya final (praktik SNAP yang disarankan — webhook
// bisa tertunda beberapa detik). Lookup sekali per halaman, bukan polling.

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pembayaran?: string; status?: string }>;
};

export default async function PaymentResultPage({
  params,
  searchParams,
}: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/home");
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();
  const { pembayaran } = await searchParams;

  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pid)).all(),
  );
  if (!p) notFound();
  const [anak] = await collect(
    db.orm.public.Anak.where((x) => x.id.eq(p.anakId)).all(),
  );
  if (!anak || anak.orangTuaId !== Number(session.user.id)) notFound();

  const pembayaranId = Number(pembayaran);
  const bills = Number.isInteger(pembayaranId)
    ? await collect(
        db.orm.public.Pembayaran.where((b) => b.pendaftaranId.eq(pid)).all(),
      )
    : [];
  const bill = bills.find((b) => b.id === pembayaranId) ?? bills[0] ?? null;
  if (!bill) redirect(`/enrollments/${pid}`);

  // Segarkan dari gateway (hanya status final, hanya transaksi ini).
  if (midtransConfigured()) {
    try {
      const st = await snapStatus(ORDER_ID(bill.id));
      if (st && isFinalStatus(st))
        await terapkanStatusMidtrans(ORDER_ID(bill.id), st);
    } catch (e) {
      // Lookup gagal bukan akhir dunia — webhook tetap menyusul.
      console.error("[payment-result] lookup status gagal:", e);
    }
  }

  const [segar] = await collect(
    db.orm.public.Pembayaran.where((b) => b.id.eq(bill.id)).all(),
  );
  const tagihanLagi = await tagihanBerikutinya(pid);
  const [pSegar] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pid)).all(),
  );

  const ok = segar.status === "berhasil";
  const gagal = segar.status === "gagal";
  const label =
    segar.tipe === "cicilan"
      ? `Cicilan ke-${segar.cicilanKe}`
      : segar.tipe === "dp"
        ? "Uang muka (DP)"
        : "Pembayaran lunas";

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card>
        <CardPad className="text-center">
          <p
            className={`mx-auto grid size-12 place-items-center rounded-full text-2xl font-black ${
              ok
                ? "bg-emerald-100 text-emerald-700"
                : gagal
                  ? "bg-rose-100 text-rose-700"
                  : "bg-amber-100 text-amber-700"
            }`}
            aria-hidden="true"
          >
            {ok ? "✓" : gagal ? "✕" : "…"}
          </p>
          <h1 className="mt-4 text-xl font-bold tracking-tight">
            {ok
              ? "Pembayaran berhasil"
              : gagal
                ? "Pembayaran belum berhasil"
                : "Menunggu konfirmasi pembayaran"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {label} {rupiah(Number(segar.jumlah))} untuk {anak.nama}.
            {ok
              ? pSegar?.status === "terdaftar"
                ? " Pendaftaran aktif — kuota aman."
                : " Pembayaran tercatat; status menunggu tagihan berikutnya."
              : gagal
                ? " Ulangi pembayaran atau hubungi admin."
                : " Begitu gateway mengonfirmasi, status di sini berubah sendiri — tidak perlu bayar dua kali."}
          </p>
          {ok ? <Badge tone="emerald">status tagihan: berhasil</Badge> : null}
          {gagal ? <Badge tone="red">status tagihan: gagal</Badge> : null}
          {!ok && !gagal ? (
            <Badge tone="amber">status tagihan: {segar.status}</Badge>
          ) : null}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {ok && tagihanLagi ? (
              <ButtonLink href={`/enrollments/${pid}/pay`}>
                Lanjut bayar {labelBerikutnya(tagihanLagi)}
              </ButtonLink>
            ) : null}
            <ButtonLink
              href={`/enrollments/${pid}`}
              variant={ok && tagihanLagi ? "outline" : "default"}
            >
              Detail pendaftaran
            </ButtonLink>
            <ButtonLink href="/home" variant="outline">
              Kembali ke dashboard
            </ButtonLink>
          </div>
        </CardPad>
      </Card>

      <p className="mt-6 text-center text-xs text-muted">
        Gangguan pembayaran? Hubungi {SITE.email} / {SITE.telepon}.
      </p>
    </div>
  );
}

function labelBerikutnya(b: { tipe: string; cicilanKe: number | null }) {
  if (b.tipe === "cicilan") return `cicilan ke-${b.cicilanKe}`;
  return b.tipe === "dp" ? "DP" : "pembayaran";
}
