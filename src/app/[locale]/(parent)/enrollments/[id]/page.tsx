import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge, type StatusPendaftaran } from "@/components/status-badge";
import { Clock } from "lucide-react";
import { rupiah } from "@/lib/format";
import { sisaWaktu24Jam } from "@/lib/hari";

export const dynamic = "force-dynamic";

const COLLECT = async <T,>(src: AsyncIterable<T>) => {
  const out: T[] = [];
  for await (const r of src) out.push(r);
  return out;
};

export default async function EnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tr = await getTranslations("parent");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({href: "/login?next=/home", locale});
  }
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const ortuId = Number(session.user.id);

  // Pendaftaran harus milik anak milik orang tua ini.
  const [p] = await COLLECT(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pid)).all(),
  );
  if (!p) notFound();

  const [anak, kelas, tagihan, pengajuan] = await Promise.all([
  COLLECT(db.orm.public.Anak.where((a) => a.id.eq(p.anakId)).all()),
  COLLECT(db.orm.public.Kelas.where((k) => k.id.eq(p.kelasId)).all()),
  COLLECT(
  db.orm.public.Pembayaran.where((b) => b.pendaftaranId.eq(pid))
  .orderBy((b) => b.cicilanKe.asc())
  .all(),
  ),
  COLLECT(
  db.orm.public.PengajuanPembatalan.where((q) => q.pendaftaranId.eq(pid)).all(),
  ),
  ]);
  const a = anak[0];
  const k = kelas[0];
  const pengajuanMenunggu = pengajuan.find((q) => q.status === "menunggu");

  // Pastikan pendaftaran benar milik orang tua yang login.
  if (!a || a.orangTuaId !== ortuId) notFound();

  const mapel = k
    ? await COLLECT(
        db.orm.public.MataPelajaran.where((m) => m.id.eq(k.mataPelajaranId)).all(),
      )
    : [];
  const mapelNama = mapel[0]?.nama ?? `Kelas #${p.kelasId}`;

  const status = p.status as StatusPendaftaran;
  const aktif = ["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(status);
  const nextBill = tagihan.find((b) => b.status === "pending");
  const riwayat = tagihan.filter((b) => b.status !== "pending");

  // Perhitungan sisa waktu batas bayar 24 jam (server-side)
  const { isExpired, sisaJam, sisaMenit } = sisaWaktu24Jam(p.createdAt);

  const sisaWaktuTeks = isExpired
    ? tr("timeExpired")
    : sisaJam > 0
      ? tr("timeRemaining", { hours: sisaJam, minutes: sisaMenit })
      : tr("timeRemainingMinutesOnly", { minutes: sisaMenit });

  const metodeBayarTeks =
    p.metodeBayar === "dp_cicilan"
      ? p.tenorBulan
        ? tr("paymentMethodInstallment", { tenor: p.tenorBulan })
        : tr("paymentMethodInstallmentNoTenor")
      : tr("paymentMethodFull");

  const tagihanAwalNominal = nextBill ? Number(nextBill.jumlah) : 0;
  const tagihanAwalLabel =
    nextBill?.tipe === "dp"
      ? tr("text045")
      : nextBill?.tipe === "lunas"
        ? tr("text046")
        : tr("paymentSummaryAmount");

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <p className="text-sm text-muted">
        <Link href="/home" className="underline">{tr("text027")}</Link>
      </p>
      <header className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
             {tr("text028")} {a.nama}  {tr("text029")}{p.kelasId}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {k ? `${k.jenjang} · metode ${p.metodeBayar}` : ""}  {tr("text030")}{" "}
            {new Date(p.createdAt).toLocaleDateString("id-ID")}
          </p>
        </div>
        <StatusBadge status={status} />
      </header>

      {/* Card Utama: Menunggu Pembayaran (Prominent Amber Card) */}
      {status === "menunggu_pembayaran" ? (
        <div className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
                <Clock className="size-3.5 text-amber-700 shrink-0" aria-hidden="true" />
                {tr("pendingPaymentTitle")}
              </span>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-amber-950 sm:text-2xl">
                {tr("pendingPaymentTitle")}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-amber-800">
                {tr("pendingPaymentNotice")}
              </p>
            </div>

            <div className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs sm:text-sm font-semibold shadow-xs ${
              isExpired
                ? "border-red-300 bg-red-50 text-red-800"
                : "border-amber-300 bg-amber-100 text-amber-950"
            }`}>
              <Clock className={`size-4 shrink-0 ${isExpired ? "text-red-600" : "text-amber-700"}`} aria-hidden="true" />
              <span>{sisaWaktuTeks}</span>
            </div>
          </div>

          <div className="my-5 border-t border-amber-200/80" />

          {/* Ringkasan Pendaftaran */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200/70 bg-white/80 p-3.5 shadow-xs">
              <span className="block text-xs font-medium text-amber-800/80">{tr("paymentSummaryStudent")}</span>
              <span className="mt-0.5 block font-semibold text-slate-900">{a.nama}</span>
            </div>

            <div className="rounded-xl border border-amber-200/70 bg-white/80 p-3.5 shadow-xs">
              <span className="block text-xs font-medium text-amber-800/80">{tr("paymentSummaryClass")}</span>
              <span className="mt-0.5 block font-semibold text-slate-900">{mapelNama} · {k?.jenjang ?? ""}</span>
            </div>

            <div className="rounded-xl border border-amber-200/70 bg-white/80 p-3.5 shadow-xs">
              <span className="block text-xs font-medium text-amber-800/80">{tr("paymentSummaryMethod")}</span>
              <span className="mt-0.5 block font-semibold text-slate-900">{metodeBayarTeks}</span>
            </div>

            <div className="rounded-xl border border-amber-300 bg-white p-3.5 shadow-xs ring-1 ring-amber-300/40">
              <span className="block text-xs font-medium text-amber-900">{tagihanAwalLabel}</span>
              <span className="mt-0.5 block text-lg font-bold tabular-nums text-amber-950 sm:text-xl">
                {rupiah(tagihanAwalNominal)}
              </span>
            </div>
          </div>

          {/* Tombol Bayar Sekarang */}
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
            <p className="text-xs text-amber-800 leading-relaxed">
              {tr("payInstructionHint")}
            </p>
            <ButtonLink
              href={`/enrollments/${p.id}/pay`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-center text-sm sm:text-base font-bold text-white shadow-sm transition-all hover:bg-amber-700 hover:shadow-md active:scale-[0.99] shrink-0"
            >
              <span>{tr("payNowButton")}</span>
            </ButtonLink>
          </div>
        </div>
      ) : null}

      {status === "tertunggak" ? (
        <Card className="mt-4">
          <CardPad>
            <p className="text-sm text-red-700">
               {tr("text032")} </p>
          </CardPad>
        </Card>
      ) : null}
      {status.startsWith("dibatalkan") ? (
        <Card className="mt-4">
          <CardPad>
            <p className="text-sm text-muted">
               {tr("text033")} {status === "dibatalkan_timeout"
                ? tr("text034")
                : status === "dibatalkan_tunggakan"
                  ? tr("text035")
                  : status === "dibatalkan_orang_tua"
                    ? tr("text036")
                    : status.replaceAll("_", " ")}
              ).{status === "dibatalkan_orang_tua" ? tr("text037") : ""}
            </p>
          </CardPad>
        </Card>
      ) : null}

      {/* Tagihan aktif — tampil saat status aktif TAPI bukan menunggu_pembayaran (misal cicilan ke-2 dst, atau tertunggak) */}
      {nextBill && aktif && status !== "menunggu_pembayaran" ? (
        <Card className="mt-6 border-brand">
          <CardPad className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">{tr("text038")}</p>
              <p className="mt-1 text-lg font-bold">
                {nextBill.tipe === "cicilan" ? `Cicilan ke-${nextBill.cicilanKe}` : nextBill.tipe}{" "}
                — {rupiah(Number(nextBill.jumlah))}
              </p>
              <p className="text-sm text-muted">
                 {tr("text039")} {nextBill.jatuhTempo ? new Date(nextBill.jatuhTempo).toLocaleDateString("id-ID") : "-"}
              </p>
            </div>
            <ButtonLink href={`/enrollments/${p.id}/pay`}>{tr("text040")}</ButtonLink>
          </CardPad>
        </Card>
      ) : null}

      {/* Riwayat tagihan */}
      {riwayat.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase text-muted">{tr("text041")}</h2>
          <ul className="mt-3 grid gap-2">
            {riwayat.map((b) => (
              <li key={b.id}>
                <Card>
                  <CardPad className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3">
                    <span className="min-w-0 text-sm">
                      {b.tipe === "cicilan" ? `Cicilan ke-${b.cicilanKe}` : b.tipe} —{" "}
                      {rupiah(Number(b.jumlah))}
                    </span>
                    <Badge tone={b.status === "berhasil" ? "emerald" : "red"}>
                      {b.status}
                    </Badge>
                  </CardPad>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {aktif && status === "terdaftar" && !pengajuanMenunggu ? (
      <p className="mt-8 text-sm">
      <Link href={`/enrollments/${p.id}/cancel`} className="underline">
       {tr("text017")} </Link>{" "}
       {tr("text042")} </p>
      ) : null}
      {pengajuanMenunggu ? (
      <Card className="mt-8 border-amber-200 bg-amber-50">
      <CardPad className="py-3">
      <p className="text-sm text-amber-800">
       {tr("text043")}{pengajuanMenunggu.kategori.replaceAll("_", " ")}{tr("text044")}{" "}
      {new Date(pengajuanMenunggu.createdAt).toLocaleDateString("id-ID")}.
      </p>
      </CardPad>
      </Card>
      ) : null}
    </div>
  );
}
