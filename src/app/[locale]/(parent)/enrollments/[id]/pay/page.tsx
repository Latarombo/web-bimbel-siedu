import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { rupiah, fmtTanggal } from "@/lib/format";
import { SITE } from "@/lib/site";
import { midtransConfigured } from "@/lib/midtrans";
import { tagihanBerikutinya } from "@/lib/services/pembayaran";
import MidtransPayButton from "@/components/parent/midtrans-pay-button";
import { konfirmasiManual } from "@/app/actions/pembayaran";

export const dynamic = "force-dynamic";

// Halaman bayar satu tagihan. Tanpa gateway: instruksi transfer ke rekening
// lembaga + konfirmasi manual (hanya jalan saat MIDTRANS_SERVER_KEY kosong,
// lihat actions/pembayaran.ts). Dengan gateway: redirect ke Midtrans SNAP.

export default async function PayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tr = await getTranslations("parent");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({ href: "/login?next=/home", locale });
  }
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();
  const ortuId = Number(session.user.id);

  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pid)).all(),
  );
  if (!p) notFound();
  const [a, k] = await Promise.all([
    collect(db.orm.public.Anak.where((x) => x.id.eq(p.anakId)).all()),
    collect(db.orm.public.Kelas.where((x) => x.id.eq(p.kelasId)).all()),
  ]);
  if (!a[0] || a[0].orangTuaId !== ortuId) notFound();
  if (
    [
      "dibatalkan_timeout",
      "dibatalkan_tunggakan",
      "dibatalkan_orang_tua",
      "dibatalkan_kelas",
    ].includes(p.status)
  )
    notFound();

  const bill = await tagihanBerikutinya(pid);
  if (!bill) redirect({ href: `/enrollments/${pid}?semua=lunas`, locale });

  const mapel = k[0]
    ? (
        await collect(
          db.orm.public.MataPelajaran.where((m) =>
            m.id.eq(k[0].mataPelajaranId),
          ).all(),
        )
      )[0]?.nama
    : undefined;
  const gateway = midtransConfigured();
  const label =
    bill.tipe === "cicilan"
      ? tr("enrollInstallment", { number: bill.cicilanKe ?? 0 })
      : bill.tipe === "dp"
        ? tr("text045")
        : tr("text046");
  const jumlah = Number(bill.jumlah);

  const catatanTagihan = [
    bill.jatuhTempo
      ? tr("enrollDueNote", { date: fmtTanggal(bill.jatuhTempo, locale) })
      : tr("text049"),
    p.metodeBayar === "dp_cicilan" && p.tenorBulan
      ? tr("enrollManualScheme", { tenor: p.tenorBulan })
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-10">
      <p className="text-sm">
        <Link
          href={`/enrollments/${pid}`}
          className="text-muted underline underline-offset-4 hover:text-foreground"
        >
          {tr("text016")}
        </Link>
      </p>

      <header className="mt-3">
        <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
          {tr("text047")} {label}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {a[0].nama} · {mapel ?? `Kelas #${p.kelasId}`}
        </p>
      </header>

      <Card className="mt-6">
        <CardPad>
          <p className="text-sm text-muted">{tr("text048")}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground sm:text-3xl">
            {rupiah(jumlah)}
          </p>
          <p className="mt-2 text-xs leading-relaxed text-muted">{catatanTagihan}</p>
        </CardPad>
      </Card>

      <section className="mt-8">
        <h2 className="text-base font-semibold text-foreground">{tr("text050")}</h2>

        {gateway ? (
          <Card className="mt-3">
            <CardPad>
              <p className="text-sm font-semibold text-foreground">{tr("text051")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{tr("text052")}</p>
              <div className="mt-4">
                <MidtransPayButton
                  pembayaranId={bill.id}
                  label={`Bayar ${rupiah(jumlah)}`}
                />
              </div>
            </CardPad>
          </Card>
        ) : (
          <Card className="mt-3">
            <CardPad>
              <p className="text-sm font-semibold text-foreground">{tr("text053")}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{tr("text054")}</p>

              <dl className="mt-4 border-t border-slate-100 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-100 py-2.5">
                  <dt className="text-muted">{tr("text055")}</dt>
                  <dd className="font-medium text-foreground">{SITE.nama}</dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-100 py-2.5">
                  <dt className="text-muted">{tr("text056")}</dt>
                  <dd className="font-medium text-foreground">
                    {SITE.email} · {SITE.telepon}
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-100 py-2.5">
                  <dt className="text-muted">{tr("text057")}</dt>
                  <dd className="text-right font-medium text-foreground">
                    {label} ({a[0].nama}, #{bill.id})
                  </dd>
                </div>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                  <dt className="text-muted">{tr("text058")}</dt>
                  <dd className="font-semibold tabular-nums text-foreground">
                    {rupiah(jumlah)}
                  </dd>
                </div>
              </dl>

              <form action={konfirmasiManual} className="mt-4">
                <input type="hidden" name="pembayaran_id" value={bill.id} />
                <input type="hidden" name="pendaftaran_id" value={pid} />
                <Button type="submit" className="w-full min-h-11">
                  {tr("text059")}
                </Button>
              </form>
              <p className="mt-2 text-xs leading-relaxed text-muted">{tr("text060")}</p>
            </CardPad>
          </Card>
        )}
      </section>

      <p className="mt-6 text-xs text-muted">
        {tr("text061")} {SITE.email} / {SITE.telepon}.
      </p>
    </div>
  );
}
